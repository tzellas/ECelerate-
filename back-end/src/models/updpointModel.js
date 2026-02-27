const { pool } = require("../config/db");
const ApiError = require("../utils/ApiError");

exports.updatePoint = async (id, { status, kwhprice }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const prevRes = await client.query(
      "SELECT status, station_id FROM charger WHERE charger_id = $1 FOR UPDATE",
      [id]
    );

    if (prevRes.rowCount === 0) {
      throw new ApiError(404, "Invalid point id", "Cannot find charge point with this ID in the database");
    }

    const prevStatus = prevRes.rows[0].status;
    const stationId = prevRes.rows[0].station_id;

    const result = await client.query(
      `UPDATE charger
       SET status = COALESCE($2, status)
       WHERE charger_id = $1
       RETURNING charger_id AS "pointid", status`,
      [id, status ?? null]
    );

    if (status !== undefined && status !== prevStatus) {
      await client.query(
        `
        INSERT INTO charger_status_history (charger_id, old_status, new_status)
        VALUES ($1, $2, $3)
        `,
        [id, prevStatus, status]
      );
    }

    if (kwhprice !== undefined) {
      await client.query(
        `UPDATE station
         SET price_per_kwh = $2
         WHERE station_id = $1;`,
        [stationId, kwhprice]
      );
    }

    const priceRes = await client.query(
      "SELECT price_per_kwh FROM station WHERE station_id = $1",
      [stationId]
    );

    await client.query("COMMIT");

    return {
      pointid: result.rows[0].pointid,
      status: result.rows[0].status,
      kwhprice: priceRes.rows[0].price_per_kwh
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
