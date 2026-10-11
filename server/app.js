import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { syncFixedAccounts } from "./config/accounts.js";
import Exam from "./models/examModel.js";
import { finalizeExpiredAttempts } from "./utils/grading.js";
import { applySecurity } from "./middleware/securityMiddleware.js";

import authRoutes from "./routes/authRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import attemptRoutes from "./routes/attemptRoutes.js";

dotenv.config();
connectDB().then(async () => {
  try {
    const backfilled = await Exam.backfillQuestionIds();
    if (backfilled) console.log(`Gave question ids to ${backfilled} older exam(s)`);
    await syncFixedAccounts();
  } catch (err) {
    console.error("Startup task failed:", err.message);
  }
  // submit attempts whose time ran out while the student was away
  setInterval(() => {
    finalizeExpiredAttempts().catch((err) => console.error("Auto-submit sweep failed:", err.message));
  }, 60 * 1000).unref();
});

// apply security headers and rate limiting
const app = express();

// Restrict CORS via env var if provided, e.g. CORS_ORIGIN=https://student.example.com,https://teacher.example.com
const allowedOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : "*";
app.use(cors({ origin: allowedOrigin }));
// Handle preflight requests before rate limiting so blocked logins still receive CORS headers.
applySecurity(app);
// parse JSON and keep a raw copy for debugging (without consuming the stream)
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf && buf.toString(); } }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/attempts", attemptRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Online Exam Backend Running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Online Exam System API is running" });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
