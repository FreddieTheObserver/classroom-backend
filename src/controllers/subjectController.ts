import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as svc from '../services/subjectService';

const codeRegex = /^[A-Z0-9-]+$/;

const createSchema = z.object({
    name: z.string().min(1).max(100),
    code: z.string().min(1).max(20).regex(codeRegex, "Must be uppercase letters, digits, or dashes"),
    description: z.string().max(500).optional(),
    departmentId: z.string().min(1),
});

const updateSchema = createSchema.partial();

const listQuerySchema = z.object({
    departmentId: z.string().optional(),
});

export async function list(req: Request, res: Response, next: NextFunction) {
    try {
        const { departmentId } = listQuerySchema.parse(req.query);
        const subjects = await svc.listSubjects({ departmentId });
        res.json({ subjects });
    } catch (err) {
        next(err);
    }
}



export async function getOne(req: Request, res: Response, next: NextFunction) {
    try {
        const subject = await svc.getSubject(req.params.id);
        res.json({ subject });
    } catch (err) {
        next(err);
    }
}

export async function create(req: Request, res: Response, next: NextFunction) {
    try {
        const body = createSchema.parse(req.body);
        const subject = await svc.createSubject(body);

        res.status(201).json({ subject });
    } catch (err) {
        next(err);
    }
}

export async function update(req: Request, res: Response, next: NextFunction) {
    try {
        const body = updateSchema.parse(req.body);
        const subject = await svc.updateSubject(req.params.id, body);
        res.json({ subject });
    } catch (err) {
        next(err);
    }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
    try {
        await svc.deleteSubject(req.params.id);
        res.status(204).end();
    } catch (err) {
        next(err);
    }
}