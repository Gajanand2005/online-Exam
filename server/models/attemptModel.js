import mongoose from "mongoose";

// An exam in progress. Created when the student starts, autosaved while they
// answer, and replaced by a Result on submit or once time runs out.
const attemptSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    startedAt: { type: Date, default: Date.now },
    answers: {
      type: [
        {
          questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
          selectedOption: { type: Number, required: true },
          _id: false,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

attemptSchema.index({ student: 1, exam: 1 }, { unique: true });

export default mongoose.model("Attempt", attemptSchema);
