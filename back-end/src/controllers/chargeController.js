const chargeModel = require("../models/chargeModel");
const { buildErrorLog } = require("../utils/utils");
const ApiError = require("../utils/ApiError");
const { checkDbConnection } = require("../utils/checkDbConnection");


exports.initializeChargePage = async (req, res) => {
  try {
    if (!req.session?.driver) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const driverId = req.session.driver.driver_id;

    const [
      balance,
      vehicles,
      stationRows,
      activeReservation
    ] = await Promise.all([
      chargeModel.getBalanceAndPoints(driverId),
      chargeModel.getUserVehicles(driverId),
      chargeModel.getStationsWithAvailableChargers(),
      chargeModel.getActiveReservation(driverId)
    ]);

    // Group chargers by station
    const stationMap = {};
    stationRows.forEach(r => {
      if (!stationMap[r.station_id]) {
        stationMap[r.station_id] = {
          station_id: r.station_id,
          provider: r.provider,
          address: `${r.address_street} ${r.address_number}, ${r.postal_code} ${r.area}`,
          available_chargers: []
        };
      }
      stationMap[r.station_id].available_chargers.push(r.charger_id);
    });

    res.status(200).json({
      balance,
      vehicles,
      stations: Object.values(stationMap),
      activeReservation
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to initialize charge page" });
  }
};

exports.reserve = async (req, res) => {
    try {
        const pointId = parseInt(req.params.id);
        let minutes = parseInt(req.params.minutes);

        if (!req.session?.driver) {
            return res.status(401).json({
              error: "Not authenticated"
            });
        }

        const driverId = req.session.driver.driver_id;
    
        if (!Number.isInteger(pointId) || pointId <= 0) {
          throw new ApiError(400, "Invalid point id", "Point id must be a positive integer");
        }
    
        // default minutes = 120
        if (isNaN(minutes)) {
          minutes = 120;
        }
        // max 2 hours
        minutes = Math.min(minutes, 120);
    
        const dbOk = await checkDbConnection();
        if (!dbOk) {
          throw new ApiError(400, "Database connection error");
        }
  
        const result = await chargeModel.reserve(pointId, minutes, driverId);
  
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        return res.status(200).json(result);
    
    } catch (err) {
        if (err instanceof ApiError) {
          return res.status(err.statusCode).json(
            buildErrorLog(req, err.statusCode, err.message, err.debugInfo)
          );
        }    
    
        return res.status(500).json(
          buildErrorLog(req, 500, "Internal server error", err.message)
        );
    }
};

exports.storeChargingIntent = async (req, res) => {
    if (!req.session?.driver) {
      return res.status(401).json({ error: "Not authenticated" });
    }
  
    const { money, points, chargerId, stationId, vehiclePlate } = req.body;
  
    if (money <= 0 || points < 0 || points > money) {
      return res.status(400).json({ error: "Invalid charging intent" });
    }
  
    req.session.chargingIntent = {
      money,
      points,
      chargerId,
      stationId,
      vehiclePlate,
      createdAt: new Date()
    };
  
    return res.status(200).json({ message: "Charging intent stored" });
};
  
exports.startChargingFromReservedPosition = async (req, res) => {
    try {
      if (!req.session?.driver) {
        return res.status(401).json({ error: "Not authenticated" });
      }
  
      if (!req.session.chargingIntent) {
        return res.status(400).json({
          error: "No charging intent found"
        });
      }
  
      const driverId = req.session.driver.driver_id;
      const chargingIntent = req.session.chargingIntent;
  
      const result =
        await chargeModel.startChargingFromReservation(
          driverId,
          chargingIntent
        );
  
      const startSoc = Math.floor(Math.random() * 36) + 5;
      req.session.activeCharging = {
        driverId,
        chargerId: result.charger_id,
        stationId: result.station_id,
        vehiclePlate: chargingIntent.vehiclePlate,
        money: chargingIntent.money,
        points: chargingIntent.points,
        startSoc,
        startedAt: new Date()
      };
      delete req.session.chargingIntent;

      return res.status(200).json({
        message: "Charging started",
        charging_id: result.charging_id,
        charger_id: result.charger_id,
        reservation_price: result.reservation_price,
        amount : chargingIntent.money
      });
  
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({
          error: err.message,
          debug: err.debugInfo
        });
      }
  
      return res.status(500).json({
        error: "Failed to start charging"
      });
    }
};
  
exports.startChargingDirect = async (req, res) => {
    try {
      if (!req.session?.driver) {
        return res.status(401).json({ error: "Not authenticated" });
      }
  
      const driverId = req.session.driver.driver_id;
      const { chargerId, vehiclePlate, money, points } = req.body;
  
      if (!chargerId || !vehiclePlate) {
        return res.status(400).json({ error: "Missing data" });
      }
  
      const result = await chargeModel.startChargingDirect(
        driverId,
        chargerId,
        vehiclePlate,
        money,
        points
      );
  
      const startSoc = Math.floor(Math.random() * 36) + 5;
      req.session.activeCharging = {
        driverId,
        chargerId,
        stationId: result.station_id,
        vehiclePlate,
        money,
        points,
        startSoc,
        startedAt: new Date()
      };

      return res.status(200).json({
        message: "Charging started",
        charging_id: result.charging_id
      });
  
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
  
      return res.status(500).json({
        error: "Failed to start charging"
      });
    }
};

exports.stopCharging = async (req, res) => {
    try {
      if (!req.session?.driver) {
        return res.status(401).json({
          error: "Not authenticated"
        });
      }
  
      const driverId = req.session.driver.driver_id;
      const activeCharging = req.session.activeCharging;
      if (!activeCharging) {
        return res.status(404).json({
          error: "No active charging session"
        });
      }

      const result = await chargeModel.stopCharging(driverId, activeCharging);
  
      // Clear charging intent after completion
      delete req.session.chargingIntent;
      delete req.session.activeCharging;
  
      return res.status(200).json({
        message: "Charging completed",
        ...result
      });
  
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({
          error: err.message
        });
      }
  
      return res.status(500).json({
        error: "Failed to stop charging"
      });
    }
};
  
