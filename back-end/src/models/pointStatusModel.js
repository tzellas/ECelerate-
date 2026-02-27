const { pool } = require("../config/db");
const ApiError = require("../utils/ApiError");

exports.getPointStatus = async (chargerId, fromDate, toDate) => {

  // verify charger exists
  const exists = await pool.query(
    "SELECT 1 FROM charger WHERE charger_id = $1",
    [chargerId]
  );

  if (exists.rowCount === 0) {
    throw new ApiError(404, "Invalid point id", "Cannot find charge point with this ID in the database");
  }

  // fetch history
  const result = await pool.query(
    `
    SELECT
      to_char(changed_at, 'YYYY-MM-DD HH24:MI') AS timeref,
      old_status AS old_state,
      new_status AS new_state
    FROM charger_status_history
    WHERE charger_id = $1
      AND changed_at::date BETWEEN $2 AND $3
    ORDER BY changed_at DESC
    `,
    [chargerId, fromDate, toDate]
  );

  return result.rows;
};
