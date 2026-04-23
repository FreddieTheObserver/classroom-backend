import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as svc from '../services/departmentService';

const codeRegex = /^[A-Z0-9-]+$/;

const createSchema = z.object({
    name: z.string().min(1).max(100),
    code: z
        .string()
        .min(1)
        .max(20)
        .regex(codeRegex, "Must be uppercase letters, digits, or dashes"),
    description: z.string().max(500).optional(),
});

const updateSchema = createSchema.partial();

export async function list(_req: Request, res: Response, next: NextFunction) {
    try {
        const departments = await svc.listDepartments();
        res.json({ departments });
    } catch (err) {
        next(err);
    }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
    try {
        const department = await svc.getDepartment(req.params.id);
        res.json({ department });
    } catch (err) {
        next(err);
    }
}

export async function create(req: Request, res: Response, next: NextFunction) {
    try {
        const body = createSchema.parse(req.body);
        const department = await svc.createDepartment(body);
        res.status(201).json({ department });
    } catch (err) {
        next(err);
    }
}

export async function update(req: Request, res: Response, next: NextFunction) {
    try {
        const body = updateSchema.parse(req.body);
        const department = await svc.updateDepartment(req.params.id, body);
        res.json({ department });
    } catch (err) {
        next(err);
    }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
    try {
        await svc.deleteDepartment(req.params.id);
        res.status(204).end();
    } catch (err) {
        next(err);
    }
}