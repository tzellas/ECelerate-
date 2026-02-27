const { pool } = require("../config/db");

exports.getAvailableYears = async (driverId) => {
  const result = await pool.query(
    `
    SELECT DISTINCT EXTRACT(YEAR FROM connection_time)::int AS year
    FROM charging
    WHERE driver_id = $1
    ORDER BY year;
    `,
    [driverId]
  );

  return result.rows.map(r => r.year);
};

exports.getMonthlyStats = async (driverId, year) => {
  const result = await pool.query(
    `
    WITH months AS (
      SELECT generate_series(1, 12) AS m
    )
    SELECT
      m,
      COALESCE(COUNT(c.charge_id), 0) AS sessions,
      COALESCE(SUM(c.kwh_needed), 0) AS energy,
      COALESCE(SUM(c.price), 0) AS money
    FROM months
    LEFT JOIN charging c
      ON c.driver_id = $1
     AND EXTRACT(YEAR FROM c.connection_time) = $2
     AND EXTRACT(MONTH FROM c.connection_time) = m
    GROUP BY m
    ORDER BY m;
    `,
    [driverId, year]
  );

  return result.rows;
};

exports.getYearlyStats = async (driverId, fromYear, toYear) => {
  const result = await pool.query(
    `
    WITH years AS (
      SELECT generate_series($2::int, $3::int) AS y
    )
    SELECT
      y,
      COALESCE(COUNT(c.charge_id), 0) AS sessions,
      COALESCE(SUM(c.kwh_needed), 0) AS energy,
      COALESCE(SUM(c.price), 0) AS money
    FROM years
    LEFT JOIN charging c
      ON c.driver_id = $1
     AND EXTRACT(YEAR FROM c.connection_time) = y
    GROUP BY y
    ORDER BY y;
    `,
    [driverId, fromYear, toYear]
  );

  return result.rows;
};
