const ApiError = require("../utils/ApiError");
const { buildErrorLog } = require("../utils/utils");
const { checkDbConnection } = require("../utils/checkDbConnection");
const authModel = require("../models/authModel");

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body || {};

    if (!identifier || !password) {
      throw new ApiError(400, "Missing username/email or password");
    }

    const dbOk = await checkDbConnection();
    if (!dbOk) {
      throw new ApiError(400, "Database connection error");
    }

    const driver = await authModel.findDriverByIdentifier(identifier);
    if (!driver) {
      throw new ApiError(400, "Invalid credentials");
    }

    // PLAIN TEXT comparison - not too complex bycrypt logic
    if (driver.password !== password) {
      throw new ApiError(400, "Invalid credentials");
    }

    req.session.driver = {
      driver_id: driver.driver_id,
      username: driver.username,
      email: driver.email
    };

    return res.status(200).json({ message: "Login successful" });

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

exports.logout = (req, res) => {
  if (!req.session) {
    return res.status(200).send();
  }

  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({
        error: "Failed to logout"
      });
    }

    res.clearCookie("softeng.sid");
    return res.status(200).send();
  });
};


exports.me = (req, res) => {
  if (!req.session?.driver) {
    return res.status(401).json({ loggedIn: false });
  }

  return res.status(200).json({
    loggedIn: true,
    driver: req.session.driver
  });
};
