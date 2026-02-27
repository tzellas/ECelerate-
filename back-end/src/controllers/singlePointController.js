const { buildErrorLog } = require("../utils/utils");
const singlePointModel = require("../models/singlePointModel");
const { checkDbConnection } = require("../utils/checkDbConnection");
const ApiError = require("../utils/ApiError");

exports.singlePoint = async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);

    if (!Number.isInteger(id) || id <= 0) {
      throw new ApiError(400, "Invalid point id", "Point id must be a positive integer");
    }


    const dbOk = await checkDbConnection();
    if (!dbOk) {
      throw new ApiError(400, "Database connection error");
    }

    const point = await singlePointModel.getSinglePointById(id);

    if (!point) {
      return res.status(204).send();
    }

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).json(point);

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
