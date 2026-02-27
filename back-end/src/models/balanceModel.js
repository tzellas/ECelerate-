const { pool } = require("../config/db");

exports.getDriverBalance = async (driverId) => {
    const res = await pool.query(
        `
        SELECT balance, credit_points
        FROM driver
        WHERE driver_id = $1
        `,
        [driverId]
    );

    return res.rows[0];
};

exports.getRecentPayments = async (driverId, limit = 5) => {
    const res = await pool.query(
        `
        SELECT
        paid_at,
        charge_id,
        price_paid,
        points_used
        FROM payment
        WHERE driver_id = $1
        ORDER BY paid_at DESC
        LIMIT $2
        `,
        [driverId, limit]
    );

    return res.rows;
};

exports.addBalance = async (driverId, amount) => {
    await pool.query(
      `
      UPDATE driver
      SET balance = balance + $1
      WHERE driver_id = $2
      `,
      [amount, driverId]
    );
    
  };
  