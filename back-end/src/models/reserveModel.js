const { pool } = require("../config/db");
const ApiError = require("../utils/ApiError");

exports.reservePoint = async (pointId, minutes, driverId) => {

  //  Check current status
  const charger = await pool.query(
    "SELECT status FROM charger WHERE charger_id = $1",
    [pointId]
  );

  if (charger.rowCount === 0) {
    throw new ApiError(404, "Invalid point id", "Cannot find charge point with this ID in the database");
  }

  const currentStatus = charger.rows[0].status;

  if (currentStatus !== "available") {
    return {
      pointid: pointId,
      status: currentStatus,
      reservationendtime: "1970-01-01 00:00"
    };
  }

  // Calculate reservation end time
  const reservationStart = new Date();
  const reservationEnd = new Date();
  reservationEnd.setMinutes(reservationEnd.getMinutes() + minutes);

  const reservation_price = Math.round(minutes * 0.1 * 100) / 100;

  // Insert reservation
  await pool.query(
    `
    INSERT INTO reserves_position
      (reservation_price, reservation_start_time, reservation_end_time, driver_id, charger_id)
    VALUES ($1, $2, $3, $4, $5)
    `,
    [
      reservation_price,
      reservationStart,
      reservationEnd,
      driverId,
      pointId
    ]
  );

  // Update DB
  await pool.query(
    `
    UPDATE charger
    SET status = 'reserved'
    WHERE charger_id = $1
    `,
    [pointId]
  );

  await pool.query(
    `
    INSERT INTO charger_status_history
    (charger_id, old_status, new_status)
    VALUES ($1, $2, $3);
    `,
    [pointId, currentStatus, 'reserved']
  );

  //  Return result
  return {
    pointid: pointId,
    status: "reserved",
    reservationendtime: reservationEnd
      .toISOString()
      .slice(0, 16)
      .replace("T", " ")
  };
};
