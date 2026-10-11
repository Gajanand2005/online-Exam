import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { formatCountdown, formatDateTime, formatTime } from "../../utils/datetime";

// The server's status can go stale while the page is open; move it on as time passes.
const liveStatus = (exam, serverNow) => {
  const start = exam.startAt ? new Date(exam.startAt).getTime() : null;
  const end = exam.endAt ? new Date(exam.endAt).getTime() : null;
  if (exam.status === "upcoming" && start && serverNow >= start) return end && serverNow >= end ? "closed" : "open";
  if (exam.status === "open" && end && serverNow >= end) return "closed";
  return exam.status;
};

const ExamAction = ({ exam, status, serverNow, onOpen, onLeaderboard }) => {
  const button = "mt-3 w-full py-2 rounded-lg font-medium";
  switch (status) {
    case "submitted":
      return (
        <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
            Submitted
            {exam.result && ` • ${exam.result.score}/${exam.result.totalMarks} (${exam.result.percentage}%)`}
          </span>
          <button onClick={onLeaderboard} className="px-3 py-1 rounded-lg border border-blue-600 text-blue-700 text-sm">
            Leaderboard
          </button>
        </div>
      );
    case "in_progress":
      return (
        <button onClick={onOpen} className={`${button} bg-amber-500 text-white`}>
          Resume Exam
        </button>
      );
    case "upcoming":
      return (
        <button disabled className={`${button} bg-gray-200 text-gray-600 cursor-not-allowed`}>
          Starts in {formatCountdown(new Date(exam.startAt).getTime() - serverNow)}
        </button>
      );
    case "closed":
      return <p className="mt-3 text-sm text-gray-500">This exam has ended.</p>;
    default:
      return (
        <button
          onClick={onOpen}
          disabled={!exam.questionCount}
          className={`${button} bg-blue-600 text-white disabled:opacity-50`}
        >
          {exam.questionCount ? "Start Exam" : "No questions yet"}
        </button>
      );
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user] = useState(() => JSON.parse(localStorage.getItem("studentUser") || "null"));
  // server clock = local clock + offset, so countdowns don't depend on the device's time
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    api
      .get("/exams/student")
      .then((res) => {
        setExams(res.data.exams || []);
        if (res.data.serverNow) setOffset(new Date(res.data.serverNow).getTime() - Date.now());
      })
      .catch((err) => {
        if (err.response?.status === 401) return navigate("/");
        setError("Could not load exams. Check your connection and refresh.");
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("studentToken");
    localStorage.removeItem("studentUser");
    navigate("/");
  };

  if (!user) return null;
  const serverNow = now + offset;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
          <span className="font-semibold">
            Welcome, {user.name} (Class {user.class}-{user.section})
          </span>
          <div className="flex gap-2">
            <button onClick={handleLogout} className="px-4 py-2 bg-gray-500 text-white rounded-lg">
              Logout
            </button>
          </div>
        </div>
        <h2 className="text-xl font-bold mb-4">Your Exams</h2>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : exams.length === 0 ? (
          <p>No exams available for your class.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {exams.map((exam) => {
              const status = liveStatus(exam, serverNow);
              return (
                <div key={exam._id} className="bg-white rounded-xl shadow p-4 border border-gray-200">
                  <h3 className="font-semibold text-lg">{exam.examName}</h3>
                  <p className="text-gray-600 text-sm">
                    {exam.subject} • Class {exam.class}
                    {exam.section && `-${exam.section}`}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {exam.duration} min • {exam.questionCount} question{exam.questionCount === 1 ? "" : "s"} •{" "}
                    {exam.totalMarks} marks
                  </p>
                  {exam.startAt && (
                    <p className="text-gray-800 text-sm mt-1">
                      {formatDateTime(exam.startAt)} – {formatTime(exam.endAt)}
                    </p>
                  )}
                  <ExamAction
                    exam={exam}
                    status={status}
                    serverNow={serverNow}
                    onOpen={() => navigate(`/exam/${exam._id}`)}
                    onLeaderboard={() => navigate(`/leaderboard/${exam._id}`)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
