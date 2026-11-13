// Development-only fallback (the same value the rest of the codebase historically used).
const DEFAULT_DEV_SECRET = 'swasthya_setu_secure_jwt_secret_key_9f8d7c6b5a4e3d2c1b0a';
const DEFAULT_DEV_MONGO_URI = 'mongodb://localhost:27017/SwasthyaSetu';

let warned = false;

const isProduction = () => process.env.NODE_ENV === 'production';

/**
 * Single source of truth for the JWT secret so token signing (authController),
 * verification (authMiddleware, optional auth) and socket auth can never drift apart.
 */
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (isProduction()) {
    throw new Error('JWT_SECRET must be set in production');
  }
  if (!warned) {
    console.warn('[ENV WARNING] JWT_SECRET not set in .env; using an insecure development default.');
    warned = true;
  }
  return DEFAULT_DEV_SECRET;
};

/** Validate environment at boot; fail fast only for settings that make the app unusable. */
const validateEnv = () => {
  const errors = [];
  const warnings = [];

  const port = process.env.PORT;
  if (port && (!/^\d+$/.test(port) || Number(port) <= 0 || Number(port) > 65535)) {
    errors.push(`Invalid PORT value: ${port}`);
  }

  const secret = process.env.JWT_SECRET;
  if (isProduction()) {
    if (!secret || secret.length < 32) errors.push('JWT_SECRET must be at least 32 characters in production.');
    if (!process.env.MONGO_URI) errors.push('MONGO_URI must be provided in production.');
  } else {
    if (!secret) {
      // Export the default so any code reading process.env.JWT_SECRET agrees with getJwtSecret().
      process.env.JWT_SECRET = DEFAULT_DEV_SECRET;
      warned = true;
      warnings.push('JWT_SECRET not set in .env; using an insecure development default.');
    } else if (secret.length < 16) {
      warnings.push('JWT_SECRET is shorter than 16 characters; use a long random value.');
    }
    if (!process.env.MONGO_URI) {
      warnings.push(`MONGO_URI not specified; defaulting to ${DEFAULT_DEV_MONGO_URI}.`);
    }
  }

  warnings.forEach((w) => console.warn(`[ENV WARNING] ${w}`));
  if (errors.length > 0) {
    errors.forEach((e) => console.error(`[ENV ERROR] ${e}`));
    throw new Error(`Environment variable validation failed. Server will not start.\n${errors.join('\n')}`);
  }
};

module.exports = { getJwtSecret, validateEnv, DEFAULT_DEV_MONGO_URI };
