/**
 * Small typed error used across routes/validators. A route throws this and
 * the central error middleware in app.js turns it into a JSON response with
 * the right HTTP status code.
 */
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = { ApiError };
