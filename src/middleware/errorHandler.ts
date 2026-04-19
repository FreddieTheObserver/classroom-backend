import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
    constructor(
        public status: number,
        message: string,
    ) {
        super(message);
    }
}

export function errorHandler(
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
) {
    if (err instanceof ZodError) {
        res.status(400).json({
            error: "ValidationError",
            fields: err.flatten().fieldErrors,
        });
        return;
    }

    if (err instanceof AppError) {
        res.status(err.status).json({ error: err.message });
        return;
    }
    console.error("[unhandled]", err);
    res.status(500).json({ error: "InternalServerError" });
}