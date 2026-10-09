import mongoose from "mongoose";

const questionSubSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length >= 2,
        message: "At least two options are required",
      },
    },
    correctAnswer: { type: Number, required: true }, // index-based (0,1,2..)
    marks: { type: Number, default: 1 },
    image: { type: String },
    chapter: { type: String, trim: true, default: "" },
  }
  // each question has its own _id so edits/deletes and student answers can
  // refer to it even if other questions are added or removed
);

const examSchema = new mongoose.Schema(
  {
    examName: { type: String, required: true },
    class: { type: String, required: true },
    // empty/null section = exam is open to every section of the class
    section: { type: String, default: null },
    subject: { type: String },
    examDate: { type: Date, required: true },
    // Scheduled paper slot: students may enter from startAt and every paper ends
    // at startAt + duration. null = unscheduled (each attempt gets the full duration).
    startAt: { type: Date, default: null },
    duration: { type: Number, required: true }, // minutes
    totalMarks: { type: Number, required: true },

    // Inline questions
    questions: {
      type: [questionSubSchema],
      default: [],
    },

    isActive: { type: Boolean, default: true },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
  },
  { timestamps: true }
);

// Questions created before they had their own _id get one (one-time, idempotent).
examSchema.statics.backfillQuestionIds = async function () {
  const exams = await this.find({ questions: { $elemMatch: { _id: { $exists: false } } } }).lean();
  for (const exam of exams) {
    const questions = exam.questions.map((q) => (q._id ? q : { ...q, _id: new mongoose.Types.ObjectId() }));
    await this.collection.updateOne({ _id: exam._id }, { $set: { questions } });
  }
  return exams.length;
};

export default mongoose.model("Exam", examSchema);
