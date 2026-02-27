const sessionModel = require("../models/sessionsModel");
const { buildErrorLog } = require("../utils/utils");
const { toCSV } = require("../utils/csv");
const { checkDbConnection } = require("../utils/checkDbConnection");
const ApiError = require("../utils/ApiError");

const DATE_REGEX = /^\d{8}$/; // YYYYMMDD

exports.getSessions = async (req, res) => {
  try {
    const { id, from, to } = req.params;
    const format = req.query.format || "json";

    if (!["json", "csv"].includes(format)) {
      throw new ApiError(400, "Invalid format", "Allowed: json, csv");
    }

    // Validate id
    const chargerId = parseInt(id);
    if (!Number.isInteger(chargerId) || chargerId <= 0) {
      throw new ApiError(400, "Invalid point id", "Point id must be a positive integer");
    }

    // Validate dates
    if (!DATE_REGEX.test(from) || !DATE_REGEX.test(to)) {
      throw new ApiError(400, "Invalid date format", "Expected YYYYMMDD");
    }

    // convert YYYYMMDD → YYYY-MM-DD
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

    const sessions = await sessionModel.getSessions(
      chargerId,
      fromDateStr,
      toDateStr
    );

    // No data → 204
    if (sessions.length === 0) {
      return res.status(204).send();
    }

    if (format === "csv") {
        res.setHeader("Content-Type", "text/csv; charset=utf-8");

        const header = ["starttime","endtime","startsoc","endsoc","totalkwh","kwhprice","amount"];
        const csv = toCSV(header, sessions);

        return res.status(200).type("text/csv; charset=utf-8").send(csv);
    }
  

    // Success → 200
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).json(sessions);

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
