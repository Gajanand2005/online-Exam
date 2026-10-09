import mongoose from "mongoose";

const answerSubSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    questionId: { type: mongoose.Schema.Types.ObjectId },
    selectedOption: { type: Number, required: true }, // index-based
    isCorrect: { type: Boolean, default: false },
    marksObtained: { type: Number, default: 0 },
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    answers: { type: [answerSubSchema], default: [] },
    totalMarks: { type: Number, required: true, default: 0 },
    score: { type: Number, required: true, default: 0 },
    percentage: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ["submitted", "graded"], default: "submitted" },
    examSnapshot: {
      examName: String,
      subject: String,
      class: String,
      section: String,
      totalMarks: Number,
    },
    startedAt: { type: Date },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

resultSchema.index({ student: 1, exam: 1 }, { unique: true });

export default mongoose.model("Result", resultSchema);
