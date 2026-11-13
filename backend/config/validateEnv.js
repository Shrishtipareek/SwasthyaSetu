/**
 * Startup Environment Validation
 */
const validateEnv = () => {
  const isProd = process.env.NODE_ENV === 'production';
  const errors = [];
  const warnings = [];

  // JWT Secret validation
  if (!process.env.JWT_SECRET) {
    if (isProd) {
      errors.push('CRITICAL: JWT_SECRET must be configured in environment variables for production.');
    } else {
      process.env.JWT_SECRET = 'swasthya_setu_secure_jwt_secret_key_9f8d7c6b5a4e3d2c1b0a';
      warnings.push('JWT_SECRET not set in .env; using secure development default.');
    }
  } else if (process.env.JWT_SECRET.length < 16) {
    errors.push('CRITICAL: JWT_SECRET must be at least 16 characters long for cryptographic security.');
  }

  // Database URI
  if (!process.env.MONGO_URI) {
    if (isProd) {
      errors.push('CRITICAL: MONGO_URI must be provided in production.');
    } else {
      process.env.MONGO_URI = 'mongodb://localhost:27017/SwasthyaSetu';
      warnings.push('MONGO_URI not specified; defaulting to local MongoDB instance.');
    }
  }

  // Warnings report
  warnings.forEach(w => console.warn(`[ENV WARNING] ${w}`));

  // Errors report
  if (errors.length > 0) {
    errors.forEach(e => console.error(`[ENV ERROR] ${e}`));
    throw new Error('Environment variable validation failed. Server will not start.\n' + errors.join('\n'));
  }

  console.log('[ENV VALIDATION] All required environment variables successfully verified.');
};

module.exports = validateEnv;

