const { HttpError } = require("../utils/HttpError");

function errorHandler(err, _req, res, _next) {
  const isHttp = err instanceof HttpError;
  let status = isHttp ? err.statusCode : 500;
  let message = isHttp ? err.message : "Internal Server Error";

  if (!isHttp && err) {
    if (err.name === "ValidationError" || err.name === "CastError" || err.name === "BSONError") {
      status = 400;
      message = err.message || "Invalid request data";
    } else if (err.code === 11000) {
      status = 409;
      message = err.message || "Duplicate key";
    } else if (
      err.type === "entity.too.large" ||
      err.status === 413 ||
      err.name === "PayloadTooLargeError"
    ) {
      status = 413;
      message = err.message || "Request body too large";
    }
  }

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error("[API]", err && err.name, err && err.message, err && err.stack);
  }

  res.status(status).json({
    message,
    ...(process.env.NODE_ENV !== "production" ? { stack: err.stack, name: err.name } : {}),
  });
}

module.exports = { errorHandler };
