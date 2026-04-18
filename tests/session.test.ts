import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/utils/password';
import {
    createSession,
    getSessionWithUser,
    deleteSession,
    SESSION_DURATION_MS,
} from '../src/services/sessionService';

let userId: string;

beforeAll(async () => {
    const user = await prisma.user.create({
        data: {
            email: 'session-test@example.com',
            passwordHash: await hashPassword('pw'),
            name: 'Session Test',
            role: 'STUDENT',
        },
    });
    userId = user.id;
});

afterEach(async () => {
    await prisma.session.deleteMany({ where: { userId } });
});

describe('session utils', () => {
    it("createSession returns a session id and persists the row", async () => {
        const { id, expiresAt } = await createSession(userId);
        expect(id.length).toBeGreaterThanOrEqual(40);
        expect(expiresAt.getTime() - Date.now()).toBeGreaterThan(SESSION_DURATION_MS - 5_000);
        const row = await prisma.session.findUnique({ where: { id } });
        expect(row?.userId).toBe(userId);
    });

    it("getSessionWithUser returns the user for a valid session", async () => {
        const { id } = await createSession(userId);
        const result = await getSessionWithUser(id);
        expect(result?.user.email).toBe("session-test@example.com");
    });

    it("getSessionWithUser returns null for an expired session", async () => {
        const { id } = await createSession(userId);
        await prisma.session.update({
            where: { id },
            data: { expiresAt: new Date(Date.now() - 1000) },
        });
        const result = await getSessionWithUser(id);
        expect(result).toBeNull();
    });

    it("getSessionWithUser returns null for an unknown session id", async () => {
        expect(await getSessionWithUser("does-not-exist")).toBeNull();
    });

    it("deleteSession removes the row", async () => {
        const { id } = await createSession(userId);
        await deleteSession(id);
        expect(await prisma.session.findUnique({ where: { id } })).toBeNull();
    });
});