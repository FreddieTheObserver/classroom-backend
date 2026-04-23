import request from "supertest";
import type { Express } from "express";
import type { Role } from "@prisma/client";
import { prisma } from "../../src/lib/prisma";
import { hashPassword } from "../../src/utils/password";

const COOKIE = process.env.SESSION_COOKIE_NAME ?? "classroom_sid";
const TEST_EMAIL_SUFFIX = "integration.local";

export function parseCookie(res: request.Response): string | undefined {
    const raw = res.headers["set-cookie"];
    if (!raw) return undefined;

    const arr = Array.isArray(raw) ? raw : [raw];
    const match = arr.find((c) => c.startsWith(`${COOKIE}=`));

    return match?.split(";")[0];
}

export async function loginAs(
    app: Express,
    role: Role,
    emailSuffix = TEST_EMAIL_SUFFIX,
): Promise<string> {
    const email = `${role.toLowerCase()}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 6)}@${emailSuffix}`;
    const password = "password123";

    if (role === "STUDENT") {
        const res = await request(app)
            .post("/api/auth/signup")
            .send({ email, password, name: `Test ${role}` });

        return parseCookie(res)!;
    }

    await prisma.user.create({
        data: {
            email,
            passwordHash: await hashPassword(password),
            name: `Test ${role}`,
            role,
        },
    });

    const login = await request(app)
        .post("/api/auth/login")
        .send({ email, password });

    return parseCookie(login)!;
}

export async function cleanTestUsers() {
    await prisma.user.deleteMany({
        where: { email: { endsWith: `@${TEST_EMAIL_SUFFIX}` } },
    });
}