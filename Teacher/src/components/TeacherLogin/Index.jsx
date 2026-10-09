import Button from "@mui/material/Button";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const TeacherLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email and password required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/teacher/login", { email, password });
      if (res.data.token) {
        localStorage.setItem("teacherToken", res.data.token);
        localStorage.setItem("teacherUser", JSON.stringify(res.data.user));
        navigate("/exam");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-16 sm:mt-50 px-4 flex items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800">Teacher Login</h2>
        <p className="text-center text-gray-500 mt-1">Welcome back! Please login</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="teacher-email" className="text-sm text-gray-600">Email</label>
            <input
              id="teacher-email"
              type="email"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Enter email"
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="teacher-password" className="text-sm text-gray-600">Password</label>
            <input
              id="teacher-password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter password"
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="text-center">
            <Button
              type="submit"
              disabled={loading}
              className="!text-black !bg-zinc-300 hover:!bg-indigo-500/50 rounded-md !text-[15px]"
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherLogin;
