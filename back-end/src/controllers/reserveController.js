
const reserveModel = require("../models/reserveModel");
const ApiError = require("../utils/ApiError");
const { buildErrorLog } = require("../utils/utils");
const { checkDbConnection } = require("../utils/checkDbConnection");

exports.reserveCharger = async (req, res) => {
    try {
      const pointId = parseInt(req.params.id);
      let minutes = parseInt(req.params.minutes);
  
      if (!Number.isInteger(pointId) || pointId <= 0) {
        throw new ApiError(400, "Invalid point id", "Point id must be a positive integer");
      }
  
      // default minutes = 30
      if (isNaN(minutes)) {
        minutes = 30;
      }
      // max 2 hours
      minutes = Math.min(minutes, 120);
  
      const dbOk = await checkDbConnection();
      if (!dbOk) {
        throw new ApiError(400, "Database connection error");
      }

      const result = await reserveModel.reservePoint(pointId, minutes, 1);

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