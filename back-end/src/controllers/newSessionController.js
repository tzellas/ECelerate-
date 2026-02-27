const sessionModel = require("../models/newSessionModel");
const { buildErrorLog } = require("../utils/utils");
const { checkDbConnection } = require("../utils/checkDbConnection");
const ApiError = require("../utils/ApiError");

const REQUIRED_FIELDS = [
  "id",
  "starttime",
  "endtime",
  "startsoc",
  "endsoc",
  "totalkwh",
  "kwhprice",
  "Amount"
];

const TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

exports.newSession = async (req, res) => {
  try {
    const body = req.body;

    // Check body existence and type
    if (!req.body || typeof req.body !== "object") {
      throw new ApiError(400, "Request body is missing or empty");
    }
    // Check required fields
    for (const field of REQUIRED_FIELDS) {
      if (!(field in body)) {
        throw new ApiError(400, `Missing required field: ${field}`);
      }
    }

    // id
    const chargerId = parseInt(body.id);
    if (!Number.isInteger(chargerId) || chargerId <= 0) {
      throw new ApiError(400, "Invalid point id", "Point id must be a positive integer");
    }

    // timestamps
    if (
      !TIMESTAMP_REGEX.test(body.starttime) ||
      !TIMESTAMP_REGEX.test(body.endtime)
    ) {
      throw new ApiError(400, "Invalid timestamp format", "Expected YYYY-MM-DD hh:mm");
    }

    const startTime = new Date(body.starttime.replace(" ", "T"));
    const endTime = new Date(body.endtime.replace(" ", "T"));

    if (isNaN(startTime) || isNaN(endTime) || endTime < startTime) {
      throw new ApiError(400, "Invalid time range", "endtime must be after starttime");
    }

    // SOC
    const startSOC = parseInt(body.startsoc);
    const endSOC = parseInt(body.endsoc);

    if (
      !Number.isInteger(startSOC) || !Number.isInteger(endSOC) ||
      startSOC < 0 || startSOC > 100 ||
      endSOC < 0 || endSOC > 100 ||
      endSOC < startSOC
    ) {
      throw new ApiError(400, "Invalid SOC values", "SOC must be 0–100 and endsoc ≥ startsoc");
    }

    // numeric values
    const totalKwh = Number(body.totalkwh);
    const kwhPrice = Number(body.kwhprice);
    const Amount = Number(body.Amount);

    if (
      !Number.isFinite(totalKwh) || totalKwh <= 0 ||
      !Number.isFinite(kwhPrice) || kwhPrice <= 0 ||
      !Number.isFinite(Amount) || Amount <= 0
    ) {
      throw new ApiError(400, "Invalid numeric values", "Check totalkwh, kwhprice, Amount. These should be positive numeric values");
    }

    const dbOk = await checkDbConnection();
    if (!dbOk) {
      throw new ApiError(400, "Database connection error");
    }

    // Insert session
    await sessionModel.insertChargingSession({
      chargerId,
      starttime: body.starttime,
      endtime: body.endtime,
      startsoc: startSOC,
      endsoc: endSOC,
      totalkwh: totalKwh,
      kwhprice: kwhPrice,
      Amount,
      driverId: 1
    });

    // Success: 200 with empty body
    return res.status(200).send();

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
