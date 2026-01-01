import React from "react";
import { Button } from "@mui/material";
import { IoMdAdd } from "react-icons/io";
import { Link } from "react-router-dom";

const AddExam = () => {
  return (
    <>
      <div className="exam1 min-h-screen ">
        <div className="format max-w-7xl mx-auto px-5">

          {/* ===== Header ===== */}
          <div className="flex items-center justify-between mt-6">
            <h1 className="font-bold text-3xl">
              Make Exam
            </h1>

            <Button
              variant="contained"
              startIcon={<IoMdAdd />}
              className="!bg-blue-500 hover:!bg-blue-600"
            >
              Add Question
            </Button>
          </div>

          <div className="w-full border mt-4"></div>

          {/* ===== Exam Cards ===== */}
          <div className="exam-card flex gap-6 flex-wrap mt-6">

            {/* Card 1 */}
            <div className="w-[280px] p-5 border rounded-lg shadow-sm">
              <div className="mb-3">
                <label className="font-semibold">Exam Name :Hindi</label>
                <input
                  type="text"
                  placeholder="Enter subject"
                  className="border mt-1 p-2 rounded-md w-full"
                />
              </div>

               <div className="mb-3">
                <label className="font-semibold">class :12</label>
                <input
                  type="text"
                  placeholder="Enter subject"
                  className="border mt-1 p-2 rounded-md w-full"
                />
              </div>
               <div className="mb-3">
                <label className="font-semibold">marks :120</label>
                <input
                  type="text"
                  placeholder="Enter subject"
                  className="border mt-1 p-2 rounded-md w-full"
                />
              </div>
               <div className="mb-3">
                <label className="font-semibold">Date : 12/23/2025</label>
                <input
                  type="text"
                  placeholder="Enter subject"
                  className="border mt-1 p-2 rounded-md w-full"
                />
              </div>
            
                <Button
                  fullWidth
                  variant="outlined"
                  className="!mt-4 !bg-green-500 !text-white hover:!bg-green-600"
                >
                 Submit
                </Button>
             

              
            </div>

            {/* Card 2 (Empty / Add New) */}
           <div className="w-[280px] p-5 border rounded-lg shadow-sm">
              <div className="mb-3">
                <label className="font-semibold">Exam Name :Hindi</label>
               
              </div>

               <div className="mb-3">
                <label className="font-semibold">class :12</label>
               
              </div>
               <div className="mb-3">
                <label className="font-semibold">marks :120</label>
               
              </div>
               <div className="mb-3">
                <label className="font-semibold">Date : 12/23/2025</label>
                
              </div>
              <Link to="/make-exam">
                <Button
                  fullWidth
                  variant="outlined"
                  className="!mt-4 !bg-blue-500 !text-white !px-4 !py-2 !rounded-md hover:!bg-blue-600 !mt-5"
                >
                  Add
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddExam;
