import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

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

const port = Number(process.env.PORT ?? 8000);
app.listen(port, () => {
    console.log(`[backend] listening on :${port}`);
})