const { pool } = require("../config/db");


exports.getHealthStats = async () =>{

        const result = await pool.query(
            `SELECT 
            COUNT(*) AS n_charge_points,
            COUNT(*) FILTER (WHERE status <> 'offline') AS n_charge_points_online,
            COUNT(*) FILTER (WHERE status = 'offline') AS n_charge_points_offline
            FROM charger;`);        
        
        return {
            n_charge_points: result.rows[0].n_charge_points,
            n_charge_points_online: result.rows[0].n_charge_points_online,
            n_charge_points_offline: result.rows[0].n_charge_points_offline
        };

}