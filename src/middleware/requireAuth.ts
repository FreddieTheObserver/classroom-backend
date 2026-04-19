import type { Request, Response, NextFunction } from 'express';
import type { Role } from '@prisma/client';
import { getSessionWithUser } from '../services/sessionService';

export interface AuthenticatedUser {
    id: string;
    email: string;
    name: string;
    role: Role;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const cookieName = process.env.SESSION_COOKIE_NAME ?? 'classroom_sid';
    const sessionId = req.cookies[cookieName];

    // no cookie -> 401 -> early return
    if (!sessionId) {
        res.status(401).json({ error: 'Unauthenticated' });
        return;
    }
    const session = await getSessionWithUser(sessionId);
    // Cookie present but session is dead -> clear
    if (!session) {
        res.clearCookie(cookieName);
        res.status(401).json({ error: 'Unauthenticated' });
        return;
    }

    req.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
    };
    next();
}