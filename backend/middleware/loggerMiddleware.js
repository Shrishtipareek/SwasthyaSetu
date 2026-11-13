/**
 * Morgan-equivalent HTTP Request Logger Middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const { method, originalUrl } = req;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '127.0.0.1';

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const color = statusCode >= 500 ? '\x1b[31m' // Red
      : statusCode >= 400 ? '\x1b[33m' // Yellow
      : statusCode >= 300 ? '\x1b[36m' // Cyan
      : '\x1b[32m'; // Green
    const reset = '\x1b[0m';

    console.log(
      `[${new Date().toISOString()}] ${method} ${originalUrl} ${color}${statusCode}${reset} ${duration}ms - ${ip}`
    );
  });

  next();
};

module.exports = requestLogger;

