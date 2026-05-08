import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/index';
import { prisma } from '../src/lib/prisma';

const app = createApp();
const COOKIE = process.env.SESSION_COOKIE_NAME ?? 'classroom_sid';

beforeEach(async () => {
    const testUsers = await prisma.user.findMany({
        where: { email: { endsWith: '@example.com' } },
        select: { id: true },
    });
    const ids = testUsers.map((u) => u.id);
    if (ids.length > 0) {
        await prisma.session.deleteMany({ where: { userId: { in: ids } } });
        await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
});

function getCookie(res: request.Response): string | undefined {
    const raw = res.headers["set-cookie"];
    if (!raw) return undefined;
    const arr = Array.isArray(raw) ? raw : [raw];
    const match = arr.find((c) => c.startsWith(`${COOKIE}=`));
    return match?.split(";")[0];
}

describe("POST /api/auth/signup", () => {
    it("creates a student user and sets a session cookie", async () => {
        const res = await request(app)
            .post("/api/auth/signup")
            .send({ email: "s@example.com", password: "password123", name: "S" });
        expect(res.status).toBe(201);
        expect(res.body.user.email).toBe("s@example.com");
        expect(res.body.user.role).toBe("STUDENT");
        expect(res.body.user.passwordHash).toBeUndefined();
        expect(getCookie(res)).toBeDefined();
    });

    it("rejects duplicate email", async () => {
        await request(app)
            .post("/api/auth/signup")
            .send({ email: "dup@example.com", password: "password123", name: "A" });
        const res = await request(app)
            .post("/api/auth/signup")
            .send({ email: "dup@example.com", password: "password123", name: "B" });
        expect(res.status).toBe(409);
    });

    it("rejects invalid input", async () => {
        const res = await request(app)
            .post("/api/auth/signup")
            .send({ email: "not-an-email", password: "short", name: "" });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("ValidationError");
    });
})

describe("POST /api/auth/login", () => {
    beforeEach(async () => {
        await request(app)
            .post("/api/auth/signup")
            .send({ email: "u@example.com", password: "password123", name: "U" });
    });

    it("sets a cookie on correct password", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "u@example.com", password: "password123" });
        expect(res.status).toBe(200);
        expect(getCookie(res)).toBeDefined();
    });

    it("returns 401 on incorrect password", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "u@example.com", password: "wrong-password" });
        expect(res.status).toBe(401);
    });
});

describe("GET /api/auth/me", () => {
    it("returns 401 without a cookie", async () => {
        const res = await request(app).get("/api/auth/me");
        expect(res.status).toBe(401);
    });

    it("returns the user with a valid cookie", async () => {
        const signup = await request(app)
            .post("/api/auth/signup")
            .send({ email: "m@example.com", password: "password123", name: "M" });
        const cookie = getCookie(signup)!;
        const res = await request(app).get("/api/auth/me").set("Cookie", cookie);
        expect(res.status).toBe(200);
        expect(res.body.user.email).toBe("m@example.com");
    });
});

describe("POST api/auth/logout", () => {
    it("clears the cookie and invalidates the session", async () => {
        const signup = await request(app)
            .post("/api/auth/signup")
            .send({ email: "l@example.com", password: "password123", name: "L" });
        const cookie = getCookie(signup)!;
        const logout = await request(app).post("/api/auth/logout").set("Cookie", cookie);
        expect(logout.status).toBe(204);
        const me = await request(app).get("/api/auth/me").set("Cookie", cookie);
        expect(me.status).toBe(401);
    });
});