import { Button } from "@mui/material";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";

const ShowResult = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(Boolean(examId));

  useEffect(() => {
    if (!localStorage.getItem("teacherToken")) {
      navigate("/teacher-login");
      return;
    }
    if (examId) {
      Promise.all([
        api.get(`/exams/${examId}`),
        api.get(`/results/exam/${examId}`),
      ])
        .then(([exRes, resRes]) => {
          setExam(exRes.data.exam);
          setResults(resRes.data.results || []);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }
  }, [examId, navigate]);

  const handleExportExcel = async () => {
    try {
      const url = examId
        ? `/results/export/excel?examId=${examId}`
        : "/results/export/excel";
      const { data } = await api.get(url, { responseType: "arraybuffer" });
      const blob = new Blob([data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `results-${exam?.examName || "all"}-${Date.now()}.xlsx`;
      a.click();
    } catch (err) {
      alert(err.response?.data?.error || "Export failed");
    }
  };

  if (!examId) {
    return (
      <div className="p-8 text-center">
        <p>Select an exam from the Exam list to view results.</p>
        <Button className="!mt-4" onClick={() => navigate("/exam")}>
          Back to Exams
        </Button>
      </div>
    );
  }

  return (
    <div className="view min-h-screen p-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-center mt-5 font-bold text-2xl sm:text-3xl">
          Results {exam ? `: ${exam.examName || exam.title}` : ""}
        </h1>
        {results.length > 0 && (
          <p className="text-center text-sm text-gray-600 mt-1">
            {results.length} submitted • average{" "}
            {Math.round(results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length)}%
          </p>
        )}
        <div className="w-full border mt-4" />
        <div className="flex justify-between items-center mt-4 flex-wrap gap-2">
          <Button
            variant="contained"
            color="primary"
            onClick={handleExportExcel}
            className="!bg-green-600"
          >
            Download Excel
          </Button>
          <Button onClick={() => navigate("/exam")}>Back to Exams</Button>
        </div>
        {loading ? (
          <p className="mt-6">Loading...</p>
        ) : results.length === 0 ? (
          <p className="mt-6 text-gray-600">No results for this exam yet.</p>
        ) : (
          <div className="overflow-x-auto mt-6">
            <table className="w-full border-collapse border text-sm sm:text-base">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Rank</th>
                  <th className="border p-2 text-left">Student</th>
                  <th className="border p-2 text-left hidden sm:table-cell">Father Name</th>
                  <th className="border p-2 text-left hidden sm:table-cell">Class</th>
                  <th className="border p-2 text-left">Section</th>
                  <th className="border p-2 text-left">Roll No</th>
                  <th className="border p-2 text-left">Marks</th>
                  <th className="border p-2 text-left">%</th>
                  <th className="border p-2 text-left hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r._id}>
                    <td className="border p-2 font-semibold">{r.rank}</td>
                    <td className="border p-2">{r.student?.name ?? "(deleted student)"}</td>
                    <td className="border p-2 hidden sm:table-cell">{r.student?.fatherName}</td>
                    <td className="border p-2 hidden sm:table-cell">{r.student?.class}</td>
                    <td className="border p-2">{r.student?.section}</td>
                    <td className="border p-2">{r.student?.rollNo}</td>
                    <td className="border p-2">
                      {r.score} / {r.totalMarks}
                    </td>
                    <td className="border p-2">{r.percentage}%</td>
                    <td className="border p-2 hidden sm:table-cell">
                      {r.submittedAt
                        ? new Date(r.submittedAt).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShowResult;
