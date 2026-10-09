import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import api from "../../api/axios";

// Changes are saved this long after the teacher stops typing.
const AUTOSAVE_DELAY = 1000;

// Server stores options as strings + correctAnswer index; the editor works with
// { text, isCorrect } so a radio button can mark the right option.
// rev counts local edits and savedRev is the edit the server has, so
// rev !== savedRev means unsaved changes.
const fromServer = (q) => ({
  key: q._id,
  _id: q._id,
  questionText: q.questionText,
  options: q.options.map((text, i) => ({ text, isCorrect: i === q.correctAnswer })),
  marks: q.marks ?? 1,
  chapter: q.chapter || "",
  rev: 0,
  savedRev: 0,
  saving: false,
  error: null,
});

const validate = (q) => {
  if (!q.questionText.trim()) return "enter the question text";
  if (q.options.length < 2) return "add at least two options";
  if (q.options.some((o) => !o.text.trim())) return "fill in every option or remove the empty ones";
  if (q.options.filter((o) => o.isCorrect).length !== 1) return "mark the correct option";
  if (!(Number(q.marks) > 0)) return "marks must be greater than 0";
  return null;
};

const toPayload = (q) => ({
  questionText: q.questionText.trim(),
  options: q.options.map((o) => ({ text: o.text.trim(), isCorrect: o.isCorrect })),
  marks: Number(q.marks),
  chapter: q.chapter.trim(),
});

const isDirty = (q) => q.rev !== q.savedRev;

const SaveStatus = ({ q, onRetry }) => {
  if (q.saving) return <span className="text-gray-500">Saving…</span>;
  if (q.error)
    return (
      <span className="text-red-600">
        Not saved: {q.error}{" "}
        <button type="button" className="underline" onClick={onRetry}>
          Retry
        </button>
      </span>
    );
  if (isDirty(q)) {
    const problem = validate(q);
    return problem ? (
      <span className="text-amber-700">Not saved yet: {problem}</span>
    ) : (
      <span className="text-gray-500">Saving…</span>
    );
  }
  return <span className="text-green-700">Saved ✓</span>;
};

const QuestionCard = ({ number, q, chapters, onChange, onDelete, onRetry }) => {
  const setOptions = (options) => onChange({ options });
  return (
    <div className="border rounded-lg p-4 mb-4 bg-white">
      <div className="flex justify-between items-center mb-2 gap-2 flex-wrap">
        <span className="font-semibold">Q{number}</span>
        <span className="text-sm" aria-live="polite">
          <SaveStatus q={q} onRetry={onRetry} />
        </span>
      </div>
      <input
        placeholder="Question text"
        aria-label={`Question ${number} text`}
        className="border w-full p-2 rounded mb-2"
        value={q.questionText}
        onChange={(e) => onChange({ questionText: e.target.value })}
      />
      <p className="text-xs text-gray-500 mb-1 sm:hidden">Tap the circle next to the correct option</p>
      {q.options.map((opt, oi) => (
        <div key={oi} className="flex items-center gap-2 mb-2">
          <input
            type="text"
            placeholder={`Option ${oi + 1}`}
            aria-label={`Question ${number} option ${oi + 1}`}
            className="border flex-1 min-w-0 p-2 rounded"
            value={opt.text}
            onChange={(e) => setOptions(q.options.map((o, i) => (i === oi ? { ...o, text: e.target.value } : o)))}
          />
          <label className="flex items-center gap-1 whitespace-nowrap">
            <input
              type="radio"
              className="w-5 h-5"
              name={`correct-${q.key}`}
              aria-label={`Question ${number} option ${oi + 1} is correct`}
              checked={opt.isCorrect}
              onChange={() => setOptions(q.options.map((o, i) => ({ ...o, isCorrect: i === oi })))}
            />
            <span className="hidden sm:inline">Correct</span>
          </label>
          <Button
            size="small"
            aria-label={`Remove option ${oi + 1}`}
            disabled={q.options.length <= 2}
            onClick={() => setOptions(q.options.filter((_, i) => i !== oi))}
          >
            −
          </Button>
        </div>
      ))}
      <Button size="small" onClick={() => setOptions([...q.options, { text: "", isCorrect: false }])} className="!mb-2">
        + Option
      </Button>
      <div className="flex items-center gap-4 mt-2 flex-wrap">
        <label className="flex items-center gap-2 text-sm">
          Marks
          <input
            type="number"
            min="1"
            className="border w-20 p-1 rounded text-base sm:text-sm"
            value={q.marks}
            onChange={(e) => onChange({ marks: e.target.value })}
          />
        </label>
        <label className="flex items-center gap-2 text-sm flex-1 min-w-[12rem]">
          Chapter
          <input
            type="text"
            list="chapter-list"
            placeholder="e.g. Chapter 3: Motion"
            className="border p-1 rounded flex-1 min-w-0 text-base sm:text-sm"
            value={q.chapter}
            onChange={(e) => onChange({ chapter: e.target.value })}
          />
        </label>
        <Button size="small" className="!text-red-600 !ml-auto" onClick={onDelete} disabled={q.saving}>
          Delete
        </Button>
      </div>
      {chapters.length > 0 && (
        <datalist id="chapter-list">
          {chapters.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      )}
    </div>
  );
};

const AddQuestions = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [items, setItems] = useState([]);
  const [chapterFilter, setChapterFilter] = useState("");
  const itemsRef = useRef(items);
  const nextDraftId = useRef(0);
  // server requests run one at a time so new questions keep their order
  const queue = useRef(Promise.resolve());
  // What the server has for each question (key -> { _id, savedRev }), kept in a ref so
  // it is current even before React re-renders; plus saves still in flight.
  const server = useRef(new Map());
  const inflight = useRef(new Map());

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    if (!localStorage.getItem("teacherToken")) {
      navigate("/teacher-login");
      return;
    }
    if (!examId) return;
    Promise.all([api.get(`/exams/${examId}`), api.get(`/questions/exam/${examId}`)])
      .then(([exRes, qRes]) => {
        const loaded = (qRes.data.questions || []).map(fromServer);
        loaded.forEach((q) => server.current.set(q.key, { _id: q._id, savedRev: 0 }));
        setExam(exRes.data.exam);
        setItems(loaded);
      })
      .catch(() => navigate("/exam"));
  }, [examId, navigate]);

  const enqueue = (request) => {
    const run = queue.current.then(request, request);
    queue.current = run.catch(() => {});
    return run;
  };

  const patchItem = (key, patch) => setItems((prev) => prev.map((q) => (q.key === key ? { ...q, ...patch } : q)));

  // Saves one question if it has unsaved, complete changes. Resolves true once the
  // server has the latest version, false if it couldn't be saved.
  const save = useCallback(
    function saveQuestion(key) {
      // wait for the save in flight, then save again if there were edits meanwhile
      if (inflight.current.has(key)) return inflight.current.get(key).then(() => saveQuestion(key));
      const q = itemsRef.current.find((item) => item.key === key);
      if (!q) return Promise.resolve(true);
      const known = server.current.get(key) || { _id: null, savedRev: 0 };
      if (known.savedRev === q.rev) return Promise.resolve(true);
      if (validate(q)) return Promise.resolve(false);

      const rev = q.rev;
      const payload = toPayload(q);
      patchItem(key, { saving: true, error: null });
      const request = enqueue(() =>
        known._id ? api.put(`/questions/${examId}/${known._id}`, payload) : api.post("/questions", { examId, ...payload })
      )
        .then(async ({ data }) => {
          const _id = data.question._id;
          server.current.set(key, { _id, savedRev: rev });
          if (!itemsRef.current.some((item) => item.key === key)) {
            // deleted while it was being created: remove the copy the server just made
            if (!known._id) await enqueue(() => api.delete(`/questions/${examId}/${_id}`));
            return true;
          }
          patchItem(key, { _id, savedRev: rev, saving: false });
          return true;
        })
        .catch((err) => {
          patchItem(key, { saving: false, error: err.response?.data?.error || "connection problem" });
          return false;
        })
        .finally(() => inflight.current.delete(key));
      inflight.current.set(key, request);
      return request;
    },
    [examId]
  );

  // Autosave: once edits pause, save every complete question with unsaved changes.
  // Questions with an error wait for the next edit or Retry.
  useEffect(() => {
    const pending = items.filter((q) => isDirty(q) && !q.saving && !q.error && !validate(q));
    if (!pending.length) return;
    const timer = setTimeout(() => pending.forEach((q) => save(q.key)), AUTOSAVE_DELAY);
    return () => clearTimeout(timer);
  }, [items, save]);

  // Warn before closing the tab with changes that haven't reached the server.
  useEffect(() => {
    const unsaved = items.some((q) => isDirty(q) || q.saving);
    if (!unsaved) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [items]);

  const editItem = (key, patch) =>
    setItems((prev) => prev.map((q) => (q.key === key ? { ...q, ...patch, rev: q.rev + 1, error: null } : q)));

  const addQuestion = () =>
    setItems((prev) => [
      ...prev,
      {
        key: `draft-${nextDraftId.current++}`,
        _id: null,
        questionText: "",
        options: [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
        marks: 1,
        chapter: chapterFilter,
        rev: 1,
        savedRev: 0,
        saving: false,
        error: null,
      },
    ]);

  const deleteItem = async (q, number) => {
    const savedId = server.current.get(q.key)?._id;
    if (savedId) {
      if (!window.confirm(`Delete question ${number}?`)) return;
      try {
        await enqueue(() => api.delete(`/questions/${examId}/${savedId}`));
      } catch (err) {
        patchItem(q.key, { error: err.response?.data?.error || "could not delete" });
        return;
      }
    }
    setItems((prev) => prev.filter((item) => item.key !== q.key));
  };

  const backToExams = async () => {
    const outcomes = await Promise.all(itemsRef.current.map((q) => save(q.key)));
    const unsaved = outcomes.filter((ok) => !ok).length;
    if (unsaved && !window.confirm(`${unsaved} question(s) are incomplete or not saved. Leave anyway?`)) return;
    navigate("/exam");
  };

  if (!exam) return <div className="p-8 text-center">Loading...</div>;

  const saved = items.filter((q) => q._id);
  const savedMarks = saved.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
  const chapterCounts = items.reduce((counts, q) => {
    const c = q.chapter.trim();
    if (c) counts.set(c, (counts.get(c) || 0) + 1);
    return counts;
  }, new Map());
  const chapters = [...chapterCounts.keys()].sort();
  const visible = items
    .map((q, i) => ({ q, number: i + 1 }))
    .filter(({ q }) => !chapterFilter || q.chapter.trim() === chapterFilter || !q._id);

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
          <h1 className="text-2xl font-bold">Questions: {exam.examName}</h1>
          <Button className="!bg-gray-500 !text-white" onClick={backToExams}>
            Back to Exams
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          Class {exam.class}
          {exam.section ? `-${exam.section}` : ""} • {exam.subject}
        </p>
        <p className={`mb-1 text-sm ${savedMarks === exam.totalMarks ? "text-gray-600" : "text-amber-700"}`}>
          {saved.length} saved question{saved.length === 1 ? "" : "s"} worth {savedMarks} marks
          {savedMarks !== exam.totalMarks && ` (exam total is set to ${exam.totalMarks})`}
        </p>
        <p className="mb-4 text-xs text-gray-500">Changes save automatically.</p>
        {chapters.length > 0 && (
          <label className="flex items-center gap-2 mb-4 text-sm flex-wrap">
            Show chapter
            <select
              className="border rounded p-1 max-w-full text-base sm:text-sm"
              value={chapterFilter}
              onChange={(e) => setChapterFilter(e.target.value)}
            >
              <option value="">All chapters ({items.length})</option>
              {chapters.map((c) => (
                <option key={c} value={c}>
                  {c} ({chapterCounts.get(c)})
                </option>
              ))}
            </select>
          </label>
        )}
        {visible.map(({ q, number }) => (
          <QuestionCard
            key={q.key}
            number={number}
            q={q}
            chapters={chapters}
            onChange={(patch) => editItem(q.key, patch)}
            onDelete={() => deleteItem(q, number)}
            onRetry={() => {
              patchItem(q.key, { error: null });
              save(q.key);
            }}
          />
        ))}
        <Button className="!bg-blue-500 !text-white" onClick={addQuestion}>
          + Add Question
        </Button>
      </div>
    </div>
  );
};

export default AddQuestions;
