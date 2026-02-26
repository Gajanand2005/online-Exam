import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// 🔥 Lazy Imports (Code Splitting)
const Navbar = lazy(() => import("./components/Navbar/Index"));
const TeacherLogin = lazy(() => import("./components/TeacherLogin/Index"));
const Exam = lazy(() => import("./components/Exam"));
const AddExam = lazy(() => import("./components/MakeExam/AddExam"));
const MakeExam = lazy(() => import("./components/MakeExam/Index"));
const ViewExam = lazy(() => import("./components/View Exam/Index"));
const ViewExam1 = lazy(() => import("./components/View Exam/ViewExam1"));
const Result = lazy(() => import("./components/Result"));
const ShowResult = lazy(() => import("./components/Result/ShowResult"));
const Login = lazy(() => import("./components/PrincipalLogin/Index"));
const AllResult = lazy(() => import("./components/SeeAllResult"));
const SeeResult = lazy(() => import("./components/SeeAllResult/SeeResult"));
const SeeEXam = lazy(() => import("./components/SeeAllResult/SeeEXam"));
const AddQuestions = lazy(() => import("./components/AddQuestions/Index"));

const App = () => {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <h2 style={{ textAlign: "center", marginTop: "20px" }}>
            Loading...
          </h2>
        }
      >
        <Routes>
          <Route path="/" element={<Navbar />} />
          <Route path="/teacher" element={<Navbar />} />
          <Route path="/teacher-login" element={<TeacherLogin />} />
          <Route path="/principal-login" element={<Login />} />
          <Route path="/exam" element={<Exam />} />
          <Route path="/add-exam" element={<AddExam />} />
          <Route path="/add-questions/:examId" element={<AddQuestions />} />
          <Route path="/make-exam" element={<MakeExam />} />
          <Route path="/view-exam" element={<ViewExam />} />
          <Route path="/view" element={<ViewExam1 />} />
          <Route path="/show" element={<Result />} />
          <Route path="/show-result" element={<ShowResult />} />
          <Route path="/show-result/:examId" element={<ShowResult />} />
          <Route path="/see-all-result" element={<AllResult />} />
          <Route path="/see-result" element={<SeeResult />} />
          <Route path="/see-exam" element={<SeeEXam />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
