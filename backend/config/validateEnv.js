/**
 * Startup Environment Validation.
 *
 * Kept as the documented entry point (see README); the logic lives in ./env so
 * that JWT secret handling has a single source of truth shared with token
 * signing/verification.
 */
const { validateEnv } = require('./env');

module.exports = validateEnv;
