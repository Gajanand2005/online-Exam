import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";

const MEDAL = { 1: "🥇", 2: "🥈", 3: "🥉" };

const Row = ({ r }) => (
  <tr className={`border-t ${r.isMe ? "bg-blue-50 font-semibold" : ""}`}>
    <td className="p-3 whitespace-nowrap">
      {MEDAL[r.rank] && <span aria-hidden="true">{MEDAL[r.rank]} </span>}
      {r.rank}
    </td>
    <td className="p-3">
      {r.name}
      {r.isMe && <span className="ml-1 text-blue-700 text-sm">(you)</span>}
      <span className="block text-xs text-gray-500 font-normal">
        Roll {r.rollNo}
        {r.section && ` • Sec ${r.section}`}
      </span>
    </td>
    <td className="p-3 whitespace-nowrap">
      {r.score}/{r.totalMarks}
    </td>
    <td className="p-3">{r.percentage}%</td>
  </tr>
);

const Leaderboard = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("studentToken")) {
      navigate("/");
      return;
    }
    api
      .get(`/results/leaderboard/${examId}`)
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.response?.status === 401) return navigate("/");
        setError(err.response?.data?.error || "Could not load the leaderboard.");
      });
  }, [examId, navigate]);

  const meInTop = data?.leaderboard.some((r) => r.isMe);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h1 className="text-xl font-bold">Leaderboard{data && `: ${data.exam.examName}`}</h1>
          <div className="flex gap-2">
            <button onClick={() => navigate("/dashboard")} className="px-4 py-2 bg-gray-500 text-white rounded-lg">
              Dashboard
            </button>
          </div>
        </div>
        {error ? (
          <p className="text-red-600">{error}</p>
        ) : !data ? (
          <p>Loading...</p>
        ) : (
          <>
            <p className="mb-4 text-gray-700">
              Your rank: <strong>{data.me.rank}</strong> of {data.participants} • {data.me.score}/{data.me.totalMarks} (
              {data.me.percentage}%)
            </p>
            <div className="bg-white rounded-xl shadow overflow-x-auto">
              <table className="w-full">
                <caption className="sr-only">Top {data.leaderboard.length} students</caption>
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="p-3">Rank</th>
                    <th className="p-3">Student</th>
                    <th className="p-3">Marks</th>
                    <th className="p-3">%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.leaderboard.map((r) => (
                    <Row key={`${r.rank}-${r.rollNo}-${r.name}`} r={r} />
                  ))}
                  {!meInTop && (
                    <>
                      <tr aria-hidden="true">
                        <td colSpan={4} className="p-1 text-center text-gray-400">
                          ⋯
                        </td>
                      </tr>
                      <Row r={data.me} />
                    </>
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-gray-500">Equal marks share a rank.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
