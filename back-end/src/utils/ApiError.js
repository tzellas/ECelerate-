class ApiError extends Error {
    constructor(statusCode, message, debugInfo = "") {
      super(message);
      this.statusCode = statusCode;
      this.debugInfo = debugInfo;
    }
}
  
module.exports = ApiError;
  