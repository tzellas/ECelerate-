const { pool } = require("../config/db");

exports.findDriverByIdentifier = async (identifier) => {
  const result = await pool.query(
    `
    SELECT driver_id, username, email, password
    FROM driver
    WHERE username = $1 OR email = $1
    LIMIT 1
    `,
    [identifier]
  );

  return result.rowCount === 0 ? null : result.rows[0];
};
