import Teacher from "../models/teacherModel.js";
import Exam from "../models/examModel.js"
import Result from "../models/resultModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/**
 * 🧑‍🏫 Teacher Register
 */
export const registerTeacher = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1️⃣ Check all fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // 2️⃣ Check existing teacher
    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      return res.status(409).json({
        success: false,
        message: "Teacher already exists",
      });
    }

    // 3️⃣ Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4️⃣ Create teacher
    const teacher = await Teacher.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      success: true,
      message: "Teacher registered successfully",
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        role: teacher.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

/**
 * 🔑 Teacher Login
 */
export const loginTeacher = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Check fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 2️⃣ Find teacher
    const teacher = await Teacher.findOne({ email });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // 3️⃣ Compare password
    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 4️⃣ Generate token
    const token = jwt.sign(
      {
        id: teacher._id,
        role: teacher.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        role: teacher.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

/*📝 Create Exam*/
export const createExam = async (req, res) => {
  try {
    // Align validation with /controllers/examController.js
    // Accept parsed body or fallback to rawBody for defensive parsing
    const body = req.body && Object.keys(req.body).length ? req.body : (req.rawBody ? JSON.parse(req.rawBody || '{}') : {});
    const {
      examName,
      title,
      subject,
      class: className,
      section,
      examDate,
      duration,
      totalMarks,
      questions,
      isActive,
    } = body;

    const finalExamName = examName || title;

    if (!finalExamName) {
      return res.status(400).json({ success: false, message: 'Exam title is required' });
    }
    if (!subject || !className || duration === undefined || !totalMarks) {
      return res.status(400).json({ success: false, message: 'Missing required exam fields: subject, class, duration, totalMarks' });
    }

    // allow empty or absent questions (teacher may create exam before adding questions)
    const safeQuestions = Array.isArray(questions) ? questions : [];
    for (const q of safeQuestions) {
      if (!q.questionText || !Array.isArray(q.options) || typeof q.correctAnswer === 'undefined') {
        return res.status(400).json({ success: false, message: 'Each question must have questionText, options and correctAnswer' });
      }
    }

    const exam = await Exam.create({
      examName: finalExamName,
      subject,
      class: className,
      section: section || null,
      examDate: examDate ? new Date(examDate) : new Date(),
      duration: Number(duration),
      totalMarks: Number(totalMarks),
      questions: safeQuestions,
      isActive: typeof isActive === 'boolean' ? isActive : true,
      createdBy: req.teacher._id,
    });

    res.status(201).json({ success: true, message: 'Exam created successfully', exam });
  } catch (error) {
    res.status(500).json({ success: false, message: "Exam creation failed", error: error.message });
  }
};


/*📊 Get Class-wise Results*/
export const getClassResults = async (req, res) => {
  try {
    const { className } = req.params;

    // Find results and populate student to filter by class
    const results = await Result.find().populate("student", "name rollNo class").populate("exam", "examName");

    const filtered = results.filter((r) => r.student && r.student.class === className);

    // Structure data for export-friendly rows
    const rows = filtered.map((r) => ({
      studentName: r.student.name,
      rollNo: r.student.rollNo,
      class: r.student.class,
      examName: r.exam ? r.exam.examName : null,
      score: r.score,
      submittedAt: r.submittedAt,
      answers: r.answers,
    }));

    res.status(200).json({ success: true, count: rows.length, results: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to fetch results", error: error.message });
  }
};

/* Get results by exam id */
export const getResultsByExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const results = await Result.find({ exam: examId }).populate("student", "name rollNo class").populate("exam", "examName");

    const rows = results.map((r) => ({
      studentName: r.student.name,
      rollNo: r.student.rollNo,
      class: r.student.class,
      examName: r.exam ? r.exam.examName : null,
      score: r.score,
      submittedAt: r.submittedAt,
      answers: r.answers,
    }));

    res.status(200).json({ success: true, count: rows.length, results: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to fetch results", error: error.message });
  }
};

/**
 * 📤 Export Results (Basic – JSON for now)
 * (Excel next step me add karenge)
 */
export const exportResults = async (req, res) => {
  try {
    const results = await Result.find().populate("student", "name rollNo class").populate("exam", "examName");

    const rows = results.map((r) => ({
      studentName: r.student.name,
      rollNo: r.student.rollNo,
      class: r.student.class,
      examName: r.exam ? r.exam.examName : null,
      score: r.score,
      submittedAt: r.submittedAt,
      answers: r.answers,
    }));

    res.status(200).json({ success: true, results: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Export failed", error: error.message });
  }
};

