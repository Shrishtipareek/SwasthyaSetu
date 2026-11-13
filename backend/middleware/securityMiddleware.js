/**
 * Lightweight security middleware with no extra dependencies:
 * - security headers for a JSON API
 * - an in-memory, per-IP rate limiter (fine for a single Node process)
 */

// Helmet-equivalent headers for a JSON API.
const securityHeaders = (req, res, next) => {
  res.removeHeader('X-Powered-By');
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    // Modern guidance (and Helmet's default): disable the legacy XSS auditor.
    'X-XSS-Protection': '0',
    'X-DNS-Prefetch-Control': 'off',
    'X-Download-Options': 'noopen',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'Origin-Agent-Cluster': '?1',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  });
  if (process.env.NODE_ENV === 'production') {
    res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
};

const positiveIntFromEnv = (name, fallback) => {
  const n = Number(process.env[name]);
  return Number.isInteger(n) && n > 0 ? n : fallback;
};

/**
 * @param {object} options
 * @param {number} options.windowMs  window length in ms
 * @param {number} options.max       requests allowed per window and IP
 * @param {boolean} [options.failedOnly] only count responses with status >= 400
 *   (used for login so normal sign-ins never hit the limit)
 */
const createRateLimiter = ({ windowMs, max, failedOnly = false, message }) => {
  const hits = new Map();

  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, windowMs);
  sweep.unref();

  return (req, res, next) => {
    const key = req.ip || (req.socket && req.socket.remoteAddress) || 'unknown';
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }

    if (entry.count >= max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ message: message || 'Too many requests. Please try again later.' });
    }

    if (failedOnly) {
      res.on('finish', () => {
        if (res.statusCode >= 400) entry.count += 1;
      });
    } else {
      entry.count += 1;
    }
    return next();
  };
};

// 300 requests / minute / IP for the whole API (search-as-you-type makes many calls).
const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: positiveIntFromEnv('RATE_LIMIT_MAX', 300),
});

// 10 failed login / registration attempts per 15 minutes per IP.
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: positiveIntFromEnv('AUTH_RATE_LIMIT_MAX', 10),
  failedOnly: true,
  message: 'Too many failed attempts. Please wait 15 minutes and try again.',
});

// CareAI: protects the Gemini quota.
const aiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: positiveIntFromEnv('AI_RATE_LIMIT_MAX', 20),
  message: 'CareAI request limit reached. Please wait a moment before sending more messages.',
});

// Emergency dispatch: generous, because several people can share one IP (campus/hospital NAT).
const emergencyLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: positiveIntFromEnv('EMERGENCY_RATE_LIMIT_MAX', 30),
  message: 'Emergency dispatch rate limit reached. Please call 102/108/112 directly.',
});

module.exports = { securityHeaders, createRateLimiter, apiLimiter, authLimiter, aiLimiter, emergencyLimiter };
