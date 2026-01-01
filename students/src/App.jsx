import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Lazy imports
const Navbar = lazy(() => import("./components/Navbar/Index"));
const ExamFormat = lazy(() => import("./components/ExamFormat/Index"));

const App = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<h2 style={{ textAlign: "center" }}>Loading...</h2>}>
        <Routes>
          <Route path="/" element={<Navbar />} />
          <Route path="/ExamFormat" element={<ExamFormat />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
