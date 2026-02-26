import jwt from "jsonwebtoken";
import Student from "../models/studentModel.js";
import Exam from "../models/examModel.js";
import Result from "../models/resultModel.js";

/*  STUDENT LOGIN / AUTO REGISTER */
export const studentLogin = async (req, res) => {
  try {
    const { name, fatherName, rollNo, class: studentClass } = req.body;

    if (!name || !rollNo || !studentClass) {
      return res.status(400).json({
        success: false,
        message: "Name, Roll No and Class are required",
      });
    }

    let student = await Student.findOne({
      rollNo,
      class: studentClass,
    });

    if (!student) {
      student = await Student.create({
        name,
        fatherName,
        rollNo,
        class: studentClass,
        role: "student",
      });
    }

    // 🔐 Generate JWT
    const token = jwt.sign(
      { id: student._id, role: "student" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      student: {
        id: student._id,
        name: student.name,
        rollNo: student.rollNo,
        class: student.class,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Student login failed",
      error: error.message,
    });
  }
};

/* GET ACTIVE EXAMS (CLASS-WISE) */
export const getAvailableExams = async (req, res) => {
  try {
    const student = req.student;

    const exams = await Exam.find({
      class: student.class,
      isActive: true,
    }).select("examName subject examDate duration totalMarks");

    res.status(200).json({
      success: true,
      count: exams.length,
      exams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch exams",
      error: error.message,
    });
  }
};

/*
   GET EXAM QUESTIONS (NO ANSWERS) */
export const getExamQuestions = async (req, res) => {
  try {
    const student = req.student;
    const { examId } = req.params;

    const exam = await Exam.findById(examId).lean();

    if (!exam || !exam.isActive) {
      return res.status(404).json({
        success: false,
        message: "Exam not found or inactive",
      });
    }

    // 🔐 Class-based access check
    if (exam.class !== student.class) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this exam",
      });
    }

    // ❌ correctAnswer removed
    const questions = exam.questions.map((q, index) => ({
      questionIndex: index,
      questionText: q.questionText,
      options: q.options,
      marks: q.marks,
      image: q.image || null,
    }));

    res.status(200).json({
      success: true,
      examName: exam.examName,
      duration: exam.duration,
      totalQuestions: questions.length,
      questions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load exam questions",
      error: error.message,
    });
  }
};

/* SUBMIT EXAM (STUDENT ONLY) */
export const submitExam = async (req, res) => {
  try {
    const student = req.student;
    const { examId, answers } = req.body;

    if (!examId || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam submission",
      });
    }

    // 🔒 Prevent re-attempt
    const alreadySubmitted = await Result.findOne({
      student: student._id,
      exam: examId,
    });

    if (alreadySubmitted) {
      return res.status(403).json({
        success: false,
        message: "Exam already submitted",
      });
    }

    const exam = await Exam.findById(examId).lean();

    if (!exam || !exam.isActive) {
      return res.status(404).json({
        success: false,
        message: "Exam not found or inactive",
      });
    }

    // � Class validation
    if (exam.class !== student.class) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to submit this exam",
      });
    }

    // 🧮 Score calculation
    let score = 0;

    for (const ans of answers) {
      // ❗ Question index validation
      if (
        !Number.isInteger(ans.questionIndex) ||
        ans.questionIndex < 0 ||
        ans.questionIndex >= exam.questions.length
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid question index in answers",
        });
      }

      const q = exam.questions[ans.questionIndex];

      // ❗ selectedOption safe conversion
      const selectedOption = Number(ans.selectedOption);

      if (
        Number.isInteger(selectedOption) &&
        selectedOption === q.correctAnswer
      ) {
        score += q.marks || 1;
      }
    }

    const result = await Result.create({
      student: student._id,
      exam: exam._id,
      answers,
      score,
      submittedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Exam submitted successfully",
      score,
      resultId: result._id,
    });
  } catch (error) {
    // Handle E11000 duplicate key error (already submitted)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted this exam",
      });
    }
    res.status(500).json({
      success: false,
      message: "Exam submission failed",
      error: error.message,
    });
  }
};

