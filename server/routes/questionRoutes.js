import express from "express";
import {
  addQuestion,
  addMultipleQuestions,
  getQuestionsByExam,
  updateQuestion,
  deleteQuestion,
} from "../controllers/questionController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("teacher", "principal"),
  addQuestion
);
router.post(
  "/bulk",
  authenticate,
  authorize("teacher", "principal"),
  addMultipleQuestions
);
router.get("/exam/:examId", authenticate, getQuestionsByExam);
router.put(
  "/:examId/:questionId",
  authenticate,
  authorize("teacher", "principal"),
  updateQuestion
);
router.delete(
  "/:examId/:questionId",
  authenticate,
  authorize("teacher", "principal"),
  deleteQuestion
);

export default router;
