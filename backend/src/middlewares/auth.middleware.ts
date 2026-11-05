import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { DataStore } from '../database/store';
import { User, UserRole } from '../shared/types';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { userId: string };
    const user = DataStore.users.get(payload.userId);
    if (!user) {
      res.status(401).json({ error: 'User does not exist' });
      return;
    }
    if (user.isBlocked) {
      res.status(403).json({ error: 'Your account has been suspended by administration' });
      return;
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is expired or invalid' });
    return;
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ 
        error: `Forbidden: This resource requires one of the following roles: [${roles.join(', ')}]` 
      });
      return;
    }
    next();
  };
}
