
// This function builds the errorlog for status codes 400, 404, 500
exports.buildErrorLog = (req, statusCode, errorMessage, debugInfo) => {

  const now = new Date();

  return {
    call: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
    timeref: now.toISOString(),
    originator: req.ip,
    return_code: statusCode,
    error: errorMessage,
    debuginfo: debugInfo || ""
  };

}
