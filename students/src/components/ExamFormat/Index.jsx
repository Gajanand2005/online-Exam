import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Radio from "@mui/material/Radio";
import Button from "@mui/material/Button";
import { GrFormNext, GrFormPrevious } from "react-icons/gr";
import api from "../../api/axios";
import { formatCountdown, formatDateTime } from "../../utils/datetime";

// Answers are sent to the server this long after the student's last click.
const AUTOSAVE_DELAY = 600;

const toAnswerList = (answers) =>
  Object.entries(answers).map(([questionId, selectedOption]) => ({ questionId, selectedOption }));

const SAVE_LABEL = {
  saving: { text: "Saving…", className: "text-gray-500" },
  saved: { text: "All answers saved", className: "text-green-700" },
  error: { text: "Not saved — check your connection, retrying…", className: "text-red-600" },
  closed: { text: "Time is up — answers are locked", className: "text-red-600" },
};

const ExamFormat = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // questionId -> option index
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadError, setLoadError] = useState(null);
  // The deadline is the server's; offset maps this device's clock onto the server's.
  const [deadline, setDeadline] = useState(null);
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [saveState, setSaveState] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState(null);

  const answersRef = useRef(answers);
  const version = useRef(0); // bumps on every answer change
  const savedVersion = useRef(0);
  const saving = useRef(false);
  const submitStarted = useRef(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    if (!localStorage.getItem("studentToken")) {
      navigate("/");
      return;
    }
    api
      .post(`/attempts/${examId}/start`)
      .then(({ data }) => {
        setExam(data.exam);
        setQuestions(data.questions);
        setAnswers(Object.fromEntries(data.answers.map((a) => [a.questionId, a.selectedOption])));
        setOffset(new Date(data.serverNow).getTime() - Date.now());
        setDeadline(new Date(data.deadline).getTime());
        if (data.answers.length) setSaveState("saved");
      })
      .catch((err) => {
        if (err.response?.status === 401) return navigate("/");
        setLoadError({
          message: err.response?.data?.error || "Could not load the exam. Check your connection.",
          startAt: err.response?.data?.startAt,
        });
      });
  }, [examId, navigate]);

  const persist = useCallback(
    async function persistAnswers() {
      if (saving.current || submitStarted.current) return;
      if (savedVersion.current === version.current) return;
      saving.current = true;
      const sending = version.current;
      setSaveState("saving");
      try {
        await api.put(`/attempts/${examId}/answers`, { answers: toAnswerList(answersRef.current) });
        savedVersion.current = sending;
        setSaveState(sending === version.current ? "saved" : "saving");
      } catch (err) {
        setSaveState(err.response?.status === 409 ? "closed" : "error");
      } finally {
        saving.current = false;
      }
      // answers changed while that request was in flight
      if (savedVersion.current !== version.current && !submitStarted.current) persistAnswers();
    },
    [examId]
  );

  // Autosave shortly after each answer; retry every few seconds if the network failed.
  useEffect(() => {
    if (!version.current) return;
    const t = setTimeout(persist, AUTOSAVE_DELAY);
    return () => clearTimeout(t);
  }, [answers, persist]);

  useEffect(() => {
    if (saveState !== "error") return;
    const t = setTimeout(persist, 5000);
    return () => clearTimeout(t);
  }, [saveState, persist]);

  const submit = useCallback(async () => {
    if (submitStarted.current) return;
    submitStarted.current = true;
    setSubmitting(true);
    setSubmitError("");
    try {
      const { data } = await api.post("/results/submit", { examId, answers: toAnswerList(answersRef.current) });
      setResult({ ...data.result, late: data.late });
    } catch (err) {
      submitStarted.current = false;
      setSubmitError(err.response?.data?.error || "Could not submit. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }, [examId]);

  // Clock tick; when the server's deadline passes, submit automatically.
  useEffect(() => {
    if (!deadline || result) return;
    const t = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current + offset >= deadline) {
        clearInterval(t);
        submit();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [deadline, offset, result, submit]);

  const choose = (questionId, option) => {
    if (saveState === "closed" || submitStarted.current) return;
    version.current += 1;
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = () => {
    const unanswered = questions.length - Object.keys(answers).length;
    const message =
      unanswered > 0 ? `${unanswered} question(s) not answered. Submit anyway?` : "Submit the exam? You can't change answers after this.";
    if (window.confirm(message)) submit();
  };

  // Discourage copying questions out of the exam.
  const blockCopy = (e) => e.preventDefault();

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <p className="text-lg font-semibold">{loadError.message}</p>
          {loadError.startAt && <p className="mt-2 text-gray-600">Starts {formatDateTime(loadError.startAt)}</p>}
          <button onClick={() => navigate("/dashboard")} className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg font-semibold">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!exam) return <div className="p-8 text-center">Loading exam...</div>;

  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-green-700">Exam Submitted</h2>
          {result.late && <p className="mt-2 text-gray-600">Time was up, so your saved answers were submitted.</p>}
          <p className="mt-4 text-4xl font-bold">
            {result.score}/{result.totalMarks}
          </p>
          <p className="text-gray-600">{result.percentage}%</p>
          <button
            onClick={() => navigate(`/leaderboard/${examId}`)}
            className="mt-6 w-full py-2 border border-blue-600 text-blue-700 rounded-lg font-semibold"
          >
            View Leaderboard
          </button>
          <button onClick={() => navigate("/dashboard")} className="mt-3 w-full py-2 bg-blue-600 text-white rounded-lg font-semibold">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const remaining = deadline ? deadline - (now + offset) : 0;
  const timeUp = remaining <= 0;
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const saveLabel = SAVE_LABEL[saveState];

  return (
    <div className="min-h-screen bg-gray-50 pb-8 select-none" onCopy={blockCopy} onCut={blockCopy} onContextMenu={blockCopy}>
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-2">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-lg font-bold truncate">{exam.examName}</h1>
            <p className="text-xs text-gray-500">
              {exam.subject} • {answeredCount}/{questions.length} answered
            </p>
          </div>
          <div
            className={`font-mono text-lg font-bold px-3 py-1 rounded ${
              remaining < 60 * 1000 ? "bg-red-100 text-red-700" : remaining < 5 * 60 * 1000 ? "bg-amber-100 text-amber-800" : "bg-gray-100"
            }`}
            aria-label="Time left"
          >
            {formatCountdown(remaining)}
          </div>
        </div>
        {saveLabel && (
          <p className={`max-w-3xl mx-auto text-xs mt-1 ${saveLabel.className}`} aria-live="polite">
            {saveLabel.text}
          </p>
        )}
      </header>

      {(timeUp || submitError) && (
        <div className="max-w-3xl mx-auto px-4 mt-4">
          <div role="alert" className="p-3 rounded-md bg-amber-100 text-amber-900 flex items-center justify-between gap-2 flex-wrap">
            <span>{submitError || (submitting ? "Time is up. Submitting your answers..." : "Time is up.")}</span>
            {!submitting && (
              <button onClick={submit} className="px-3 py-1 rounded bg-blue-600 text-white">
                {submitError ? "Try again" : "Submit now"}
              </button>
            )}
          </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-4">
        {/* question palette: jump to any question; filled = answered */}
        <nav aria-label="Questions" className="flex flex-wrap gap-2 mt-4">
          {questions.map((q, i) => {
            const answered = answers[q._id] !== undefined;
            return (
              <button
                key={q._id}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Question ${i + 1}${answered ? ", answered" : ""}`}
                aria-current={i === currentIndex ? "step" : undefined}
                className={`w-9 h-9 rounded-md text-sm font-medium border ${
                  answered ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-300"
                } ${i === currentIndex ? "ring-2 ring-offset-1 ring-indigo-500" : ""}`}
              >
                {i + 1}
              </button>
            );
          })}
        </nav>

        {currentQuestion && (
          <section className="mt-6">
            <div className="rounded-md border border-indigo-500/50 bg-white p-4">
              <p className="text-sm text-gray-500">
                Question {currentIndex + 1} of {questions.length} • {currentQuestion.marks} mark
                {currentQuestion.marks === 1 ? "" : "s"}
                {currentQuestion.chapter && ` • ${currentQuestion.chapter}`}
              </p>
              <h2 className="mt-1 text-base sm:text-lg">{currentQuestion.questionText}</h2>
            </div>
            <div role="radiogroup" aria-label={`Options for question ${currentIndex + 1}`} className="flex flex-col mt-4 gap-3">
              {currentQuestion.options.map((opt, idx) => (
                <label
                  key={`${currentQuestion._id}-${idx}`}
                  className={`w-full border-2 flex items-center rounded-md pl-2 pr-3 py-1 cursor-pointer bg-white ${
                    answers[currentQuestion._id] === idx ? "border-blue-600" : "border-indigo-500/30"
                  }`}
                >
                  <Radio
                    value={idx}
                    checked={answers[currentQuestion._id] === idx}
                    onChange={() => choose(currentQuestion._id, idx)}
                    disabled={timeUp}
                  />
                  <span className="ml-1">{opt}</span>
                </label>
              ))}
            </div>
          </section>
        )}

        <div className="flex justify-between items-center mt-8 gap-2">
          <Button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="!bg-[#FFF7E6] hover:!bg-zinc-400 !text-black"
          >
            <GrFormPrevious className="!text-[16px]" /> Previous
          </Button>
          {currentIndex < questions.length - 1 ? (
            <Button
              onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
              className="!bg-[#FFF7E6] hover:!bg-zinc-400 !text-black"
            >
              Next <GrFormNext className="!text-[16px]" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting} className="!bg-green-600 !text-white">
              {submitting ? "Submitting..." : "Submit Exam"}
            </Button>
          )}
        </div>
        {currentIndex < questions.length - 1 && (
          <div className="text-center mt-6">
            <button onClick={handleSubmit} disabled={submitting} className="text-sm text-gray-600 underline px-3 py-2">
              Finish and submit now
            </button>
          </div>
        )}
        <p className="text-center text-xs text-gray-500 mt-6">
          Your answers are saved as you go. If you get disconnected, open the exam again to continue.
        </p>
      </main>
    </div>
  );
};

export default ExamFormat;
