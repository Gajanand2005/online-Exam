import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@mui/material";
import api from "../../api/axios";

const MEDAL = { 1: "🥇", 2: "🥈", 3: "🥉" };

const TeacherLeaderboard = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("teacherToken")) {
      navigate("/teacher-login");
      return;
    }

    api
      .get(`/results/leaderboard/${examId}`)
      .then((res) => setData(res.data))
      .catch((err) => {
        setError(err.response?.data?.error || "Could not load the leaderboard.");
      })
      .finally(() => setLoading(false));
  }, [examId, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
          <h1 className="text-2xl font-bold">
            Leaderboard{data ? `: ${data.exam.examName}` : ""}
          </h1>
          <Button variant="outlined" onClick={() => navigate(`/show-result/${examId}`)}>
            Back to Results
          </Button>
        </div>

        {error ? (
          <p className="text-red-600">{error}</p>
        ) : loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <p className="mb-4 text-gray-700">
              {data.participants} participants • ranked by score
            </p>
            <div className="bg-white rounded-xl shadow overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3">Rank</th>
                    <th className="p-3">Student</th>
                    <th className="p-3">Class</th>
                    <th className="p-3">Section</th>
                    <th className="p-3">Roll No</th>
                    <th className="p-3">Marks</th>
                    <th className="p-3">%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.leaderboard.map((row) => (
                    <tr key={`${row.rank}-${row.name}-${row.rollNo}`} className="border-t">
                      <td className="p-3 font-semibold">
                        {MEDAL[row.rank] && <span aria-hidden="true">{MEDAL[row.rank]} </span>}
                        {row.rank}
                      </td>
                      <td className="p-3">{row.name}</td>
                      <td className="p-3">{row.class ?? "-"}</td>
                      <td className="p-3">{row.section ?? "-"}</td>
                      <td className="p-3">{row.rollNo ?? "-"}</td>
                      <td className="p-3">
                        {row.score}/{row.totalMarks}
                      </td>
                      <td className="p-3">{row.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherLeaderboard;
