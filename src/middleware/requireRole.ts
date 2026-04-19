import type { Request, Response, NextFunction } from 'express';
import type { Role } from '@prisma/client';

export function requireRole(...allowed: Role[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthenticated' });
            return;
        }
        if (!allowed.includes(req.user.role)) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        next();
    }
}