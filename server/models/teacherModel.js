import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const teacherSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: false, unique: false, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["teacher", "principal"], default: "teacher" },
  },
  { timestamps: true }
);

// Mongoose 9 no longer passes `next` to pre hooks; async hooks resolve/throw instead.
teacherSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

teacherSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("Teacher", teacherSchema);
