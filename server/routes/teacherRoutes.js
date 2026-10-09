import express from "express";
import { protectTeacher } from "../middleware/teacherAuthMiddleware.js";
import { createExam, getClassResults, exportResults, loginTeacher, getResultsByExam } from "../controllers/teacherController.js";

const router = express.Router();

// No sign-up: teacher/principal logins are fixed in .env (see config/accounts.js).
router.post("/login", loginTeacher );
router.post("/exam/create", protectTeacher, createExam);
router.get("/results/:className", protectTeacher, getClassResults);
router.get("/results/export", protectTeacher, exportResults);
// results by exam id
router.get("/results/exam/:examId", protectTeacher, getResultsByExam);

export default router;
