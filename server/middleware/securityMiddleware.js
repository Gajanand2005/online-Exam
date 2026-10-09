import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

export function applySecurity(app) {
  // Behind a reverse proxy (Render, Railway, nginx) set TRUST_PROXY=1 so limits apply
  // per client instead of to the proxy's single IP.
  if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);

  app.use(helmet());

  // A school lab usually shares one public IP, and answers autosave as students click,
  // so the general limit is per IP but generous.
  const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: Number(process.env.RATE_LIMIT_PER_MINUTE) || 1000,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // The teacher/principal passwords are fixed, so slow down password guessing.
  // Only failed attempts count.
  const staffLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many failed logins. Try again in 15 minutes.' },
  });
  app.use(['/api/auth/teacher/login', '/api/auth/principal/login', '/api/teacher/login'], staffLoginLimiter);
}
