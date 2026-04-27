import { Prisma, type Department } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

interface CreateInput {
    name: string;
    code: string;
    description?: string;
}

interface UpdateInput {
    name?: string;
    code?: string;
    description?: string;
}

export function listDepartments(): Promise<Department[]> {
    return prisma.department.findMany({
        orderBy: { createdAt: "desc" },
    });
}

export async function getDepartment(id: string): Promise<Department> {
    const department = await prisma.department.findUnique({
        where: { id },
    });

    if (!department) {
        throw new AppError(404, "DepartmentNotFound");
    }
    return department;
}

export async function createDepartment(input: CreateInput): Promise<Department> {
    try {
        return await prisma.department.create({
            data: input,
        });
    } catch (err) {
        if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === "P2002"
        ) {
            throw new AppError(409, "DepartmentCodeInUse");
        }
        throw err;
    }
}

export async function updateDepartment(
    id: string,
    patch: UpdateInput,
): Promise<Department> {
    try {
        return await prisma.department.update({
            where: { id },
            data: patch,
        });
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === "P2002") {
                throw new AppError(409, "DepartmentCodeInUse");
            }

            if (err.code === "P2025") {
                throw new AppError(404, "DepartmentNotFound");
            }
        }
        throw err;
    }
}

export async function deleteDepartment(id: string): Promise<void> {
    const subjectCount = await prisma.subject.count({ where: { departmentId: id } });
    if (subjectCount > 0) {
        throw new AppError(409, `Cannot delete: ${subjectCount} subject(s) still reference this department`);
    }
    try {
        await prisma.department.delete({ where: { id } });
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
            throw new AppError(404, "DepartmentNotFound");
        }
        throw err;
    }
}