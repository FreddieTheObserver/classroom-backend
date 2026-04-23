import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/index';
import { prisma } from '../src/lib/prisma';
import { loginAs, cleanTestUsers } from './helpers/auth';

const app = createApp();

beforeEach(async () => {
    await prisma.department.deleteMany({});
    await cleanTestUsers();
});

afterAll(async() => {
    await prisma.$disconnect();
});

describe("POST /api/departments", () => {
    it("admin can create a department", async () => {
        const cookie = await loginAs(app, "ADMIN");

        const res = await request(app)
            .post("/api/departments")
            .set("Cookie", cookie)
            .send({
                name: "Computer Science",
                code: "CSC",
                description: "The CS dept",
            });
        expect(res.status).toBe(201);
        expect(res.body.department.name).toBe("Computer Science");
        expect(res.body.department.code).toBe("CSC");
        expect(res.body.department.id).toBeTruthy();
    });

    describe("GET /api/departments", () => {
        it("lists all departments (authed)", async () => {
            const cookie = await loginAs(app, "ADMIN");

            await request(app)
                .post("/api/departments")
                .set("Cookie", cookie)
                .send({ name: "A", code: "A1" });
            await request(app)
                .post("/api/departments")
                .set("Cookie", cookie)
                .send({ name: "B", code: "B1" });

            const res = await request(app)
                .get("/api/departments")
                .set("Cookie", cookie);

            expect(res.status).toBe(200);
            expect(res.body.departments).toHaveLength(2);
        });
    });

    describe("GET /api/departments/:id", () => {
        it("returns one department", async () => {
            const cookie = await loginAs(app, "ADMIN");

            const created = await request(app)
                .post("/api/departments")
                .set("Cookie", cookie)
                .send({ name: "Math", code: "MATH" });

            expect(created.status).toBe(201);

            const res = await request(app)
                .get(`/api/departments/${created.body.department.id}`)
                .set("Cookie", cookie);

            expect(res.status).toBe(200);
            expect(res.body.department.code).toBe("MATH");
        });

        it("returns 404 for a missing id", async () => {
            const cookie = await loginAs(app, "ADMIN");

            const res = await request(app)
                .get("/api/departments/nonexistent-cuid")
                .set("Cookie", cookie);

            expect(res.status).toBe(404);
        });
    });
});