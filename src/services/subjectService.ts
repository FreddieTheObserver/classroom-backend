import { Prisma, type Subject } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

interface CreateInput {
    name: string;
    code: string;
    description?: string;
    departmentId: string;
}

interface UpdateInput {
    name?: string;
    code?: string;
    description?: string;
    departmentId?: string;
}

const DEPT_SUMMARY = { select: { id: true, name: true, code: true } } as const;

export function listSubjects(filter: { departmentId?: string } = {}) {
    return prisma.subject.findMany({
        where: filter.departmentId ? { departmentId: filter.departmentId } : undefined,
        include: { department: DEPT_SUMMARY },
        orderBy: { createdAt: "desc" },
    });
}

export async function getSubject(id: string) {
    const subject = await prisma.subject.findUnique({
        where: { id },
        include: { department: DEPT_SUMMARY },
    });
    if (!subject) throw new AppError(404, "SubjectNotFound");
    return subject;
}

async function assertDepartmentExists(id: string) {
    const dept = await prisma.department.findUnique({ where: { id }, select: { id: true } });
    if (!dept) throw new AppError(400, "DepartmentNotFound");
}

export async function createSubject(input: CreateInput): Promise<Subject> {
    await assertDepartmentExists(input.departmentId);
    try {
        return await prisma.subject.create({ data: input });
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            throw new AppError(409, "SubjectCodeInUse");
        }
        throw err;
    }
}

export async function updateSubject(id: string, patch: UpdateInput): Promise<Subject> {
    if (patch.departmentId) {
        await assertDepartmentExists(patch.departmentId);
    }
    try {
        return await prisma.subject.update({ where: { id }, data: patch });
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === "P2002") throw new AppError(409, "SubjectCodeInUse");
            if (err.code === "P2025") throw new AppError(404, "SubjectNotFound");
        }
    throw err;
    }
}

export async function deleteSubject(id: string): Promise<void> {
    try {
        await prisma.subject.delete({ where: { id } });
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
            throw new AppError(404, "SubjectNotFound");
        }
        throw err;
    }
}