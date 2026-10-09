import mongoose from "mongoose";
import Attempt from "../models/attemptModel.js";
import Exam from "../models/examModel.js";
import Result from "../models/resultModel.js";
import { canStudentAccessExam, toStudentQuestions } from "../utils/examAccess.js";
import {
  GRACE_MS,
  attemptDeadline,
  examWindow,
  finalizeExpiredAttempts,
  normalizeAnswers,
} from "../utils/grading.js";

const loadExamForStudent = async (examId, student) => {
  if (!mongoose.isValidObjectId(examId)) return null;
  const exam = await Exam.findById(examId).lean();
  return canStudentAccessExam(exam, student) ? exam : null;
};

// Starts the exam, or resumes it with saved answers. Questions are only ever sent here,
// so students can't see them before the paper opens.
export const startAttempt = async (req, res) => {
  try {
    const student = req.user;
    const exam = await loadExamForStudent(req.params.examId, student);
    if (!exam) return res.status(404).json({ success: false, error: "Exam not found" });
    if (await Result.exists({ student: student.id, exam: exam._id }))
      return res.status(409).json({ success: false, error: "You have already submitted this exam" });
    if (!exam.questions.length)
      return res.status(400).json({ success: false, error: "This exam has no questions yet" });

    const now = Date.now();
    let attempt = await Attempt.findOne({ student: student.id, exam: exam._id });
    if (!attempt) {
      const window = examWindow(exam);
      if (window && now < window.start)
        return res.status(403).json({ success: false, error: "This exam has not started yet", startAt: exam.startAt });
      if (window && now >= window.end)
        return res.status(403).json({ success: false, error: "This exam has ended" });
      try {
        attempt = await Attempt.create({ student: student.id, exam: exam._id, startedAt: new Date(now) });
      } catch (err) {
        // two start requests at once (double click, two tabs): use the one that won
        if (err.code !== 11000) throw err;
        attempt = await Attempt.findOne({ student: student.id, exam: exam._id });
      }
    }

    const deadline = attemptDeadline(exam, attempt);
    if (now > deadline + GRACE_MS) {
      await finalizeExpiredAttempts({ _id: attempt._id });
      return res.status(409).json({ success: false, error: "Time is up. Your saved answers were submitted." });
    }

    res.json({
      success: true,
      exam: {
        _id: exam._id,
        examName: exam.examName,
        subject: exam.subject,
        class: exam.class,
        section: exam.section,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
      },
      questions: toStudentQuestions(exam.questions),
      answers: attempt.answers,
      startedAt: attempt.startedAt,
      deadline: new Date(deadline),
      serverNow: new Date(now),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Autosave: replaces the saved answers with the student's current selections.
export const saveAnswers = async (req, res) => {
  try {
    const student = req.user;
    const exam = await loadExamForStudent(req.params.examId, student);
    if (!exam) return res.status(404).json({ success: false, error: "Exam not found" });
    const attempt = await Attempt.findOne({ student: student.id, exam: exam._id });
    if (!attempt) {
      const submitted = await Result.exists({ student: student.id, exam: exam._id });
      return res
        .status(409)
        .json({ success: false, error: submitted ? "You have already submitted this exam" : "Start the exam first" });
    }
    const now = Date.now();
    const deadline = attemptDeadline(exam, attempt);
    if (now > deadline + GRACE_MS)
      return res.status(409).json({ success: false, error: "Time is up. Answers can no longer be changed." });

    attempt.answers = normalizeAnswers(exam, req.body?.answers);
    await attempt.save();
    res.json({ success: true, saved: attempt.answers.length, savedAt: new Date(now), deadline: new Date(deadline) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
