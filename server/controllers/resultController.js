import Result from "../models/resultModel.js";
import Exam from "../models/examModel.js";
import { exportResultsToExcel } from "../utils/generateExcel.js";

export const submitExam = async (req, res) => {
  try {
    const { examId, answers } = req.body;
    const studentId = req.user.id;
    if (!examId || !answers || !Array.isArray(answers)) {
      return res
        .status(400)
        .json({ success: false, error: "examId and answers array required" });
    }

    const existing = await Result.findOne({ student: studentId, exam: examId });
    if (existing)
      return res
        .status(400)
        .json({ success: false, error: "Already submitted this exam" });

    const exam = await Exam.findById(examId).lean();
    if (!exam) return res.status(404).json({ success: false, error: "Exam not found" });

    // Calculate score using inline questions
    let totalMarks = 0;
    let obtained = 0;
    const detailedAnswers = answers.map((ans) => {
      const qIndex = ans.questionIndex;
      const selectedOption = Number(ans.selectedOption);
      const q = exam.questions[qIndex];
      if (!q) return { questionIndex: qIndex, selectedOption, isCorrect: false, marksObtained: 0 };
      totalMarks += q.marks || 1;
      const isCorrect = Number.isInteger(selectedOption) && selectedOption === q.correctAnswer;
      const marksObtained = isCorrect ? (q.marks || 1) : 0;
      obtained += marksObtained;
      return { questionIndex: qIndex, selectedOption, isCorrect, marksObtained };
    });

    const percentage = totalMarks > 0 ? Math.round((obtained / totalMarks) * 100) : 0;

    const result = await Result.create({
      student: studentId,
      exam: examId,
      answers: detailedAnswers,
      totalMarks,
      score: obtained,
      percentage,
      status: "graded",
      examSnapshot: {
        examName: exam.examName || exam.title || null,
        subject: exam.subject || null,
        class: exam.class || null,
        section: exam.section || null,
        totalMarks: totalMarks,
      },
    });

    res.status(201).json({ success: true, result });
  } catch (err) {
    // Handle E11000 duplicate key error (already submitted)
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: "You have already submitted this exam" });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getStudentResults = async (req, res) => {
  try {
    const results = await Result.find({ student: req.user.id })
      .populate("exam", "examName subject class section totalMarks duration")
      .sort({ submittedAt: -1 });
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getResultsByExam = async (req, res) => {
  try {
    const results = await Result.find({ exam: req.params.examId })
      .populate("student", "name fatherName class section rollNo")
      .sort({ score: -1 });
    res.json({ success: true, results });
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
    if (examId) query.examId = examId;
    let results = await Result.find(query)
      .populate("student", "name fatherName class section rollNo")
      .populate("exam", "examName subject")
      .sort({ submittedAt: -1 });
    if (classFilter)
      results = results.filter(
        (r) => r.studentId && r.studentId.class === classFilter
      );
    if (section)
      results = results.filter(
        (r) => r.studentId && r.studentId.section === section
      );
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getAllResults = async (req, res) => {
  try {
    const results = await Result.find()
      .populate("student", "name fatherName class section rollNo")
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
    let results;
    if (examId) {
      results = await Result.find({ exam: examId })
        .populate("student", "name fatherName class section rollNo")
        .populate("exam", "examName subject totalMarks");
    } else {
      results = await Result.find()
        .populate("student", "name fatherName class section rollNo")
        .populate("exam", "examName subject totalMarks");
    }
    const buffer = await exportResultsToExcel(results);
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
