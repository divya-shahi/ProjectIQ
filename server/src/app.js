import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import { protect } from "./middleware/auth.js";
import { notFound, errorHandler } from "./middleware/errors.js";
import riskRoutes from "./routes/riskRoutes.js";

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL?.split(",") || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: "draft-7", legacyHeaders: false }));

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "ProjectIQ API" }));
app.use("/api/auth", authRoutes);
app.use("/api/projects", protect, projectRoutes);
app.use("/api/risks", riskRoutes);
app.use("/api/tasks", protect, taskRoutes);
app.use("/api/dashboard", protect, dashboardRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
