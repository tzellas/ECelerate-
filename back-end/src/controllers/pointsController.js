const { buildErrorLog } = require("../utils/utils");
const pointsModel = require("../models/pointsModel");
const ApiError = require("../utils/ApiError");
const { toCSV } = require("../utils/csv");
const { checkDbConnection } = require("../utils/checkDbConnection");

exports.points = async (req, res) => {
  try {
    let point_status = req.query.status;
    const format = req.query.format || "json";

    if (!["json", "csv"].includes(format)) {
      throw new ApiError(400, "Invalid format", "Allowed: json, csv");
    }

    if (point_status === undefined || point_status === "") {
      point_status = "";
    } else {
      const status_enum = ["available", "charging", "reserved", "malfunction", "offline"];
      if (!status_enum.includes(point_status)) {
        throw new ApiError(400, "Invalid status parameter", "Please try again with a valid status parameter : available, charging, reserved, malfunction, offline");
      }
    }

    const dbOk = await checkDbConnection();
    if (!dbOk) {
      throw new ApiError(400, "Database connection error");
    }

    const points = await pointsModel.getPoints(point_status);

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");

      const header = ["providerName","pointid","lon","lat","status","cap"];
      const csv = toCSV(header, points);
      
      return res.status(200).send(csv);
    }

    // default JSON
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).json(points);

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
