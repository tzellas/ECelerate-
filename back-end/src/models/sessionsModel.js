const { pool } = require("../config/db");
const ApiError = require("../utils/ApiError");

exports.getSessions = async (chargerId, fromDate, toDate) => {

  // Find station of this charger
  const chargerRes = await pool.query(
    "SELECT station_id FROM charger WHERE charger_id = $1",
    [chargerId]
  );

  if (chargerRes.rowCount === 0) {
    throw new ApiError(404, "Invalid point id", "Cannot find charge point with this ID in the database");
  }

  const stationId = chargerRes.rows[0].station_id;

  // Fetch charging sessions
  const result = await pool.query(
    `
    SELECT
      to_char(connection_time, 'YYYY-MM-DD HH24:MI')   AS starttime,
      to_char(disconnection_time, 'YYYY-MM-DD HH24:MI') AS endtime,
      start_soc   AS startsoc,
      end_soc     AS endsoc,
      kwh_needed  AS totalkwh,
      kwh_price   AS kwhprice,
      price       AS amount
    FROM charging
    WHERE station_id = $1
      AND connection_time::date BETWEEN $2 AND $3
    ORDER BY connection_time DESC
    `,
    [stationId, fromDate, toDate]
  );

  return result.rows;
};
