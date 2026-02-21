import { Router, Request, Response, NextFunction } from 'express';
import { Keypair } from '@stellar/stellar-sdk';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_EXPIRY = 3600;
const nonceStore = new Map<string, { nonce: string; expiresAt: number }>();

function createJwt(payload: Record<string, any>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(JSON.stringify({ ...payload, iat: now, exp: now + TOKEN_EXPIRY })).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

function decodeJwt(token: string): Record<string, any> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed token');
  const [header, body, sig] = parts;
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  if (sig !== expected) throw new Error('Invalid token signature');
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired');
  return payload;
}

function getChallenge(req: Request, res: Response): void {
  const address = req.query.address as string;
  if (!address) {
    res.status(400).json({ error: 'Missing address parameter' });
    return;
  }

  try {
    Keypair.fromPublicKey(address);
  } catch {
    res.status(400).json({ error: 'Invalid Stellar address' });
    return;
  }

  const nonce = crypto.randomBytes(32).toString('hex');
  nonceStore.set(address, { nonce, expiresAt: Date.now() + 5 * 60 * 1000 });
  res.json({ nonce });
}

export function verifySignature(req: Request, res: Response): void {
  const { address, signature } = req.body;
  if (!address || !signature) {
    res.status(400).json({ error: 'Missing address or signature' });
    return;
  }

  const stored = nonceStore.get(address);
  if (!stored || stored.expiresAt < Date.now()) {
    nonceStore.delete(address);
    res.status(401).json({ error: 'No valid challenge found' });
    return;
  }

  try {
    const keypair = Keypair.fromPublicKey(address);
    const valid = keypair.verify(
      Buffer.from(stored.nonce, 'hex'),
      Buffer.from(signature, 'base64')
    );
    if (!valid) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }
  } catch {
    res.status(401).json({ error: 'Signature verification failed' });
    return;
  }

  nonceStore.delete(address);
  const token = createJwt({ sub: address });
  res.json({ token, expiresIn: TOKEN_EXPIRY });
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  try {
    const payload = decodeJwt(authHeader.slice(7));
    (req as any).stellarAddress = payload.sub;
    next();
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
}

export const authRouter = Router();
authRouter.get('/challenge', getChallenge);
authRouter.post('/verify', verifySignature);

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
