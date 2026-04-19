import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createUser, authenticate } from '../services/authService';
import { createSession, deleteSession, SESSION_DURATION_MS } from '../services/sessionService';

const COOKIE = process.env.SESSION_COOKIE_NAME ?? 'classroom_sid';
const isProd = process.env.NODE_ENV === 'production';

const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

function setSessionCookie(res: Response, sessionId: string) {
    res.cookie(COOKIE, sessionId, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: SESSION_DURATION_MS,
        path: '/',
    });
}

function publicUser(user: { id: string; email: string; name: string; role: "ADMIN" | "TEACHER" | "STUDENT" }) {
    return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function signup(req: Request, res: Response, next: NextFunction) {
    try {
        const body = signupSchema.parse(req.body);
        const user = await createUser(body);
        const session = await createSession(user.id);
        setSessionCookie(res, session.id);
        res.status(201).json({ user: publicUser(user) });
    } catch (error) {
        next(error);
    }
}

export async function login(req: Request, res: Response, next: NextFunction) {
    try {
        const body = loginSchema.parse(req.body);
        const user = await authenticate(body.email, body.password);
        const session = await createSession(user.id);
        setSessionCookie(res, session.id);
        res.status(200).json({ user: publicUser(user) });
    } catch (error) {
        next(error);
    }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
    try {
        const sessionId = req.cookies[COOKIE];
        if (sessionId) await deleteSession(sessionId);
        res.clearCookie(COOKIE, { path: '/' });
        res.status(204).end();
    } catch (error) {
        next(error);
    }
}

export async function me(req: Request, res: Response) {
    res.json({ user: req.user });
}