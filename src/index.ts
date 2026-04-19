import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { errorHandler } from './middleware/errorHandler'

export function createApp() {
    const app = express();

    app.use(
        cors({
            origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
            credentials: true,
        }),
    );
    app.use(express.json());
    app.use(cookieParser());

    app.get("/api/health", (_req, res) => {
        res.json({ ok: true });
    });

    app.use("/api/auth", authRouter);
    app.use(errorHandler);

    return app;
}

if (process.env.NODE_ENV !== 'test') {
    const port = Number(process.env.PORT ?? 8000);
    createApp().listen(port, () => {
        console.log(`[backend] listening on :${port}`)
    })
}