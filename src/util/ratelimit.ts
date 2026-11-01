import rateLimit from "express-rate-limit";
import { Status } from "../models/status";

function limiter(windowMinutes: number, limit: number, message: string)
{
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit: limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json(new Status(false, message));
    }
  });
}

// Limits are per client IP. Several users behind one office/cafe network share a bucket,
// so the login limit is deliberately generous.
export const loginLimiter = limiter(15, 30, "Too many login attempts, please try again later.");
export const signupLimiter = limiter(60, 10, "Too many sign-up attempts, please try again later.");
export const resetLimiter = limiter(60, 5, "Too many password reset requests, please try again later.");
export const publicStatsLimiter = limiter(1, 60, "Too many requests.");
