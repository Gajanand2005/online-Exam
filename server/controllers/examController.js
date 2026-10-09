import mongoose from "mongoose";
import Exam from "../models/examModel.js";
import Result from "../models/resultModel.js";
import Attempt from "../models/attemptModel.js";
import { canStudentAccessExam, toStudentExamSummary } from "../utils/examAccess.js";
import { examWindow, finalizeExpiredAttempts } from "../utils/grading.js";
import { normalizeClass, normalizeSection } from "../utils/normalize.js";

// Fields a teacher may change on an existing exam (questions have their own routes).
const EDITABLE_EXAM_FIELDS = ["examName", "subject", "class", "section", "examDate", "startAt", "duration", "totalMarks", "isActive"];

// startAt may be empty (unscheduled exam) or a valid date; returns undefined if invalid.
const parseStartAt = (value) => {
  if (value === null || value === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export const createExam = async (req, res) => {
  try {
    const body = req.body && Object.keys(req.body).length ? req.body : (req.rawBody ? JSON.parse(req.rawBody || '{}') : {});
    const {
      examName,
      title,
      subject,
      class: examClass,
      section,
      examDate,
      startAt,
      duration,
      totalMarks,
      questions,
      isActive,
    } = body;

    // Accept both 'examName' and 'title' for backward compatibility
    const finalExamName = examName || title;
    
    // Validate required fields
    if (!finalExamName) {
      return res.status(400).json({ success: false, error: "Exam title is required" });
    }
    if (!subject || !examClass || duration === undefined || !totalMarks) {
      return res.status(400).json({ success: false, error: "Missing required exam fields: subject, class, duration, totalMarks" });
    }
    if (!(Number(duration) >= 1) || !(Number(totalMarks) >= 1)) {
      return res.status(400).json({ success: false, error: "Duration and total marks must be at least 1" });
    }
    const start = startAt === undefined ? null : parseStartAt(startAt);
    if (start === undefined) {
      return res.status(400).json({ success: false, error: "Invalid start date/time" });
    }

    const exam = await Exam.create({
      examName: finalExamName,
      subject,
      class: normalizeClass(examClass),
      section: section ? normalizeSection(section) : null,
      examDate: start || (examDate ? new Date(examDate) : new Date()),
      startAt: start,
      duration: Number(duration),
      totalMarks: Number(totalMarks),
      questions: Array.isArray(questions) ? questions : [],
      isActive: typeof isActive === 'boolean' ? isActive : true,
      createdBy: req.user.id,
    });
    res.status(201).json({ success: true, exam });
  } catch (err) {
    console.error('Exam creation error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getAllExams = async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, exams });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Student dashboard: exams for their class/section with where each one stands.
export const getExamsForStudent = async (req, res) => {
  try {
    const student = req.user;
    await finalizeExpiredAttempts({ student: student.id });
    // case-insensitive so older exams saved as e.g. "lkg" still match "LKG"
    const examsAll = await Exam.find({ class: normalizeClass(student.class) })
      .collation({ locale: "en", strength: 2 })
      .populate("createdBy", "name")
      .sort({ startAt: 1, createdAt: -1 })
      .lean();
    const exams = examsAll.filter((exam) => canStudentAccessExam(exam, student));

    const [results, attempts] = await Promise.all([
      Result.find({ student: student.id }).select("exam score totalMarks percentage").lean(),
      Attempt.find({ student: student.id }).select("exam").lean(),
    ]);
    const resultByExam = new Map(results.map((r) => [String(r.exam), r]));
    const inProgress = new Set(attempts.map((a) => String(a.exam)));
    const now = Date.now();

    const examsWithStatus = exams.map((exam) => {
      const id = String(exam._id);
      const window = examWindow(exam);
      const result = resultByExam.get(id);
      let status = "open";
      if (result) status = "submitted";
      else if (inProgress.has(id)) status = "in_progress";
      else if (window && now < window.start) status = "upcoming";
      else if (window && now >= window.end) status = "closed";
      return {
        ...toStudentExamSummary(exam),
        endAt: window ? new Date(window.end) : null,
        status,
        alreadySubmitted: Boolean(result),
        result: result ? { score: result.score, totalMarks: result.totalMarks, percentage: result.percentage } : null,
      };
    });
    res.json({ success: true, exams: examsWithStatus, serverNow: new Date(now) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getExamById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(404).json({ success: false, error: "Exam not found" });
    const exam = await Exam.findById(req.params.id)
      .populate("createdBy", "name")
      .lean();
    if (!exam)
      return res.status(404).json({ success: false, error: "Exam not found" });
    if (req.user.role === "student") {
      // questions are only handed out when the attempt starts
      if (!canStudentAccessExam(exam, req.user))
        return res.status(404).json({ success: false, error: "Exam not found" });
      return res.json({ success: true, exam: toStudentExamSummary(exam) });
    }
    res.json({ success: true, exam });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateExam = async (req, res) => {
  try {
    const updates = {};
    for (const field of EDITABLE_EXAM_FIELDS) {
      if (req.body?.[field] !== undefined) updates[field] = req.body[field];
    }
    if (updates.class !== undefined) updates.class = normalizeClass(updates.class);
    if (updates.section !== undefined) updates.section = updates.section ? normalizeSection(updates.section) : null;
    if (updates.startAt !== undefined) {
      updates.startAt = parseStartAt(updates.startAt);
      if (updates.startAt === undefined)
        return res.status(400).json({ success: false, error: "Invalid start date/time" });
      if (updates.startAt) updates.examDate = updates.startAt;
    }
    for (const field of ["duration", "totalMarks"]) {
      if (updates[field] !== undefined && !(Number(updates[field]) >= 1)) {
        return res.status(400).json({ success: false, error: `${field} must be at least 1` });
      }
    }
    const exam = await Exam.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!exam)
      return res.status(404).json({ success: false, error: "Exam not found" });
    res.json({ success: true, exam });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam)
      return res.status(404).json({ success: false, error: "Exam not found" });
    await Result.deleteMany({ exam: exam._id });
    await Attempt.deleteMany({ exam: exam._id });
    res.json({ success: true, message: "Exam deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
