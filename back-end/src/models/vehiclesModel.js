const { pool } = require("../config/db");

exports.getVehiclesByDriverId = async (driverId) => {
  const result = await pool.query(
    `
    SELECT
      license_plates,
      vehicle_type,
      model,
      battery_size
    FROM vehicle
    WHERE driver_id = $1
    ORDER BY license_plates
    `,
    [driverId]
  );

  return result.rows;
};

exports.createVehicle = async ({
    licensePlates,
    vehicleType,
    model,
    batterySize,
    driverId
  }) => {
    await pool.query(
      `
      INSERT INTO vehicle
        (license_plates, vehicle_type, model, battery_size, driver_id)
      VALUES
        ($1, $2, $3, $4, $5)
      `,
      [licensePlates, vehicleType, model, batterySize, driverId]
    );
  };