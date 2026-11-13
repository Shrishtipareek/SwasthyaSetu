// Shared CORS policy for the REST API and Socket.IO.
const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];

/** CLIENT_URL may be a comma-separated list of allowed frontend origins. */
const getAllowedOrigins = () => {
  const configured = (process.env.CLIENT_URL || '').split(',').map((o) => o.trim()).filter(Boolean);
  return configured.length ? configured : DEV_ORIGINS;
};

/**
 * Development: any origin is accepted (Vite may pick another port).
 * Production: only whitelisted origins; requests without an Origin header
 * (curl, server-to-server, mobile apps) are allowed.
 */
const corsOrigin = (origin, callback) => {
  if (!origin || process.env.NODE_ENV !== 'production' || getAllowedOrigins().includes(origin)) {
    return callback(null, true);
  }
  const err = new Error('CORS policy: this origin is not allowed to access the API');
  err.statusCode = 403;
  return callback(err);
};

module.exports = { corsOrigin, getAllowedOrigins };
