import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/index';
import { prisma } from '../src/lib/prisma';
import { loginAs, cleanTestUsers } from './helpers/auth';

const app = createApp();

beforeEach(async () => {
    await prisma.subject.deleteMany({});
    await prisma.department.deleteMany({});
    await cleanTestUsers();
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

    describe("POST /api/departments - validation + auth", () => {
        it("returns 409 on duplicate code", async () => {
            const cookie = await loginAs(app, "ADMIN");

            await request(app)
                .post("/api/departments")
                .set("Cookie", cookie)
                .send({ name: "A", code: "DUP" });

            const res = await request(app)
                .post("/api/departments")
                .set("Cookie", cookie)
                .send({ name: "Another", code: "DUP" });

            expect(res.status).toBe(409);
        });

        it("returns 400 on invalid code format", async () => {
            const cookie = await loginAs(app, "ADMIN");

            const res = await request(app)
                .post("/api/departments")
                .set("Cookie", cookie)
                .send({ name: "A", code: "lower" });

            expect(res.status).toBe(400);
        });

        it("returns 403 when a student tries to create", async () => {
            const cookie = await loginAs(app, "STUDENT");

            const res = await request(app)
                .post("/api/departments")
                .set("Cookie", cookie)
                .send({ name: "A", code: "CSE" });

            expect(res.status).toBe(403);
        });

        it("returns 401 without a session cookie", async () => {
            const res = await request(app)
                .post("/api/departments")
                .send({ name: "A", code: "CSE" });

            expect(res.status).toBe(401);
        });
    });

    describe("PATCH /api/departments/:id", () => {
        it("updates name and description", async () => {
            const cookie = await loginAs(app, "ADMIN");

            const created = await request(app)
                .post("/api/departments")
                .set("Cookie", cookie)
                .send({ name: "Old", code: "X1" });

            const res = await request(app)
                .patch(`/api/departments/${created.body.department.id}`)
                .set("Cookie", cookie)
                .send({ name: "New", description: "Updated" });

            expect(res.status).toBe(200);
            expect(res.body.department.name).toBe("New");
            expect(res.body.department.description).toBe("Updated");
        });
    });

    describe("DELETE /api/departments/:id", () => {
        it("deletes a department with no subjects", async () => {
            const cookie = await loginAs(app, "ADMIN");

            const created = await request(app)
                .post("/api/departments")
                .set("Cookie", cookie)
                .send({ name: "A", code: "DEL1" });

            const res = await request(app)
                .delete(`/api/departments/${created.body.department.id}`)
                .set("Cookie", cookie);

            expect(res.status).toBe(204);

            const check = await prisma.department.findUnique({
                where: { id: created.body.department.id },
            });

            expect(check).toBeNull();
        });

        // NOTE: "409 when subjects exist" is covered in tests/subjects.test.ts
        // once the Subject model is added in Slice 2.
    });
});