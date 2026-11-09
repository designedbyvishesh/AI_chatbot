/**
 * Security basics for the web server.
 *
 * - Security headers (helmet), set so Google sign-in pop-ups still work
 * - Only our own site may call the API from a browser (CORS)
 * - Request limits: per address for the whole API, and per signed-in person
 *   for the AI routes, so nobody can drain the Groq quota
 */

const helmet = require('helmet');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');

const num = (v, fallback) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : fallback);

const LIMITS = {
  apiPer15Min: num(process.env.RATE_LIMIT_API_PER_15_MIN, 300),
  aiPerMinute: num(process.env.RATE_LIMIT_AI_PER_MINUTE, 20),
  aiPerDay: num(process.env.RATE_LIMIT_AI_PER_DAY, 150)
};

function securityHeaders() {
  return helmet({
    // The pages use inline scripts and styles plus Google Fonts and Firebase;
    // a content policy needs its own careful pass, so it is left off for now.
    contentSecurityPolicy: false,
    // Google sign-in opens a pop-up that must be able to report back to this page
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
  });
}

/**
 * Browsers on other websites may not call this API. Extra origins (e.g. a
 * custom domain that serves the pages from somewhere else) can be listed in
 * ALLOWED_ORIGINS, comma-separated. Same-origin requests never need CORS.
 */
function corsPolicy() {
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  return cors({
    origin: (origin, cb) => cb(null, Boolean(origin) && allowed.includes(origin)),
    credentials: false
  });
}

const tooMany = (message) => (req, res) =>
  res.status(429).json({ success: false, code: 'rate_limited', error: message });

/** Every /api request, counted per IP address. */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: LIMITS.apiPer15Min,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: tooMany('Too many requests from this network. Please wait a few minutes and try again.')
});

// AI routes are counted per signed-in person (runs after requireUser)
const byUser = (req) => (req.user && req.user.uid ? `user:${req.user.uid}` : `ip:${req.ip}`);

const aiBurstLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: LIMITS.aiPerMinute,
  keyGenerator: byUser,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: tooMany('Rabbit needs a short breather. Try again in a minute.')
});

const aiDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  limit: LIMITS.aiPerDay,
  keyGenerator: byUser,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: tooMany(`You've used today's ${LIMITS.aiPerDay} Rabbit answers. Your limit resets tomorrow.`)
});

/** Only POST requests call the AI; reading topic lists etc. is not counted. */
const onlyPost = (limiter) => (req, res, next) => (req.method === 'POST' ? limiter(req, res, next) : next());
const aiLimiters = [onlyPost(aiBurstLimiter), onlyPost(aiDailyLimiter)];

module.exports = { securityHeaders, corsPolicy, apiLimiter, aiLimiters, LIMITS };
