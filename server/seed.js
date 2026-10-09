/**
 * Creates/updates the fixed teacher and principal logins from .env
 * (TEACHER_EMAIL, TEACHER_PASSWORD, PRINCIPAL_USERNAME, PRINCIPAL_PASSWORD).
 * The server also does this on every start, so this is only needed to set them up
 * without starting the server.
 *
 *   node seed.js          # logins only
 *   node seed.js --demo   # logins + demo students, exams and results (class 10)
 *
 * --demo is for local/demo databases: demo exams are visible to every class 10 student.
 * Re-running it resets the demo exams (names starting with "Demo: ") and their results.
 */
import "dotenv/config";
import mongoose from "mongoose";
import { syncFixedAccounts } from "./config/accounts.js";
import Teacher from "./models/teacherModel.js";
import Student from "./models/studentModel.js";
import Exam from "./models/examModel.js";
import Result from "./models/resultModel.js";
import Attempt from "./models/attemptModel.js";
import { saveResult } from "./utils/grading.js";

const uri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/online_exam";

const DEMO_PREFIX = "Demo: ";

const DEMO_STUDENTS = [
  { name: "Aarav Sharma", fatherName: "Rajesh Sharma", class: "10", section: "A", rollNo: "101" },
  { name: "Diya Verma", fatherName: "Sunil Verma", class: "10", section: "A", rollNo: "102" },
  { name: "Kabir Singh", fatherName: "Harpreet Singh", class: "10", section: "A", rollNo: "103" },
  { name: "Meera Yadav", fatherName: "Ramesh Yadav", class: "10", section: "B", rollNo: "201" },
];

// q(text, options, index of correct option, chapter, marks)
const q = (questionText, options, correctAnswer, chapter, marks = 1) => ({
  questionText,
  options,
  correctAnswer,
  chapter,
  marks,
});

// local time `daysFromToday` days away at hour:00
const at = (daysFromToday, hour) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  d.setHours(hour, 0, 0, 0);
  return d;
};

const DEMO_EXAMS = [
  {
    // no start time: open any time, each student gets the full duration
    examName: `${DEMO_PREFIX}Science Practice Test`,
    subject: "Science",
    class: "10",
    section: null,
    startAt: null,
    duration: 15,
    questions: [
      q("Which gas is released when zinc reacts with dilute sulphuric acid?", ["Oxygen", "Hydrogen", "Carbon dioxide", "Nitrogen"], 1, "Ch 1 Chemical Reactions"),
      q("Rusting of iron is an example of:", ["Reduction", "Oxidation", "Neutralisation", "Sublimation"], 1, "Ch 1 Chemical Reactions"),
      q("The pH of pure water at room temperature is:", ["5", "7", "9", "14"], 1, "Ch 2 Acids, Bases and Salts"),
      q("Which of these turns blue litmus red?", ["Lime water", "Soap solution", "Lemon juice", "Baking soda solution"], 2, "Ch 2 Acids, Bases and Salts"),
      q("Where does photosynthesis mainly take place?", ["Root", "Stem", "Leaf", "Flower"], 2, "Ch 6 Life Processes", 2),
      q("The functional unit of the kidney is the:", ["Neuron", "Nephron", "Alveolus", "Villus"], 1, "Ch 6 Life Processes", 2),
    ],
  },
  {
    // finished yesterday, with results for section A
    examName: `${DEMO_PREFIX}Maths Unit Test 1`,
    subject: "Maths",
    class: "10",
    section: "A",
    startAt: at(-1, 10),
    duration: 30,
    questions: [
      q("HCF of 12 and 18 is:", ["2", "3", "6", "36"], 2, "Ch 1 Real Numbers"),
      q("LCM of 4 and 6 is:", ["12", "24", "2", "10"], 0, "Ch 1 Real Numbers"),
      q("The zeroes of x² − 5x + 6 are:", ["1 and 6", "2 and 3", "−2 and −3", "5 and 6"], 1, "Ch 2 Polynomials"),
      q("Degree of the polynomial 3x³ + 2x + 1 is:", ["1", "2", "3", "6"], 2, "Ch 2 Polynomials"),
      q("Solve: x + y = 5 and x − y = 1", ["x = 3, y = 2", "x = 2, y = 3", "x = 4, y = 1", "x = 1, y = 4"], 0, "Ch 3 Linear Equations"),
    ],
    // option picked for each question, per roll number (null = left blank)
    answers: {
      101: [2, 0, 1, 2, 0], // 5/5
      102: [2, 0, 1, 1, null], // 3/5
      103: [1, 0, 1, 2, 2], // 3/5
    },
  },
  {
    // starts tomorrow morning
    examName: `${DEMO_PREFIX}English Grammar Quiz`,
    subject: "English",
    class: "10",
    section: "A",
    startAt: at(1, 10),
    duration: 20,
    questions: [
      q("Choose the correct article: ___ honest man.", ["A", "An", "The", "No article"], 1, "Articles"),
      q("Past tense of 'go' is:", ["Goed", "Gone", "Went", "Going"], 2, "Tenses"),
      q("Identify the noun: 'The cat sat on the mat.'", ["sat", "on", "cat", "the"], 2, "Parts of Speech"),
      q("Choose the correct form: She ___ to school every day.", ["go", "goes", "going", "gone"], 1, "Tenses"),
    ],
  },
];

const seedDemo = async () => {
  const email = process.env.TEACHER_EMAIL?.trim().toLowerCase();
  const teacher = email && (await Teacher.findOne({ role: "teacher", email }));
  if (!teacher) throw new Error("--demo needs the teacher login: set TEACHER_EMAIL / TEACHER_PASSWORD");

  const students = {};
  for (const s of DEMO_STUDENTS) {
    students[s.rollNo] = await Student.findOneAndUpdate(
      { class: s.class, section: s.section, rollNo: s.rollNo },
      { $set: s },
      { upsert: true, new: true }
    );
  }

  const old = await Exam.find({ examName: { $regex: `^${DEMO_PREFIX}` }, createdBy: teacher._id }).select("_id");
  const oldIds = old.map((e) => e._id);
  await Promise.all([
    Result.deleteMany({ exam: { $in: oldIds } }),
    Attempt.deleteMany({ exam: { $in: oldIds } }),
    Exam.deleteMany({ _id: { $in: oldIds } }),
  ]);

  for (const { answers, ...data } of DEMO_EXAMS) {
    const exam = await Exam.create({
      ...data,
      examDate: data.startAt || new Date(),
      totalMarks: data.questions.reduce((sum, item) => sum + item.marks, 0),
      createdBy: teacher._id,
    });
    for (const [rollNo, picks] of Object.entries(answers || {})) {
      const chosen = picks
        .map((selectedOption, i) => ({ questionId: exam.questions[i]._id, selectedOption }))
        .filter((a) => a.selectedOption !== null);
      const startedAt = new Date(data.startAt.getTime() + 2 * 60 * 1000);
      const result = await saveResult(exam.toObject(), students[rollNo]._id, chosen, startedAt);
      // as if submitted during yesterday's paper, not now
      await Result.updateOne({ _id: result._id }, { submittedAt: new Date(startedAt.getTime() + 20 * 60 * 1000) });
    }
  }
  console.log(`✅ Demo data: ${DEMO_STUDENTS.length} students, ${DEMO_EXAMS.length} exams (class 10)`);
};

try {
  await mongoose.connect(uri);
  await syncFixedAccounts();
  if (process.argv.includes("--demo")) await seedDemo();
} catch (err) {
  console.error("Seed error:", err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
