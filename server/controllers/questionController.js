import mongoose from "mongoose";
import Exam from "../models/examModel.js";

// Accepts options either as strings or as { text, isCorrect } objects (what the
// teacher UI sends). The correct answer is stored as an option index.
const normalizeQuestion = (q = {}) => {
  const questionText = typeof q.questionText === "string" ? q.questionText.trim() : "";
  if (!questionText) return { error: "Question text is required" };

  if (!Array.isArray(q.options)) return { error: "Options must be an array" };
  const options = q.options.map((opt) =>
    String(opt && typeof opt === "object" ? opt.text ?? "" : opt ?? "").trim()
  );
  if (options.length < 2) return { error: "At least two options are required" };
  if (options.some((opt) => !opt)) return { error: "Options cannot be empty" };

  const explicit = q.correctAnswer === undefined || q.correctAnswer === null || q.correctAnswer === ""
    ? NaN
    : Number(q.correctAnswer);
  const correctAnswer = Number.isInteger(explicit)
    ? explicit
    : q.options.findIndex((opt) => opt && typeof opt === "object" && opt.isCorrect);
  if (!(correctAnswer >= 0 && correctAnswer < options.length))
    return { error: "Mark exactly one option as correct" };

  const marks = q.marks === undefined || q.marks === null || q.marks === "" ? 1 : Number(q.marks);
  if (!(marks > 0)) return { error: "Marks must be greater than 0" };

  return {
    question: {
      questionText,
      options,
      correctAnswer,
      marks,
      image: typeof q.image === "string" && q.image ? q.image : null,
      chapter: typeof q.chapter === "string" ? q.chapter.trim() : "",
    },
  };
};

const findExam = (examId) => (mongoose.isValidObjectId(examId) ? Exam.findById(examId) : null);

export const addQuestion = async (req, res) => {
  try {
    const { examId } = req.body || {};
    if (!examId) return res.status(400).json({ success: false, error: "examId is required" });
    const { question, error } = normalizeQuestion(req.body);
    if (error) return res.status(400).json({ success: false, error });

    const exam = await findExam(examId);
    if (!exam) return res.status(404).json({ success: false, error: "Exam not found" });

    exam.questions.push(question);
    await exam.save();
    const saved = exam.questions[exam.questions.length - 1];
    res.status(201).json({ success: true, question: saved, index: exam.questions.length - 1 });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const addMultipleQuestions = async (req, res) => {
  try {
    const { examId, questions } = req.body || {};
    if (!examId || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, error: "examId and questions array required" });
    }
    const toInsert = [];
    for (const [i, q] of questions.entries()) {
      const { question, error } = normalizeQuestion(q);
      if (error) return res.status(400).json({ success: false, error: `Question ${i + 1}: ${error}` });
      toInsert.push(question);
    }
    const exam = await findExam(examId);
    if (!exam) return res.status(404).json({ success: false, error: "Exam not found" });
    exam.questions.push(...toInsert);
    await exam.save();
    res.status(201).json({ success: true, count: toInsert.length, questions: exam.questions.slice(-toInsert.length) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Teachers only: students receive questions through their exam attempt.
export const getQuestionsByExam = async (req, res) => {
  try {
    if (req.user.role === "student")
      return res.status(403).json({ success: false, error: "Questions are available once the exam starts" });
    const exam = mongoose.isValidObjectId(req.params.examId) ? await Exam.findById(req.params.examId).lean() : null;
    if (!exam) return res.status(404).json({ success: false, error: "Exam not found" });
    res.json({ success: true, questions: exam.questions || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateQuestion = async (req, res) => {
  try {
    const exam = await findExam(req.params.examId);
    if (!exam) return res.status(404).json({ success: false, error: "Exam not found" });
    const existing = mongoose.isValidObjectId(req.params.questionId) && exam.questions.id(req.params.questionId);
    if (!existing) return res.status(404).json({ success: false, error: "Question not found" });

    // unspecified fields keep their current values
    const merged = { ...existing.toObject(), ...req.body };
    // options sent as { text, isCorrect } carry their own answer key
    if (
      req.body?.correctAnswer === undefined &&
      Array.isArray(req.body?.options) &&
      req.body.options.some((opt) => opt && typeof opt === "object")
    )
      delete merged.correctAnswer;
    const { question, error } = normalizeQuestion(merged);
    if (error) return res.status(400).json({ success: false, error });

    existing.set(question);
    await exam.save();
    res.json({ success: true, question: existing });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const exam = await findExam(req.params.examId);
    if (!exam) return res.status(404).json({ success: false, error: "Exam not found" });
    const existing = mongoose.isValidObjectId(req.params.questionId) && exam.questions.id(req.params.questionId);
    if (!existing) return res.status(404).json({ success: false, error: "Question not found" });
    existing.deleteOne();
    await exam.save();
    res.json({ success: true, message: "Question deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
