const { pool } = require("../config/db");

exports.checkDbConnection = async () => {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch (err) {
    return false;
  }
};
