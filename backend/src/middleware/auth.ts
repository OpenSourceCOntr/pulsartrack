import { Request, Response, NextFunction } from 'express';
import { Keypair } from '@stellar/stellar-sdk';

/**
 * Middleware: Validate Stellar address in request headers
 * Expects: X-Stellar-Address header
 */
export function requireStellarAddress(req: Request, res: Response, next: NextFunction): void {
  const address = req.headers['x-stellar-address'] as string;

  if (!address) {
    res.status(401).json({ error: 'Missing X-Stellar-Address header' });
    return;
  }

  try {
    // Validate address format (throws if invalid)
    Keypair.fromPublicKey(address);
    (req as any).stellarAddress = address;
    next();
  } catch {
    res.status(400).json({ error: 'Invalid Stellar address format' });
  }
}

/**
 * Middleware: Rate limiting by IP
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(maxRequests = 100, windowMs = 60_000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    let entry = rateLimitMap.get(ip);
    if (!entry || entry.resetAt < now) {
      entry = { count: 1, resetAt: now + windowMs };
      rateLimitMap.set(ip, entry);
    } else {
      entry.count++;
    }

    if (entry.count > maxRequests) {
      res.status(429).json({ error: 'Too many requests' });
      return;
    }

    next();
  };
}

/**
 * Middleware: Error handler
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
}
