import jwt from "jsonwebtoken";
import Student from "../models/studentModel.js";
import Teacher from "../models/teacherModel.js";
import { cleanName, normalizeClass, normalizeRollNo, normalizeSection, sameName } from "../utils/normalize.js";

const generateToken = (payload, role) => {
  return jwt.sign(
    { id: payload._id, role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export const studentLogin = async (req, res) => {
  try {
    // defensive: accept parsed body or fallback to rawBody JSON (some clients may send unexpected content-type)
    let body = req.body;
    if ((!body || Object.keys(body).length === 0) && req.rawBody) {
      try {
        body = JSON.parse(req.rawBody);
      } catch (e) {
        // ignore parse error and let validation below handle missing fields
        body = {};
      }
    }

    // plain strings only, so values like {"$ne": ""} can't act as query operators
    const field = (value) => (typeof value === "string" || typeof value === "number" ? String(value).trim() : "");
    const name = cleanName(field(body?.name));
    const fatherName = cleanName(field(body?.fatherName));
    const studentClass = normalizeClass(field(body?.class));
    const section = normalizeSection(field(body?.section));
    const typedRollNo = field(body?.rollNo);
    const rollNo = normalizeRollNo(typedRollNo);
    if (!name || !fatherName || !studentClass || !section || !rollNo) {
      return res
        .status(400)
        .json({ success: false, error: "All fields are required" });
    }
    // Exact match first; records made before normalising may differ in letter
    // case ("a" vs "A") or keep leading zeros ("001").
    const match = { class: studentClass, section, rollNo: { $in: [...new Set([rollNo, typedRollNo])] } };
    let student =
      (await Student.findOne(match)) ||
      (await Student.findOne(match).collation({ locale: "en", strength: 2 }));
    if (!student) {
      student = await Student.create({
        name,
        fatherName,
        class: studentClass,
        section,
        rollNo,
      });
    } else if (!sameName(student.name, name) || !sameName(student.fatherName, fatherName)) {
      return res.status(401).json({
        success: false,
        error: `Roll No ${rollNo} in Class ${studentClass}-${section} is registered with a different name. Check the spelling of your name and father's name.`,
      });
    }
    const token = generateToken(student, "student");
    res.json({
      success: true,
      token,
      user: {
        id: student._id,
        name: student.name,
        role: "student",
        class: student.class,
        section: student.section,
        rollNo: student.rollNo,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const teacherLogin = async (req, res) => {
  try {
    // the teacher logs in with the fixed email from .env; username still works for scripts
    const { email, username, password } = req.body || {};
    const login = String(email || username || "").trim();
    if (!login || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Email and password required" });
    }
    const teacher = await Teacher.findOne({
      role: "teacher",
      $or: [{ email: login.toLowerCase() }, { username: login }],
    });
    if (!teacher)
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    const match = await teacher.comparePassword(password);
    if (!match)
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    const token = generateToken(teacher, "teacher");
    res.json({
      success: true,
      token,
      user: {
        id: teacher._id,
        name: teacher.name,
        role: "teacher",
        username: teacher.username,
        email: teacher.email,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const principalLogin = async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Username and password required" });
    }
    // case-insensitive: phones often capitalise the first letter ("Principal")
    const principal = await Teacher.findOne({
      username: String(username).trim(),
      role: "principal",
    }).collation({ locale: "en", strength: 2 });
    if (!principal)
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    const match = await principal.comparePassword(password);
    if (!match)
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    const token = generateToken(principal, "principal");
    res.json({
      success: true,
      token,
      user: {
        id: principal._id,
        name: principal.name,
        role: "principal",
        username: principal.username,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
