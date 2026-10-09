import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@mui/material";
import api from "../../api/axios";
import { formatDateTime, toLocalInput } from "../../utils/datetime";

// Used for both creating (/add-exam) and editing (/edit-exam/:examId) an exam.
const AddExam = () => {
  const navigate = useNavigate();
  const { examId } = useParams();
  const isEdit = Boolean(examId);
  const [form, setForm] = useState({
    title: "",
    subject: "",
    class: "",
    section: "",
    duration: 30,
    totalMarks: 10,
    startAt: "", // local "YYYY-MM-DDTHH:mm" from the datetime-local input
    isActive: true,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("teacherToken")) {
      navigate("/teacher-login");
      return;
    }
    if (!isEdit) return;
    api
      .get(`/exams/${examId}`)
      .then(({ data }) => {
        const exam = data.exam;
        setForm({
          title: exam.examName || "",
          subject: exam.subject || "",
          class: exam.class || "",
          section: exam.section || "",
          duration: exam.duration,
          totalMarks: exam.totalMarks,
          startAt: exam.startAt ? toLocalInput(exam.startAt) : "",
          isActive: exam.isActive !== false,
        });
      })
      .catch(() => navigate("/exam"));
  }, [examId, isEdit, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "duration" || name === "totalMarks"
            ? Number(value) || 0
            : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.subject || !form.class || !form.section) {
      setError("Title, Subject, Class and Section are required");
      return;
    }
    if (form.duration < 1 || form.totalMarks < 1) {
      setError("Duration and Total Marks must be at least 1");
      return;
    }
    if (!form.startAt) {
      setError("Set the date and time the paper starts");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // the browser's local time (the school's time zone) -> UTC for the server
      const payload = { ...form, startAt: new Date(form.startAt).toISOString() };
      if (isEdit) {
        const { title, ...rest } = payload;
        await api.put(`/exams/${examId}`, { ...rest, examName: title });
        navigate("/exam");
      } else {
        const res = await api.post("/exams", payload);
        navigate(`/add-questions/${res.data.exam._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${isEdit ? "update" : "create"} exam`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="exam1 min-h-screen p-4">
      <div className="format max-w-xl mx-auto">
        <h1 className="font-bold text-3xl mb-6">{isEdit ? "Edit Exam" : "Create Exam"}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="font-semibold block mb-1">Exam Title</label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="e.g. Mid Term Hindi"
              className="border w-full mt-1 p-2 rounded-md"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="subject" className="font-semibold block mb-1">Subject</label>
            <input
              id="subject"
              name="subject"
              type="text"
              placeholder="e.g. Hindi"
              className="border w-full mt-1 p-2 rounded-md"
              value={form.subject}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="class" className="font-semibold block mb-1">Class</label>
            <input
              id="class"
              name="class"
              type="text"
              placeholder="e.g. 10"
              className="border w-full mt-1 p-2 rounded-md"
              value={form.class}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="section" className="font-semibold block mb-1">Section</label>
            <input
              id="section"
              name="section"
              type="text"
              placeholder="e.g. A"
              className="border w-full mt-1 p-2 rounded-md"
              value={form.section}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="duration" className="font-semibold block mb-1">Duration (minutes)</label>
            <input
              id="duration"
              name="duration"
              type="number"
              min="1"
              className="border w-full mt-1 p-2 rounded-md"
              value={form.duration}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="totalMarks" className="font-semibold block mb-1">Total Marks</label>
            <input
              id="totalMarks"
              name="totalMarks"
              type="number"
              min="1"
              className="border w-full mt-1 p-2 rounded-md"
              value={form.totalMarks}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="startAt" className="font-semibold block mb-1">Paper starts</label>
            <input
              id="startAt"
              name="startAt"
              type="datetime-local"
              className="border w-full mt-1 p-2 rounded-md"
              value={form.startAt}
              onChange={handleChange}
              required
            />
            {form.startAt && form.duration > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Students can enter from {formatDateTime(form.startAt)}. Every paper ends at{" "}
                {formatDateTime(new Date(form.startAt).getTime() + form.duration * 60000)}.
              </p>
            )}
          </div>
          {isEdit && (
            <label className="flex items-center gap-2 font-semibold">
              <input
                name="isActive"
                type="checkbox"
                className="w-5 h-5 shrink-0"
                checked={form.isActive}
                onChange={handleChange}
              />
              Active (students can see and take this exam)
            </label>
          )}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={loading}
              className="!bg-green-500 !text-white hover:!bg-green-600"
            >
              {isEdit
                ? loading ? "Saving..." : "Save Changes"
                : loading ? "Creating..." : "Create & Add Questions"}
            </Button>
            <Button
              type="button"
              onClick={() => navigate("/exam")}
              className="!bg-gray-500 !text-white"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExam;
