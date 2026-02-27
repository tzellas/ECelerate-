const { pool } = require("../config/db");
const ApiError = require("../utils/ApiError");

exports.insertChargingSession = async ({
  chargerId,
  starttime,
  endtime,
  startsoc,
  endsoc,
  totalkwh,
  kwhprice,
  Amount,
  driverId
}) => {
  // 1) Find station_id from charger
  const chargerRes = await pool.query(
    "SELECT station_id, status FROM charger WHERE charger_id = $1",
    [chargerId]
  );


  if (chargerRes.rowCount === 0) {
    throw new ApiError(404, "Invalid point id", "Cannot find charge point with this ID in the database");
  }

  const stationId = chargerRes.rows[0].station_id;
  const currentStatus =  chargerRes.rows[0].status;

  if (currentStatus !== "reserved" && currentStatus !== "available") {
    throw new ApiError(400, "Charger not available or reserved", `Cannot start charging because this charging point's status is ${currentStatus}`);
  }

  // 2) Find a vehicle for this driver (required by charging table)
  const vehicleRes = await pool.query(
    "SELECT license_plates FROM vehicle WHERE driver_id = $1 LIMIT 1",
    [driverId]
  );

  if (vehicleRes.rowCount === 0) {
    throw new ApiError(404, "No vehicle found", `There is no vehicle for the driver with driver_id=${driverId} in the database`);
  }

  const licensePlates = vehicleRes.rows[0].license_plates;

  await pool.query(
    `
    UPDATE charger
    SET status = 'charging'
    WHERE charger_id = $1
    `,
    [chargerId]
  );

  await pool.query(
    `
    INSERT INTO charger_status_history
    (charger_id, old_status, new_status, changed_at)
    VALUES ($1, $2, $3, $4);
    `,
    [chargerId, currentStatus, 'charging', starttime]
  );

  // 3) Insert into charging table (mapping fields)
  await pool.query(
    `
    INSERT INTO charging
      (connection_time, disconnection_time, start_soc, end_soc, kwh_needed, kwh_price, price,
       driver_id, license_plates, station_id)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7,
       $8, $9, $10)
    `,
    [
      starttime,
      endtime,
      startsoc,
      endsoc,
      totalkwh,
      kwhprice,
      Amount,
      driverId,
      licensePlates,
      stationId
    ]
  );
  
  await pool.query(
    `
    UPDATE charger
    SET status = 'available'
    WHERE charger_id = $1
    `,
    [chargerId]
  );

  await pool.query(
    `
    INSERT INTO charger_status_history
    (charger_id, old_status, new_status, changed_at)
    VALUES ($1, $2, $3, $4);
    `,
    [chargerId, 'charging', 'available', endtime]
  );
};
