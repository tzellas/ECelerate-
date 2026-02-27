const { pool } = require("../config/db");


exports.createChargers = async (rows) =>{

        for(const row of rows){

            const result = await pool.query(
            `
            SELECT COALESCE(MAX(charger_number), 0) AS max
            FROM charger
            WHERE station_id = $1
            `,
            [row.station_id]
            );

            const maxChargerNumber = Number(result.rows[0].max);

            await pool.query(
            `INSERT INTO charger (station_id, status, cap, charger_number)
            VALUES ($1, $2, $3, $4)
            RETURNING station_id`,
            [
                row.station_id,
                row.status,
                row.cap,
                maxChargerNumber+1,
            ]
            );

            await pool.query(
                `UPDATE station
                SET num_chargers = num_chargers + 1
                WHERE station_id = $1
                `,
                [row.station_id]
            )
            }
}
