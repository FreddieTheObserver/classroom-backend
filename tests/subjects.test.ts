import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/index";
import { prisma } from "../src/lib/prisma";
import { loginAs, cleanTestUsers } from "./helpers/auth";

const app = createApp();

beforeEach(async () => {
    await prisma.subject.deleteMany({});
    await prisma.department.deleteMany({});
    await cleanTestUsers();
});

afterAll(async () => {
    await prisma.$disconnect();
});

async function createDept(cookie: string, code: string, name = `Dept ${code}`) {
    const res = await request(app).post("/api/departments").set("Cookie", cookie)
        .send({ name, code });
    return res.body.department.id as string;
}

describe("POST /api/subjects", () => {
    it("admin can create a subject tied to a department", async () => {
        const cookie = await loginAs(app, "ADMIN");
        const deptId = await createDept(cookie, "CSE");
        const res = await request(app).post("/api/subjects").set("Cookie", cookie)
            .send({ name: "Intro to CS", code: "CS101", departmentId: deptId });

        expect(res.status).toBe(201);
        expect(res.body.subject.code).toBe("CS101");
        expect(res.body.subject.departmentId).toBe(deptId);
    });

    it("returns 400 when departmentId doesn't exist", async () => {
        const cookie = await loginAs(app, "ADMIN");
        const res = await request(app).post("/api/subjects").set("Cookie", cookie)
            .send({ name: "X", code: "X1", departmentId: "nonexistent-cuid" });
        expect(res.status).toBe(400);
    });
});

describe("GET /api/subjects", () => {
    it("lists all subjects with department summary", async () => {
        const cookie = await loginAs(app, "ADMIN");
        const deptId = await createDept(cookie, "MATH");
        await request(app).post("/api/subjects").set("Cookie", cookie)
            .send({ name: "Calc", code: "M1", departmentId: deptId });

        const res = await request(app).get("/api/subjects").set("Cookie", cookie);
        expect(res.status).toBe(200);
        expect(res.body.subjects).toHaveLength(1);
        expect(res.body.subjects[0].department.code).toBe("MATH");
    });

    it("filters by departmentId", async () => {
        const cookie = await loginAs(app, "ADMIN");
        const a = await createDept(cookie, "A");
        const b = await createDept(cookie, "B");
        await request(app).post("/api/subjects").set("Cookie", cookie)
            .send({ name: "S1", code: "A1", departmentId: a });
        await request(app).post("/api/subjects").set("Cookie", cookie)
            .send({ name: "S2", code: "B1", departmentId: b });

        const res = await request(app).get(`/api/subjects?departmentId=${a}`).set("Cookie", cookie);
        expect(res.status).toBe(200);
        expect(res.body.subjects).toHaveLength(1);
        expect(res.body.subjects[0].code).toBe("A1");
    });
});

describe("DELETE /api/departments/:id — with subjects", () => {
    it("returns 409 when subjects reference the department", async () => {
        const cookie = await loginAs(app, "ADMIN");
        const deptId = await createDept(cookie, "DEL");
        await request(app).post("/api/subjects").set("Cookie", cookie)
            .send({ name: "S", code: "DEL1", departmentId: deptId });

        const res = await request(app).delete(`/api/departments/${deptId}`).set("Cookie", cookie);
        expect(res.status).toBe(409);
        expect(res.body.error).toMatch(/1 subject/);
    });
});
