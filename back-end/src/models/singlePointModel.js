const { pool } = require("../config/db");

exports.getSinglePointById = async (id) => {
  const result = await pool.query(
    `SELECT
      c.charger_id AS "pointid",
      s.lon,
      s.lat,
      c.status,
      c.cap,
      CASE
        WHEN c.status = 'reserved' THEN
          COALESCE(
            to_char(
              (
                SELECT r.reservation_end_time
                FROM reserves_position r
                WHERE r.charger_id = c.charger_id
                ORDER BY r.reservation_end_time DESC
                LIMIT 1
              ),
              'YYYY-MM-DD HH24:MI'
            ),
            to_char(NOW(), 'YYYY-MM-DD HH24:MI')
          )
        ELSE to_char(NOW(), 'YYYY-MM-DD HH24:MI')
      END AS "reservationendtime",
      s.price_per_kwh AS "kwhprice"
    FROM charger c
    JOIN station s ON c.station_id = s.station_id
    WHERE c.charger_id = $1;`,
    [id]
  );

  return result.rows[0] || null;
};
