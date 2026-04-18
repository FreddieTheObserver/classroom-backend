import { randomBytes } from 'node:crypto';
import { prisma } from '../lib/prisma';

export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

function generateSessionId(): string {
    return randomBytes(32).toString('base64url');
}

export async function createSession(userId: string) {
    const id = generateSessionId();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    return prisma.session.create({ data: { id, userId, expiresAt }});
}

export async function getSessionWithUser(sessionId: string) {
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: true }
    });
    if (!session) return null;
    if (session.expiresAt.getTime() <= Date.now()) {
        await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
        return null;
    }
    return session;
}

export async function deleteSession(sessionId: string) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
}