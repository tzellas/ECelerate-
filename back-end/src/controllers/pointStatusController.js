const pointStatusModel = require("../models/pointStatusModel");
const { buildErrorLog } = require("../utils/utils");
const { toCSV } = require("../utils/csv");
const ApiError = require("../utils/ApiError");
const { checkDbConnection } = require("../utils/checkDbConnection");

const DATE_REGEX = /^\d{8}$/;

exports.getPointStatus = async (req, res) => {
  try {
    const { pointid, from, to } = req.params;
    const format = req.query.format || "json";

    // format validation
    if (!["json", "csv"].includes(format)) {
      throw new ApiError(400, "Invalid format", "Allowed: json, csv");
    }

    // pointid validation
    const chargerId = parseInt(pointid);
    if (!Number.isInteger(chargerId) || chargerId <= 0) {
      throw new ApiError(400, "Invalid point id", "Point id must be a positive integer");
    }

    // date validation
    if (!DATE_REGEX.test(from) || !DATE_REGEX.test(to)) {
      throw new ApiError(400, "Invalid date format", "Expected YYYYMMDD");
    }

    const fromDateStr = `${from.slice(0,4)}-${from.slice(4,6)}-${from.slice(6,8)}`;
    const toDateStr   = `${to.slice(0,4)}-${to.slice(4,6)}-${to.slice(6,8)}`;

    const fromDate = new Date(fromDateStr);
    const toDate   = new Date(toDateStr);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime()) || toDate < fromDate) {
      throw new ApiError(400, "Invalid date range", "Date To must be after Date From");
    }

    
    const dbOk = await checkDbConnection();
    if (!dbOk) {
      throw new ApiError(400, "Database connection error");
    }

    const rows = await pointStatusModel.getPointStatus(
      chargerId,
      fromDateStr,
      toDateStr
    );

    // no data
    if (rows.length === 0) {
      return res.status(204).send();
    }

    // CSV
    if (format === "csv") {
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        
        const header = ["timeref", "old_state", "new_state"];
        const csv = toCSV(header, rows);
        
        return res.status(200).send(csv);
    }

    // JSON
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).json(rows);

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
