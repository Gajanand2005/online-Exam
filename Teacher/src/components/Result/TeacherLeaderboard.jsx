import React, { useEffect, useState } from "react";
import { Button } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";

const TeacherLeaderboard = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("teacherToken")) {
      navigate("/teacher-login");
      return;
    }

    api
      .get(`/results/leaderboard/${examId}`)
      .then((response) => setData(response.data))
      .catch((requestError) => {
        setError(
          requestError.response?.data?.error || "Could not load the leaderboard."
        );
      });
  }, [examId, navigate]);

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mt-5 mb-4 flex-wrap gap-2">
          <div>
            <h1 className="font-bold text-2xl sm:text-3xl">
              Leaderboard{data?.exam?.examName ? `: ${data.exam.examName}` : ""}
            </h1>
            {data && (
              <p className="mt-1 text-sm text-gray-600">
                {data.participants} submitted
                {data.exam?.class ? ` · Class ${data.exam.class}` : ""}
                {data.exam?.section ? ` · Section ${data.exam.section}` : ""}
              </p>
            )}
          </div>
          <Button variant="outlined" onClick={() => navigate(`/show-result/${examId}`)}>
            Back to Results
          </Button>
        </div>

        {error ? (
          <p role="alert" className="mt-6 text-red-600">{error}</p>
        ) : !data ? (
          <p className="mt-6">Loading leaderboard...</p>
        ) : data.leaderboard.length === 0 ? (
          <p className="mt-6 text-gray-600">No results for this exam yet.</p>
        ) : (
          <div className="overflow-x-auto mt-5">
            <table className="w-full border-collapse border text-sm sm:text-base">
              <caption className="sr-only">Exam leaderboard</caption>
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th scope="col" className="border p-2">Rank</th>
                  <th scope="col" className="border p-2">Student</th>
                  <th scope="col" className="border p-2 hidden sm:table-cell">Class</th>
                  <th scope="col" className="border p-2">Section</th>
                  <th scope="col" className="border p-2">Roll No</th>
                  <th scope="col" className="border p-2">Marks</th>
                  <th scope="col" className="border p-2">%</th>
                </tr>
              </thead>
              <tbody>
                {data.leaderboard.map((student) => (
                  <tr key={student.studentId || `${student.rank}-${student.name}`}>
                    <td className="border p-2 font-semibold">{student.rank}</td>
                    <td className="border p-2">{student.name}</td>
                    <td className="border p-2 hidden sm:table-cell">{student.class || "-"}</td>
                    <td className="border p-2">{student.section || "-"}</td>
                    <td className="border p-2">{student.rollNo || "-"}</td>
                    <td className="border p-2">{student.score} / {student.totalMarks}</td>
                    <td className="border p-2">{student.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-gray-500">Equal marks share a rank.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherLeaderboard;