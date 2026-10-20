/**
 * High-performance In-Memory Sliding Window Rate Limiter
 */

class RateLimiter {
  constructor(windowMs, maxRequests, message = 'Too many requests, please try again later.') {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.message = message;
    this.hits = new Map();

    // Auto-cleanup stale IPs every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [ip, record] of this.hits.entries()) {
        if (now - record.startTime > this.windowMs) {
          this.hits.delete(ip);
        }
      }
    }, 5 * 60 * 1000).unref();
  }

  middleware() {
    return (req, res, next) => {
      // Bypass only in an explicit test environment. Never via a request header.
      if (process.env.NODE_ENV === 'test' && process.env.DISABLE_RATE_LIMIT === 'true') {
        return next();
      }
      // Use Express' resolved client IP. Do not read X-Forwarded-For directly:
      // it is client-controlled unless trust proxy is configured correctly.
      const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const now = Date.now();

      let record = this.hits.get(ip);
      if (!record || now - record.startTime > this.windowMs) {
        record = {
          startTime: now,
          count: 1,
        };
        this.hits.set(ip, record);
      } else {
        record.count++;
      }

      const remaining = Math.max(0, this.maxRequests - record.count);
      const resetTime = new Date(record.startTime + this.windowMs).toISOString();

      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', resetTime);

      if (record.count > this.maxRequests) {
        return res.status(429).json({
          success: false,
          code: 'RATE_LIMIT_EXCEEDED',
          message: this.message,
          retryAfterMs: record.startTime + this.windowMs - now,
        });
      }

      next();
    };
  }

  // Helper to reset a specific IP (useful in unit tests)
  resetIp(ip) {
    this.hits.delete(ip);
  }

  // Clear all
  resetAll() {
    this.hits.clear();
  }
}

// 15 requests per 15 minutes for auth endpoints
const authRateLimiter = new RateLimiter(15 * 60 * 1000, 15, 'Too many authentication attempts. Please try again after 15 minutes.');

// 60 requests per 15 minutes for public order/booking checkout
const checkoutRateLimiter = new RateLimiter(15 * 60 * 1000, 60, 'High checkout activity detected. Please try again in a few minutes.');

// 1000 requests per 15 minutes for general API
const generalRateLimiter = new RateLimiter(15 * 60 * 1000, 1000, 'Too many requests. Please slow down.');

module.exports = {
  RateLimiter,
  authRateLimiter,
  checkoutRateLimiter,
  generalRateLimiter,
};
