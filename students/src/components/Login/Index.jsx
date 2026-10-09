import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

// Order matters: name/father name identify the student; class+section+roll find the record.
const FIELDS = [
  { name: "name", label: "Your name", placeholder: "Name" },
  { name: "fatherName", label: "Father's name", placeholder: "Father Name" },
  { name: "class", label: "Class", placeholder: "Class", hint: "e.g. 10" },
  { name: "section", label: "Section", placeholder: "Section", hint: "e.g. A" },
  { name: "rollNo", label: "Roll No", placeholder: "Roll No" },
];

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    fatherName: "",
    rollNo: "",
    class: "",
    section: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInput = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.fatherName || !form.rollNo || !form.class || !form.section) {
      setError("Name, Father Name, Roll No, Class and Section are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/student/login", {
        name: form.name,
        fatherName: form.fatherName,
        rollNo: form.rollNo,
        class: form.class,
        section: form.section,
      });
      if (res.data.token) {
        localStorage.setItem("studentToken", res.data.token);
        localStorage.setItem("studentUser", JSON.stringify(res.data.user));
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-10 flex items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8">
        <h2 className="text-2xl font-bold text-center">Student Login</h2>
        <p className="text-center text-sm text-gray-500 mt-1">No password needed — use your details as in school records</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {FIELDS.map(({ name, label, placeholder, hint, inputMode }) => (
            <div key={name}>
              <label htmlFor={`student-${name}`} className="text-sm text-gray-700 font-medium">
                {label}
              </label>
              <input
                id={`student-${name}`}
                name={name}
                placeholder={placeholder}
                inputMode={inputMode}
                autoComplete="off"
                aria-describedby={hint ? `student-${name}-hint` : undefined}
                className="w-full mt-1 px-4 py-2 border rounded-lg"
                value={form[name]}
                onChange={handleInput}
                required
              />
              {hint && (
                <p id={`student-${name}-hint`} className="text-xs text-gray-500 mt-1">
                  {hint}
                </p>
              )}
            </div>
          ))}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold mt-2 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">© New Era School</p>
      </div>
    </div>
  );
};

export default Login;
