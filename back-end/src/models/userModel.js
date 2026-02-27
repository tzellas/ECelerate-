const { pool } = require("../config/db");

exports.getDriverById = async (driverId) => {
  const result = await pool.query(
    `
    SELECT
      driver_id,
      username,
      email,
      first_name,
      last_name,
      credit_points,
      balance
    FROM driver
    WHERE driver_id = $1
    `,
    [driverId]
  );

  return result.rowCount === 0 ? null : result.rows[0];
};
