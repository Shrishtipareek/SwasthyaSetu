/**
 * Production Security Headers Middleware (Helmet specification)
 */
const securityHeaders = (req, res, next) => {
  // Remove Express fingerprint
  res.removeHeader('X-Powered-By');

  // Set standard Helmet security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Origin-Agent-Cluster', '?1');
  
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
};

/**
 * Route-specific and global rate limiter
 */
const createRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
  const max = options.max || 100; // max requests
  const message = options.message || 'Too many requests from this IP, please try again later.';
  
  const hits = new Map();

  // Cleanup old entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of hits.entries()) {
      const active = timestamps.filter(t => now - t < windowMs);
      if (active.length === 0) {
        hits.delete(ip);
      } else {
        hits.set(ip, active);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const timestamps = (hits.get(ip) || []).filter(t => now - t < windowMs);

    if (timestamps.length >= max) {
      res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
      return res.status(429).json({ message });
    }

    timestamps.push(now);
    hits.set(ip, timestamps);
    next();
  };
};

module.exports = {
  securityHeaders,
  createRateLimiter
};

