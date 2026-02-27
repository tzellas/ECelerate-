const { buildErrorLog } = require("../utils/utils");
const updpointModel = require("../models/updpointModel");
const ApiError = require("../utils/ApiError");
const { checkDbConnection } = require("../utils/checkDbConnection");

const STATUS_ENUM = ["available", "charging", "reserved", "malfunction", "offline"];

exports.updpoint = async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);

    if (!Number.isInteger(id) || id <= 0) {
      throw new ApiError(400, "Invalid point id", "Point id must be a positive integer");
    }

    const { status, kwhprice } = req.body || {};

    if (status === undefined && kwhprice === undefined) {
      throw new ApiError(400, "Missing body fields.", "Provide status and/or kwhprice.");
    }
    if (status !== undefined && !STATUS_ENUM.includes(status)) {
      throw new ApiError(400, "Invalid status parameter", "Please try again with a valid status parameter : available, charging, reserved, malfunction, offline");
    }
    if (kwhprice !== undefined && (Number.isNaN(Number(kwhprice)) || Number(kwhprice) < 0)) {
      throw new ApiError(400, "Invalid kwhprice.", "kwhprice must be a non-negative number.");
    }

    
    const dbOk = await checkDbConnection();
    if (!dbOk) {
      throw new ApiError(400, "Database connection error");
    }

    const updated = await updpointModel.updatePoint(id, { status, kwhprice });

    if (!updated) {
      return res.status(204).send();
    }

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).json(updated);

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
