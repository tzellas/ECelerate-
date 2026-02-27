const ApiError = require("../utils/ApiError");
const { buildErrorLog } = require("../utils/utils");
const userModel = require("../models/userModel");

exports.getMyProfile = async (req, res) => {
  try {
    if (!req.session?.driver) {
      throw new ApiError(401, "Not authenticated");
    }

    const driverId = req.session.driver.driver_id;

    const driver = await userModel.getDriverById(driverId);
    if (!driver) {
      throw new ApiError(404, "User not found");
    }

    return res.status(200).json(driver);
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