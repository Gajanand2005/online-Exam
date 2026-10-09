/**
 * End-to-end API checks for the exam flow (teacher creates → student takes → results).
 * Needs the API running against a database it can write to:
 *   npm start            # in one terminal
 *   npm test             # in another
 * Uses TEACHER_EMAIL / TEACHER_PASSWORD / PRINCIPAL_USERNAME / PRINCIPAL_PASSWORD from
 * the environment or .env, and API_URL (default http://localhost:8000/api).
 * Creates its own exams and students; deletes the exams (and their results) at the end.
 */
import "dotenv/config";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";

const API_URL = process.env.API_URL || "http://localhost:8000/api";
const run = Date.now().toString(36);
const cls = `T${run}`;
const minutesFromNow = (m) => new Date(Date.now() + m * 60 * 1000).toISOString();

const call = async (method, path, { token, body } = {}) => {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body && JSON.stringify(body),
  });
  return { status: res.status, data: await res.json().catch(() => null) };
};

const studentLogin = async (section, rollNo) => {
  const { data } = await call("POST", "/auth/student/login", {
    body: { name: `Test ${rollNo}`, fatherName: "Parent", class: cls, section, rollNo },
  });
  assert.ok(data.token, "student login failed");
  return data.token;
};

let teacher, principal;
const exams = {};
const students = {};
let qIds = [];

const createExam = async (key, body) => {
  const { status, data } = await call("POST", "/exams", {
    token: teacher,
    body: { title: `${key} ${run}`, subject: "Math", class: cls, section: "A", duration: 10, totalMarks: 3, ...body },
  });
  assert.equal(status, 201, JSON.stringify(data));
  exams[key] = data.exam._id;
  return data.exam;
};

const addQuestion = (examId, questionText, options, extra = {}) =>
  call("POST", "/questions", { token: teacher, body: { examId, questionText, options, ...extra } });

before(async () => {
  const email = process.env.TEACHER_EMAIL;
  assert.ok(email && process.env.TEACHER_PASSWORD, "set TEACHER_EMAIL / TEACHER_PASSWORD to run these tests");
  teacher = (
    await call("POST", "/auth/teacher/login", {
      body: { email: email.toUpperCase(), password: process.env.TEACHER_PASSWORD },
    })
  ).data?.token;
  principal = (
    await call("POST", "/auth/principal/login", {
      body: { username: process.env.PRINCIPAL_USERNAME, password: process.env.PRINCIPAL_PASSWORD },
    })
  ).data?.token;
  assert.ok(teacher && principal, "fixed teacher/principal login failed");

  await createExam("open", { startAt: minutesFromNow(-1) });
  await createExam("upcoming", { startAt: minutesFromNow(60) });
  await createExam("closed", { startAt: minutesFromNow(-120), duration: 60 });
  await createExam("expiry", { startAt: minutesFromNow(-1) });
  for (const key of ["upcoming", "closed", "expiry"])
    await addQuestion(exams[key], "1+1?", ["2", "3"], { correctAnswer: 0 });

  for (const [key, section] of [["a", "A"], ["b", "B"], ["c", "A"], ["d", "A"], ["e", "A"]])
    students[key] = await studentLogin(section, key);
});

after(async () => {
  for (const id of Object.values(exams)) await call("DELETE", `/exams/${id}`, { token: teacher });
});

test("teacher logs in with the fixed email; there is no sign-up", async () => {
  const bad = await call("POST", "/auth/teacher/login", {
    body: { email: process.env.TEACHER_EMAIL, password: "wrong-password" },
  });
  assert.equal(bad.status, 401);
  const register = await call("POST", "/teacher/register", {
    body: { name: "x", email: `x${run}@example.com`, password: "12345678" },
  });
  assert.equal(register.status, 404);

  // query operators in login fields are rejected, not run against the database
  const injected = await call("POST", "/auth/student/login", {
    body: { name: { $ne: "" }, fatherName: { $ne: "" }, class: cls, section: "A", rollNo: { $ne: "" } },
  });
  assert.equal(injected.status, 400);
});

test("student login tolerates case, extra spaces, 'Class 10th' style class and leading zeros", async () => {
  const login = (body) => call("POST", "/auth/student/login", { body });
  const first = await login({ name: "Riya Sen", fatherName: "Amit Sen", class: `${cls}`, section: "A", rollNo: "7" });
  assert.equal(first.status, 200);
  for (const variant of [
    { name: "riya  sen ", fatherName: "AMIT SEN", class: `class ${cls}`, section: "a", rollNo: "007" },
    { name: "Riya Sen", fatherName: "Amit Sen", class: cls.toLowerCase(), section: "Sec A", rollNo: " 7 " },
  ]) {
    const again = await login(variant);
    assert.equal(again.status, 200, JSON.stringify(again.data));
    assert.equal(again.data.user.id, first.data.user.id);
  }
  const wrongName = await login({ name: "Someone Else", fatherName: "Amit Sen", class: cls, section: "A", rollNo: "7" });
  assert.equal(wrongName.status, 401);
  assert.match(wrongName.data.error, /different name/);
});

test("questions: {text, isCorrect} options, chapter, edit and delete by id", async () => {
  const id = exams.open;
  let r = await addQuestion(id, "2+2?", [{ text: "3" }, { text: "4", isCorrect: true }], { chapter: "Addition" });
  assert.equal(r.status, 201);
  assert.deepEqual(r.data.question.options, ["3", "4"]);
  assert.equal(r.data.question.correctAnswer, 1);
  assert.equal(r.data.question.chapter, "Addition");
  assert.ok(r.data.question._id);

  r = await addQuestion(id, "Capital of India?", [{ text: "Delhi", isCorrect: true }, { text: "Mumbai" }], { marks: 2, chapter: "GK" });
  assert.equal(r.status, 201);

  assert.equal((await addQuestion(id, "No answer", [{ text: "a" }, { text: "b" }])).status, 400);
  assert.equal((await addQuestion(id, "Blank", [{ text: "a", isCorrect: true }, { text: " " }])).status, 400);

  r = await addQuestion(id, "temp", ["x", "y"], { correctAnswer: 0 });
  const tempId = r.data.question._id;
  r = await call("PUT", `/questions/${id}/${tempId}`, {
    token: teacher,
    body: { options: [{ text: "x" }, { text: "y", isCorrect: true }], chapter: "Scratch" },
  });
  assert.equal(r.status, 200);
  assert.equal(r.data.question.correctAnswer, 1);
  assert.equal(r.data.question.questionText, "temp");
  assert.equal(r.data.question.chapter, "Scratch");

  assert.equal((await call("DELETE", `/questions/${id}/${tempId}`, { token: teacher })).status, 200);
  assert.equal((await call("DELETE", `/questions/${id}/${tempId}`, { token: teacher })).status, 404);
  assert.equal((await call("PUT", `/questions/${id}/not-an-id`, { token: teacher, body: {} })).status, 404);

  r = await call("GET", `/questions/exam/${id}`, { token: teacher });
  assert.equal(r.data.questions.length, 2);
  qIds = r.data.questions.map((q) => q._id);
});

test("students get no questions outside an attempt", async () => {
  const list = await call("GET", "/exams/student", { token: students.a });
  const listed = list.data.exams.find((e) => e._id === exams.open);
  assert.ok(listed, "exam missing from dashboard");
  assert.equal(listed.questions, undefined);
  assert.equal(listed.questionCount, 2);

  const exam = await call("GET", `/exams/${exams.open}`, { token: students.a });
  assert.equal(exam.status, 200);
  assert.equal(exam.data.exam.questions, undefined);

  assert.equal((await call("GET", `/questions/exam/${exams.open}`, { token: students.a })).status, 403);
});

test("dashboard status follows the paper slot; entry only while it is open", async () => {
  const { data } = await call("GET", "/exams/student", { token: students.a });
  const status = Object.fromEntries(data.exams.map((e) => [e._id, e.status]));
  assert.equal(status[exams.open], "open");
  assert.equal(status[exams.upcoming], "upcoming");
  assert.equal(status[exams.closed], "closed");

  const early = await call("POST", `/attempts/${exams.upcoming}/start`, { token: students.a });
  assert.equal(early.status, 403);
  assert.ok(early.data.startAt);
  assert.equal((await call("POST", `/attempts/${exams.closed}/start`, { token: students.a })).status, 403);
});

test("another section cannot see, start or submit the exam", async () => {
  const list = await call("GET", "/exams/student", { token: students.b });
  assert.ok(!list.data.exams.some((e) => e._id === exams.open));
  assert.equal((await call("POST", `/attempts/${exams.open}/start`, { token: students.b })).status, 404);
  const submit = await call("POST", "/results/submit", { token: students.b, body: { examId: exams.open, answers: [] } });
  assert.equal(submit.status, 404);
});

test("starting gives questions without answers and a deadline at the end of the slot", async () => {
  const { status, data } = await call("POST", `/attempts/${exams.open}/start`, { token: students.a });
  assert.equal(status, 200);
  assert.equal(data.questions.length, 2);
  assert.ok(data.questions.every((q) => !("correctAnswer" in q) && q._id));
  const exam = (await call("GET", `/exams/${exams.open}`, { token: teacher })).data.exam;
  assert.equal(new Date(data.deadline).getTime(), new Date(exam.startAt).getTime() + 10 * 60 * 1000);
  assert.ok(data.serverNow);
});

test("answers autosave and come back when the exam is resumed", async () => {
  const save = await call("PUT", `/attempts/${exams.open}/answers`, {
    token: students.a,
    body: {
      answers: [
        { questionId: qIds[0], selectedOption: 1 },
        { questionId: qIds[0], selectedOption: 0 }, // duplicate: first one wins
        { questionId: qIds[1], selectedOption: 9 }, // out of range: dropped
        { questionId: "000000000000000000000000", selectedOption: 0 },
      ],
    },
  });
  assert.equal(save.status, 200);
  assert.equal(save.data.saved, 1);

  const resume = await call("POST", `/attempts/${exams.open}/start`, { token: students.a });
  assert.deepEqual(resume.data.answers, [{ questionId: qIds[0], selectedOption: 1 }]);
  const list = await call("GET", "/exams/student", { token: students.a });
  assert.equal(list.data.exams.find((e) => e._id === exams.open).status, "in_progress");

  assert.equal(
    (await call("PUT", `/attempts/${exams.open}/answers`, { token: students.c, body: { answers: [] } })).status,
    409,
    "autosave without starting"
  );
});

test("submit grades every question once; unanswered score zero; one attempt only", async () => {
  assert.equal(
    (await call("POST", "/results/submit", { token: students.c, body: { examId: exams.open, answers: [] } })).status,
    400,
    "submit without starting"
  );

  // A: Q1 right (1 mark) answered three times, Q2 (2 marks) blank → 1 / 3
  const { status, data } = await call("POST", "/results/submit", {
    token: students.a,
    body: {
      examId: exams.open,
      answers: [1, 1, 1].map((selectedOption) => ({ questionId: qIds[0], selectedOption })),
    },
  });
  assert.equal(status, 201);
  assert.equal(data.result.score, 1);
  assert.equal(data.result.totalMarks, 3);
  assert.equal(data.result.percentage, 33);
  assert.ok(data.result.startedAt);

  const again = await call("POST", "/results/submit", { token: students.a, body: { examId: exams.open, answers: [] } });
  assert.equal(again.status, 400);
  assert.equal((await call("POST", `/attempts/${exams.open}/start`, { token: students.a })).status, 409);
});

test("leaderboard ranks by score, ties share a rank, students see it after submitting", async () => {
  const take = async (token, answers) => {
    await call("POST", `/attempts/${exams.open}/start`, { token });
    return call("POST", "/results/submit", { token, body: { examId: exams.open, answers } });
  };
  await call("POST", `/attempts/${exams.open}/start`, { token: students.e });
  assert.equal((await call("GET", `/results/leaderboard/${exams.open}`, { token: students.e })).status, 403);

  await take(students.d, [{ questionId: qIds[0], selectedOption: 1 }, { questionId: qIds[1], selectedOption: 0 }]); // 3
  await call("POST", "/results/submit", {
    token: students.e,
    body: { examId: exams.open, answers: [{ questionId: qIds[0], selectedOption: 1 }] },
  }); // 1

  const board = await call("GET", `/results/leaderboard/${exams.open}`, { token: students.e });
  assert.equal(board.status, 200);
  assert.equal(board.data.participants, 3);
  assert.deepEqual(board.data.leaderboard.map((r) => r.rank), [1, 2, 2]);
  assert.equal(board.data.leaderboard[0].score, 3);
  assert.equal(board.data.me.rank, 2);
  assert.ok(board.data.me.isMe);
  assert.ok(board.data.leaderboard.every((r) => !("studentId" in r) && !("fatherName" in r)));

  const history = await call("GET", "/results/student", { token: students.a });
  const mine = history.data.results.find((r) => r.exam._id === exams.open);
  assert.equal(mine.rank, 2);
  assert.equal(mine.participants, 3);

  const byExam = await call("GET", `/results/exam/${exams.open}`, { token: teacher });
  assert.deepEqual(byExam.data.results.map((r) => r.rank), [1, 2, 2]);
  assert.equal(byExam.data.results[0].student.rollNo, "D"); // roll numbers are stored uppercase

  const full = await call("GET", `/results/leaderboard/${exams.open}`, { token: principal });
  assert.equal(full.data.leaderboard.length, 3);
  assert.equal((await call("GET", "/results", { token: teacher })).status, 403);
});

test("when time runs out autosave stops and saved answers are submitted automatically", async () => {
  const start = await call("POST", `/attempts/${exams.expiry}/start`, { token: students.c });
  assert.equal(start.status, 200);
  const qid = start.data.questions[0]._id;
  await call("PUT", `/attempts/${exams.expiry}/answers`, {
    token: students.c,
    body: { answers: [{ questionId: qid, selectedOption: 0 }] },
  });

  // teacher moves the slot into the past: the paper is now over
  await call("PUT", `/exams/${exams.expiry}`, { token: teacher, body: { startAt: minutesFromNow(-120) } });
  const late = await call("PUT", `/attempts/${exams.expiry}/answers`, {
    token: students.c,
    body: { answers: [{ questionId: qid, selectedOption: 1 }] },
  });
  assert.equal(late.status, 409);

  const list = await call("GET", "/exams/student", { token: students.c });
  const exam = list.data.exams.find((e) => e._id === exams.expiry);
  assert.equal(exam.status, "submitted");
  assert.equal(exam.result.score, 1, "autosaved answer was graded");
});

test("exam update only touches editable fields and validates the schedule", async () => {
  const { status, data } = await call("PUT", `/exams/${exams.upcoming}`, {
    token: teacher,
    body: { duration: 20, section: "", startAt: "", createdBy: "000000000000000000000000", questions: [] },
  });
  assert.equal(status, 200);
  assert.equal(data.exam.duration, 20);
  assert.equal(data.exam.section, null);
  assert.equal(data.exam.startAt, null);
  assert.notEqual(data.exam.createdBy, "000000000000000000000000");
  assert.equal(data.exam.questions.length, 1);

  assert.equal((await call("PUT", `/exams/${exams.upcoming}`, { token: teacher, body: { duration: 0 } })).status, 400);
  assert.equal((await call("PUT", `/exams/${exams.upcoming}`, { token: teacher, body: { startAt: "soon" } })).status, 400);
});

test("students cannot create exams; Excel export works", async () => {
  const body = { title: "nope", subject: "x", class: cls, duration: 5, totalMarks: 1 };
  assert.equal((await call("POST", "/exams", { token: students.a, body })).status, 403);
  assert.equal((await call("POST", "/exams/create2", { token: students.a, body })).status, 404);

  const res = await fetch(`${API_URL}/results/export/excel?examId=${exams.open}`, {
    headers: { Authorization: `Bearer ${teacher}` },
  });
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /spreadsheetml/);
});
