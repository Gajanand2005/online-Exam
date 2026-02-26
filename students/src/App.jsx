import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

const Navbar = lazy(() => import("./components/Navbar/Index"));
const Dashboard = lazy(() => import("./components/Dashboard/Index"));
const ExamFormat = lazy(() => import("./components/ExamFormat/Index"));
const Results = lazy(() => import("./components/Results/Index"));

const App = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<h2 style={{ textAlign: "center" }}>Loading...</h2>}>
        <Routes>
          <Route path="/" element={<Navbar />} />
          {/* direct student entry should show login page */}
          <Route path="/student" element={<Navigate to="/" replace />} />
          {/* redirect any deeper student path back to root so the login renders */}
          <Route path="/student/*" element={<Navigate to="/" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/exam/:examId" element={<ExamFormat />} />
          <Route path="/results" element={<Results />} />
          <Route path="/ExamFormat" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
