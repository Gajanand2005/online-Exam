import mongoose from "mongoose";
import Result from "../models/resultModel.js";
import Exam from "../models/examModel.js";
import Attempt from "../models/attemptModel.js";
import { exportResultsToExcel } from "../utils/generateExcel.js";
import { canStudentAccessExam } from "../utils/examAccess.js";
import {
  GRACE_MS,
  attemptDeadline,
  finalizeExpiredAttempts,
  saveResult,
  withRanks,
} from "../utils/grading.js";

const STUDENT_FIELDS = "name fatherName class section rollNo";

export const submitExam = async (req, res) => {
  try {
    const { examId, answers } = req.body || {};
    const studentId = req.user.id;
    if (!examId || !mongoose.isValidObjectId(examId)) {
      return res.status(400).json({ success: false, error: "examId is required" });
    }

    const exam = await Exam.findById(examId).lean();
    if (!canStudentAccessExam(exam, req.user))
      return res.status(404).json({ success: false, error: "Exam not found" });

    const attempt = await Attempt.findOne({ student: studentId, exam: exam._id });
    if (!attempt) {
      const submitted = await Result.exists({ student: studentId, exam: exam._id });
      return res
        .status(400)
        .json({ success: false, error: submitted ? "You have already submitted this exam" : "Start the exam before submitting" });
    }

    // After the deadline (plus grace) only the last autosaved answers count.
    const inTime = Date.now() <= attemptDeadline(exam, attempt) + GRACE_MS;
    const finalAnswers = inTime && Array.isArray(answers) ? answers : attempt.answers;
    const result = await saveResult(exam, studentId, finalAnswers, attempt.startedAt);
    await attempt.deleteOne();
    if (!result)
      return res.status(400).json({ success: false, error: "You have already submitted this exam" });

    res.status(201).json({ success: true, result, late: !inTime });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getStudentResults = async (req, res) => {
  try {
    await finalizeExpiredAttempts({ student: req.user.id });
    const results = await Result.find({ student: req.user.id })
      .populate("exam", "examName subject class section totalMarks duration")
      .sort({ submittedAt: -1 })
      .lean();
    // rank among everyone who took the same exam
    const withRank = await Promise.all(
      results.map(async (r) => {
        const [ahead, participants] = await Promise.all([
          Result.countDocuments({ exam: r.exam?._id ?? r.exam, score: { $gt: r.score } }),
          Result.countDocuments({ exam: r.exam?._id ?? r.exam }),
        ]);
        return { ...r, rank: ahead + 1, participants };
      })
    );
    res.json({ success: true, results: withRank });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getResultsByExam = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.examId))
      return res.status(404).json({ success: false, error: "Exam not found" });
    await finalizeExpiredAttempts({ exam: req.params.examId });
    const results = await Result.find({ exam: req.params.examId }).populate("student", STUDENT_FIELDS);
    res.json({ success: true, results: withRanks(results) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Ranked results for one exam. Students see the top 10 and their own position, and
// only after they have submitted.
export const getLeaderboard = async (req, res) => {
  try {
    const { examId } = req.params;
    if (!mongoose.isValidObjectId(examId))
      return res.status(404).json({ success: false, error: "Exam not found" });
    const exam = await Exam.findById(examId).select("examName subject class section").lean();
    if (!exam) return res.status(404).json({ success: false, error: "Exam not found" });
    const isStudent = req.user.role === "student";

    await finalizeExpiredAttempts({ exam: exam._id });
    const results = await Result.find({ exam: exam._id }).populate("student", "name class section rollNo").lean();
    const ranked = withRanks(results).map((r) => ({
      rank: r.rank,
      studentId: r.student?._id,
      name: r.student?.name ?? "(deleted student)",
      rollNo: r.student?.rollNo,
      section: r.student?.section,
      score: r.score,
      totalMarks: r.totalMarks,
      percentage: r.percentage,
    }));

    if (!isStudent) return res.json({ success: true, exam, participants: ranked.length, leaderboard: ranked });

    const me = ranked.find((r) => String(r.studentId) === String(req.user.id));
    if (!me)
      return res.status(403).json({ success: false, error: "Submit the exam to see the leaderboard" });
    const strip = ({ studentId, ...row }) => ({ ...row, isMe: String(studentId) === String(req.user.id) });
    res.json({
      success: true,
      exam,
      participants: ranked.length,
      leaderboard: ranked.slice(0, 10).map(strip),
      me: strip(me),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getResultsByClass = async (req, res) => {
  try {
    const {
      class: classFilter,
      section,
      examId,
    } = req.query;
    let query = {};
    if (examId) query.exam = examId;
    let results = await Result.find(query)
      .populate("student", STUDENT_FIELDS)
      .populate("exam", "examName subject")
      .sort({ submittedAt: -1 });
    if (classFilter)
      results = results.filter(
        (r) => r.student && r.student.class === classFilter
      );
    if (section)
      results = results.filter(
        (r) => r.student && r.student.section === section
      );
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getAllResults = async (req, res) => {
  try {
    await finalizeExpiredAttempts();
    const results = await Result.find()
      .populate("student", STUDENT_FIELDS)
      .populate("exam", "examName subject")
      .sort({ submittedAt: -1 });
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const exportToExcel = async (req, res) => {
  try {
    const { examId } = req.query;
    if (examId && !mongoose.isValidObjectId(examId))
      return res.status(404).json({ success: false, error: "Exam not found" });
    await finalizeExpiredAttempts(examId ? { exam: examId } : {});
    const results = await Result.find(examId ? { exam: examId } : {})
      .populate("student", STUDENT_FIELDS)
      .populate("exam", "examName subject totalMarks");
    // rank within each exam, then list exam by exam
    const byExam = new Map();
    for (const r of results) {
      const key = String(r.exam?._id ?? r.exam);
      if (!byExam.has(key)) byExam.set(key, []);
      byExam.get(key).push(r);
    }
    const ranked = [...byExam.values()].flatMap((group) => withRanks(group));
    const buffer = await exportResultsToExcel(ranked);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=results-${Date.now()}.xlsx`
    );
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
