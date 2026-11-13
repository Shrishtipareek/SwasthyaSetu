const { sendError } = require('../utils/http');

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Malformed JSON bodies / oversized payloads come from body-parser with err.status set.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Malformed JSON in request body' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body too large' });
  }

  if (!err.statusCode && !err.status && res.statusCode !== 200) {
    err.statusCode = res.statusCode;
  }

  return sendError(res, err);
};

module.exports = { notFound, errorHandler };
