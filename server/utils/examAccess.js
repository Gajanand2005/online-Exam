import { normalizeClass, normalizeSection } from "./normalize.js";

// A student may only see active exams for their own class, and for their own
// section unless the exam has no section (open to the whole class).
export const canStudentAccessExam = (exam, student) =>
  !!exam &&
  exam.isActive !== false &&
  normalizeClass(exam.class) === normalizeClass(student.class) &&
  (!exam.section || normalizeSection(exam.section) === normalizeSection(student.section));

// Exam details for a student outside of an attempt: no questions at all, just how many.
export const toStudentExamSummary = ({ questions = [], ...exam }) => ({
  ...exam,
  questionCount: questions.length,
});

// Questions as a student is allowed to see them: never include the answer key.
export const toStudentQuestions = (questions = []) =>
  questions.map(({ correctAnswer, ...q }) => q);
