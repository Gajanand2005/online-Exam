import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import api from "../../api/axios";
import { examSlot, formatDateTime, formatTime } from "../../utils/datetime";

const SLOT_BADGE = {
  upcoming: "bg-blue-100 text-blue-800",
  live: "bg-green-100 text-green-800",
  ended: "bg-gray-200 text-gray-700",
};

const Exam = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user] = useState(() => {
    const u = localStorage.getItem("teacherUser");
    return localStorage.getItem("teacherToken") && u ? JSON.parse(u) : null;
  });

  useEffect(() => {
    if (!user) navigate("/teacher-login");
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    api
      .get("/exams")
      .then((res) => setExams(res.data.exams || []))
      .catch(() => setExams([]))
      .finally(() => setLoading(false));
  }, [user]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this exam, its questions and all student results?")) return;
    try {
      await api.delete(`/exams/${id}`);
      setExams((prev) => prev.filter((e) => e._id !== id));
    } catch (err) {
      alert(err.response?.data?.error || "Delete failed");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
          <h1 className="text-2xl font-bold">Exams</h1>
          <div className="flex gap-2">
            <Link to="/add-exam">
              <Button className="!bg-blue-500 !text-white !px-4 !py-2 !rounded hover:!bg-blue-600">
                Create Exam
              </Button>
            </Link>
            <Button
              className="!bg-gray-500 !text-white"
              onClick={() => {
                localStorage.removeItem("teacherToken");
                localStorage.removeItem("teacherUser");
                navigate("/teacher-login");
              }}
            >
              Logout
            </Button>
          </div>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : exams.length === 0 ? (
          <p className="text-gray-600">No exams yet. Create one.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => {
              const slot = examSlot(exam);
              const chapters = [...new Set((exam.questions || []).map((q) => q.chapter).filter(Boolean))];
              return (
              <div
                key={exam._id}
                className="w-full p-5 border rounded-lg shadow-sm bg-white"
              >
                <div className="mb-1 font-semibold flex items-start justify-between gap-2">
                  <span>{exam.examName || exam.title}</span>
                  {slot && (
                    <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded ${SLOT_BADGE[slot.state]}`}>
                      {slot.state === "live" ? "Live" : slot.state === "upcoming" ? "Upcoming" : "Ended"}
                    </span>
                  )}
                </div>
                <div className="mb-1 text-sm text-gray-600">{exam.subject}</div>
                <div className="mb-1 text-sm">
                  Class: {exam.class}-{exam.section || "All sections"}
                  {exam.isActive === false && <span className="ml-2 text-red-600">(inactive)</span>}
                </div>
                <div className="mb-1 text-sm">
                  Marks: {exam.totalMarks} • {exam.duration} min • {exam.questions?.length || 0} question
                  {exam.questions?.length === 1 ? "" : "s"}
                </div>
                <div className="mb-1 text-sm text-gray-700">
                  {slot
                    ? `${formatDateTime(slot.start)} – ${formatTime(slot.end)}`
                    : "No start time set (edit to schedule)"}
                </div>
                {chapters.length > 0 && (
                  <div className="mb-2 text-sm text-gray-600">Chapters: {chapters.join(", ")}</div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Link to={`/add-questions/${exam._id}`}>
                    <Button size="small" className="!bg-blue-400 !text-white">
                      Questions
                    </Button>
                  </Link>
                  <Link to={`/edit-exam/${exam._id}`}>
                    <Button size="small" className="!bg-amber-500 !text-white">
                      Edit
                    </Button>
                  </Link>
                  <Link to={`/show-result/${exam._id}`}>
                    <Button size="small" className="!bg-green-500 !text-white">
                      Results
                    </Button>
                  </Link>
                  <Button
                    size="small"
                    className="!bg-red-500 !text-white"
                    onClick={() => handleDelete(exam._id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Exam;
