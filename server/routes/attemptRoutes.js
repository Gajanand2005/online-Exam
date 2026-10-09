import express from "express";
import { startAttempt, saveAnswers } from "../controllers/attemptController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/:examId/start", authenticate, authorize("student"), startAttempt);
router.put("/:examId/answers", authenticate, authorize("student"), saveAnswers);

export default router;
