const { pool } = require("../config/db");
const ApiError = require("../utils/ApiError");

/* BALANCE & POINTS */
exports.getBalanceAndPoints = async (driverId) => {
  const res = await pool.query(
    `
    SELECT balance, credit_points
    FROM driver
    WHERE driver_id = $1
    `,
    [driverId]
  );

  return {
    money: Number(res.rows[0].balance),
    points: res.rows[0].credit_points
  };
};

/* USER VEHICLES */
exports.getUserVehicles = async (driverId) => {
  const res = await pool.query(
    `
    SELECT license_plates, model, vehicle_type
    FROM vehicle
    WHERE driver_id = $1
    `,
    [driverId]
  );

  return res.rows;
};

/* STATIONS WITH AVAILABLE CHARGERS */
exports.getStationsWithAvailableChargers = async () => {
  const res = await pool.query(
    `
    SELECT
      s.station_id,
      s.provider,
      s.address_street,
      s.address_number,
      s.postal_code,
      s.area,
      c.charger_id
    FROM station s
    JOIN charger c ON c.station_id = s.station_id
    WHERE c.status = 'available'
    ORDER BY s.provider
    `
  );

  return res.rows;
};

/* ACTIVE RESERVATION */
exports.getActiveReservation = async (driverId) => {
  const res = await pool.query(
    `
    SELECT
      r.reservation_id,
      r.charger_id,
      r.reservation_start_time,
      r.reservation_end_time,
      r.reservation_price,
      s.provider,
      s.address_street,
      s.address_number,
      s.postal_code,
      s.area
    FROM reserves_position r
    JOIN charger c ON c.charger_id = r.charger_id
    JOIN station s ON s.station_id = c.station_id
    WHERE r.driver_id = $1
      AND NOW() BETWEEN r.reservation_start_time AND r.reservation_end_time
    LIMIT 1
    `,
    [driverId]
  );

  return res.rows[0] || null;
};


exports.reserve = async (pointId, minutes, driverId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const charger = await client.query(
      "SELECT status FROM charger WHERE charger_id = $1 FOR UPDATE",
      [pointId]
    );

    if (charger.rowCount === 0) {
      throw new ApiError(404, "Invalid point id");
    }

    const currentStatus = charger.rows[0].status;

    if (currentStatus !== "available") {
      throw new ApiError(
        409,
        "Charger not available",
        `Charger is currently ${currentStatus}`
      );
    }

    const reservationStart = new Date();
    const reservationEnd = new Date();
    reservationEnd.setMinutes(reservationEnd.getMinutes() + minutes);

    const reservation_price =
      Math.round(minutes * 0.1 * 100) / 100;

    await client.query(
      `
      INSERT INTO reserves_position
        (reservation_price, reservation_start_time, reservation_end_time, driver_id, charger_id)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [reservation_price, reservationStart, reservationEnd, driverId, pointId]
    );

    await client.query(
      `
      UPDATE charger
      SET status = 'reserved'
      WHERE charger_id = $1
      `,
      [pointId]
    );

    await client.query(
      `
      INSERT INTO charger_status_history
        (charger_id, old_status, new_status)
      VALUES ($1, $2, $3)
      `,
      [pointId, currentStatus, "reserved"]
    );

    await client.query("COMMIT");

    return {
      pointid: pointId,
      status: "reserved",
      reservation_price,
      reservationendtime: reservationEnd
        .toISOString()
        .slice(0, 16)
        .replace("T", " ")
    };

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

exports.startChargingFromReservation = async (driverId, chargingIntent) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock active reservation
    const res = await client.query(
      `
      SELECT *
      FROM reserves_position
      WHERE driver_id = $1
        AND reservation_end_time > NOW()
      ORDER BY reservation_start_time DESC
      LIMIT 1
      FOR UPDATE
      `,
      [driverId]
    );

    if (res.rowCount === 0) {
      throw new ApiError(404, "No active reservation");
    }

    const reservation = res.rows[0];
    const now = new Date();

    // Check expiration
    if (now > reservation.reservation_end_time) {
      throw new ApiError(
        409,
        "Reservation lost",
        "Reservation expired before charging started"
      );
    }

    // Recalculate price
    const minutesUsed = Math.max(
      1,
      Math.ceil(
        (now - reservation.reservation_start_time) / 60000
      )
    );

    const mins = Math.max(1, minutesUsed);
    const reservationPrice = Math.round(mins * 0.1 * 100) / 100;

    // Update reservation
    await client.query(
      `
      UPDATE reserves_position
      SET reservation_end_time = $1,
          reservation_price = $2
      WHERE reservation_id = $3
      `,
      [now, reservationPrice, reservation.reservation_id]
    );

    // Update charger status
    await client.query(
      `
      UPDATE charger
      SET status = 'charging'
      WHERE charger_id = $1
      `,
      [reservation.charger_id]
    );

    await client.query(
      `
      INSERT INTO charger_status_history
      (charger_id, old_status, new_status)
      VALUES ($1, 'reserved', 'charging')
      `,
      [reservation.charger_id]
    );

    const chargerInfo = await client.query(
      "SELECT station_id FROM charger WHERE charger_id = $1",
      [reservation.charger_id]
    );
    const stationId = chargerInfo.rows[0]?.station_id;

    await client.query("COMMIT");

    return {
      charging_id: null,
      charger_id: reservation.charger_id,
      station_id: stationId,
      reservation_price: reservationPrice,
      started_at: now
    };

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

exports.startChargingDirect = async (
  driverId,
  chargerId,
  vehiclePlate,
  money,
  points
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock charger
    const chargerRes = await client.query(
      `
      SELECT status
      FROM charger
      WHERE charger_id = $1
      FOR UPDATE
      `,
      [chargerId]
    );

    if (chargerRes.rowCount === 0) {
      throw new ApiError(404, "Invalid charger");
    }

    if (chargerRes.rows[0].status !== "available") {
      throw new ApiError(409, "Charger not available");
    }

    // Update charger → charging
    await client.query(
      `
      UPDATE charger
      SET status = 'charging'
      WHERE charger_id = $1
      `,
      [chargerId]
    );

    await client.query(
      `
      INSERT INTO charger_status_history
      (charger_id, old_status, new_status)
      VALUES ($1, 'available', 'charging')
      `,
      [chargerId]
    );

    // Create charging session
    const stationRes = await client.query(
      "SELECT station_id FROM charger WHERE charger_id = $1",
      [chargerId]
    );
    const stationId = stationRes.rows[0]?.station_id;

    await client.query("COMMIT");

    return {
      charging_id: null,
      station_id: stationId
    };

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

exports.stopCharging = async (driverId, activeCharging) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const now = new Date();
    const startedAt = new Date(activeCharging.startedAt);

    // Calculate duration (1 sec = 1 euro)
    const secondsCharged = Math.floor(
      (now - startedAt) / 1000
    );

    const eurosCharged = Math.min(
      secondsCharged,
      activeCharging.money
    );

    const pointsUsedFinal = Math.min(
      activeCharging.points,
      eurosCharged
    );

    const moneyCharged = eurosCharged - pointsUsedFinal;
    const pointsEarned = Math.floor(eurosCharged / 10);

    const stationRes = await client.query(
      "SELECT price_per_kwh FROM station WHERE station_id = $1",
      [activeCharging.stationId]
    );
    const kwhPrice = stationRes.rows[0]?.price_per_kwh ?? null;
    const kwhNeeded =
      kwhPrice && Number(kwhPrice) > 0
        ? Math.round((eurosCharged / Number(kwhPrice)) * 100) / 100
        : null;

    const startSoc = Number.isFinite(activeCharging.startSoc)
      ? activeCharging.startSoc
      : 5;
    const minutesCharged = Math.ceil(secondsCharged / 60);
    const endSoc = Math.min(100, startSoc + minutesCharged);

    const insertRes = await client.query(
      `
      INSERT INTO charging
        (connection_time, disconnection_time, start_soc, end_soc, kwh_needed, kwh_price, price, driver_id, license_plates, station_id)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING charge_id
      `,
      [
        startedAt,
        now,
        startSoc,
        endSoc,
        kwhNeeded,
        kwhPrice,
        eurosCharged,
        driverId,
        activeCharging.vehiclePlate,
        activeCharging.stationId
      ]
    );

    await client.query(
      `
      INSERT INTO payment
        (price_paid, paid_at, points_used, driver_id, charge_id)
      VALUES
        ($1, $2, $3, $4, $5)
      `,
      [moneyCharged, now, pointsUsedFinal, driverId, insertRes.rows[0].charge_id]
    );

    // Update driver
    await client.query(
      `
      UPDATE driver
      SET
        balance = balance - $1,
        credit_points = credit_points - $2 + $3
      WHERE driver_id = $4
      `,
      [
        moneyCharged,
        pointsUsedFinal,
        pointsEarned,
        driverId
      ]
    );

    // Free charger
    await client.query(
      `
      UPDATE charger
      SET status = 'available'
      WHERE charger_id = $1
      `,
      [activeCharging.chargerId]
    );

    await client.query(
      `
      INSERT INTO charger_status_history
        (charger_id, old_status, new_status)
      VALUES ($1, 'charging', 'available')
      `,
      [activeCharging.chargerId]
    );

    await client.query("COMMIT");

    return {
      charge_id: insertRes.rows[0].charge_id,
      euros_charged: eurosCharged,
      money_charged: moneyCharged,
      points_used: pointsUsedFinal,
      points_earned: pointsEarned,
      duration_seconds: secondsCharged,
      start_soc: startSoc,
      end_soc: endSoc
    };

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
