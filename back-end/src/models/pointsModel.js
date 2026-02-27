const { pool } = require("../config/db");

exports.getPoints = async (point_status) => {
  const result = await pool.query(
    `SELECT 
    s.provider   AS "providerName",
    c.charger_id AS "pointid",
    s.lon,
    s.lat,
    c.status,
    c.cap
    FROM charger c
    JOIN station s ON c.station_id = s.station_id
    WHERE ($1 = '' OR c.status = $1::charger_status);
    `,
    [point_status]
  );

  return result.rows; 
};
