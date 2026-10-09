import Attempt from "../models/attemptModel.js";
import Exam from "../models/examModel.js";
import Result from "../models/resultModel.js";

// Answers that arrive this long after the deadline still count, to cover network delay
// on the automatic submit.
export const GRACE_MS = 30 * 1000;

const minutes = (n) => n * 60 * 1000;

// Scheduled exams run in a fixed slot: entry opens at startAt and every paper ends at
// startAt + duration. Unscheduled exams have no slot.
export const examWindow = (exam) => {
  if (!exam.startAt) return null;
  const start = new Date(exam.startAt).getTime();
  return { start, end: start + minutes(exam.duration) };
};

// Worked out from the exam each time, so a teacher extending the paper applies immediately.
export const attemptDeadline = (exam, attempt) => {
  const window = examWindow(exam);
  return window ? window.end : new Date(attempt.startedAt).getTime() + minutes(exam.duration);
};

// Keeps one valid answer per question: unknown question ids and out-of-range options are dropped.
export const normalizeAnswers = (exam, answers) => {
  const questions = new Map(exam.questions.map((q) => [String(q._id), q]));
  const kept = new Map();
  for (const ans of Array.isArray(answers) ? answers : []) {
    const id = String(ans?.questionId ?? "");
    const selectedOption = Number(ans?.selectedOption);
    const q = questions.get(id);
    if (!q || kept.has(id) || !Number.isInteger(selectedOption)) continue;
    if (selectedOption < 0 || selectedOption >= q.options.length) continue;
    kept.set(id, { questionId: q._id, selectedOption });
  }
  return [...kept.values()];
};

// Every question counts towards the total, so unanswered questions score 0.
export const gradeAnswers = (exam, answers) => {
  const selected = new Map(normalizeAnswers(exam, answers).map((a) => [String(a.questionId), a.selectedOption]));
  let totalMarks = 0;
  let score = 0;
  const detailed = [];
  exam.questions.forEach((q, questionIndex) => {
    const marks = q.marks || 1;
    totalMarks += marks;
    if (!selected.has(String(q._id))) return;
    const selectedOption = selected.get(String(q._id));
    const isCorrect = selectedOption === q.correctAnswer;
    const marksObtained = isCorrect ? marks : 0;
    score += marksObtained;
    detailed.push({ questionIndex, questionId: q._id, selectedOption, isCorrect, marksObtained });
  });
  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
  return { answers: detailed, totalMarks, score, percentage };
};

// Returns the new Result, or null if this student already has one for the exam.
export const saveResult = async (exam, studentId, answers, startedAt) => {
  const graded = gradeAnswers(exam, answers);
  try {
    return await Result.create({
      student: studentId,
      exam: exam._id,
      ...graded,
      status: "graded",
      startedAt,
      submittedAt: new Date(),
      examSnapshot: {
        examName: exam.examName || null,
        subject: exam.subject || null,
        class: exam.class || null,
        section: exam.section || null,
        totalMarks: graded.totalMarks,
      },
    });
  } catch (err) {
    if (err.code === 11000) return null;
    throw err;
  }
};

// Submits attempts whose time ran out without the student submitting (closed tab,
// lost connection), using their last autosaved answers.
export const finalizeExpiredAttempts = async (filter = {}) => {
  const attempts = await Attempt.find(filter);
  if (!attempts.length) return;
  const exams = new Map(
    (await Exam.find({ _id: { $in: attempts.map((a) => a.exam) } }).lean()).map((e) => [String(e._id), e])
  );
  const now = Date.now();
  for (const attempt of attempts) {
    const exam = exams.get(String(attempt.exam));
    if (exam && now <= attemptDeadline(exam, attempt) + GRACE_MS) continue;
    if (exam) await saveResult(exam, attempt.student, attempt.answers, attempt.startedAt);
    await attempt.deleteOne();
  }
};

// Standard competition ranking on score: equal scores share a rank (1, 2, 2, 4).
export const withRanks = (results) => {
  const sorted = [...results].sort((a, b) => b.score - a.score);
  let rank = 0;
  return sorted.map((r, i) => {
    if (i === 0 || r.score !== sorted[i - 1].score) rank = i + 1;
    return { ...(r.toObject ? r.toObject() : r), rank };
  });
};
