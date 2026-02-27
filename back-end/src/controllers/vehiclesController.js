const ApiError = require("../utils/ApiError");
const { buildErrorLog } = require("../utils/utils");
const vehiclesModel = require("../models/vehiclesModel");

exports.getMyVehicles = async (req, res) => {
  try {
    if (!req.session?.driver) {
      throw new ApiError(401, "Not authenticated");
    }

    const driverId = req.session.driver.driver_id;

    const vehicles = await vehiclesModel.getVehiclesByDriverId(driverId);

    return res.status(200).json(vehicles);
  } catch (err) {
    if (err instanceof ApiError) {
      return res
        .status(err.statusCode)
        .json(buildErrorLog(req, err.statusCode, err.message));
    }

    return res
      .status(500)
      .json(buildErrorLog(req, 500, "Internal server error", err.message));
  }
};

exports.createMyVehicle = async (req, res) => {
    try {
        if (!req.session?.driver) {
            throw new ApiError(401, "Not authenticated");
        }
    
        const { license_plates, vehicle_type, model } = req.body;
    
        if (!license_plates || !vehicle_type || !model) {
            throw new ApiError(400, "Missing required fields");
        }
    
        const driverId = req.session.driver.driver_id;

        let batterySize;

        if (vehicle_type === "motorcycle") {
            batterySize = 15;
        } else if (vehicle_type === "car") {
            batterySize = 40;
        } else if (vehicle_type === "truck") {
            batterySize = 120;
        } else {
            throw new ApiError(400, "Invalid vehicle type");
        }
        
        await vehiclesModel.createVehicle({
            licensePlates: license_plates,
            vehicleType: vehicle_type,
            model,
            batterySize: batterySize,
            driverId
        });
    
        return res.status(201).json({ message: "Vehicle created" });
  
    } catch (err) {
        if (err instanceof ApiError) {
            return res
            .status(err.statusCode)
            .json(buildErrorLog(req, err.statusCode, err.message));
        }
    
        return res
            .status(500)
            .json(buildErrorLog(req, 500, "Internal server error", err.message));
        }
  };