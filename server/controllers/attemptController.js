import mongoose from "mongoose";
import Attempt from "../models/attemptModel.js";
import Exam from "../models/examModel.js";
import Result from "../models/resultModel.js";
import { canStudentAccessExam, toStudentExamSummary, toStudentQuestions } from "../utils/examAccess.js";
import { GRACE_MS, attemptDeadline, examWindow, finalizeExpiredAttempts, normalizeAnswers } from "../utils/grading.js";

const sendAttempt = (res, exam, attempt) => {
  const now = new Date();
  res.json({
    success: true,
    exam: toStudentExamSummary(exam),
    questions: toStudentQuestions(exam.questions),
    answers: attempt.answers,
    deadline: new Date(attemptDeadline(exam, attempt)),
    serverNow: now,
  });
};

export const startAttempt = async (req, res) => {
  try {
    const { examId } = req.params;
    if (!mongoose.isValidObjectId(examId)) {
      return res.status(404).json({ success: false, error: "Exam not found" });
    }

    const exam = await Exam.findById(examId).lean();
    if (!canStudentAccessExam(exam, req.user)) {
      return res.status(404).json({ success: false, error: "Exam not found" });
    }

    const studentId = req.user.id;
    await finalizeExpiredAttempts({ student: studentId, exam: exam._id });

    const existingResult = await Result.exists({ student: studentId, exam: exam._id });
    if (existingResult) {
      return res.status(409).json({ success: false, error: "You have already submitted this exam" });
    }

    const now = Date.now();
    const window = examWindow(exam);
    if (window && now < window.start) {
      return res.status(403).json({ success: false, error: "Exam has not started", startAt: exam.startAt });
    }
    if (window && now >= window.end) {
      return res.status(403).json({ success: false, error: "Exam has ended", endAt: new Date(window.end) });
    }

    let attempt = await Attempt.findOne({ student: studentId, exam: exam._id });
    if (!attempt) {
      try {
        attempt = await Attempt.create({ student: studentId, exam: exam._id });
      } catch (err) {
        if (err.code !== 11000) throw err;
        attempt = await Attempt.findOne({ student: studentId, exam: exam._id });
        if (!attempt) throw err;
      }
    }

    return sendAttempt(res, exam, attempt);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const saveAnswers = async (req, res) => {
  try {
    const { examId } = req.params;
    if (!mongoose.isValidObjectId(examId)) {
      return res.status(404).json({ success: false, error: "Exam not found" });
    }
    if (!Array.isArray(req.body?.answers)) {
      return res.status(400).json({ success: false, error: "Answers must be an array" });
    }

    const exam = await Exam.findById(examId).lean();
    if (!canStudentAccessExam(exam, req.user)) {
      return res.status(404).json({ success: false, error: "Exam not found" });
    }

    const studentId = req.user.id;
    await finalizeExpiredAttempts({ student: studentId, exam: exam._id });
    const attempt = await Attempt.findOne({ student: studentId, exam: exam._id });
    if (!attempt) {
      return res.status(409).json({ success: false, error: "No active attempt for this exam" });
    }

    if (Date.now() > attemptDeadline(exam, attempt) + GRACE_MS) {
      await finalizeExpiredAttempts({ student: studentId, exam: exam._id });
      return res.status(409).json({ success: false, error: "Exam time has ended" });
    }

    attempt.answers = normalizeAnswers(exam, req.body.answers);
    await attempt.save();
    return res.json({ success: true, saved: attempt.answers.length });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};