import Teacher from "../models/teacherModel.js";

const required = (key) => {
  const value = process.env[key]?.trim();
  if (!value) throw new Error(`${key} must be set to sync fixed accounts`);
  return value;
};

const upsertAccount = async ({ role, username, name, email, password }) => {
  const account = await Teacher.findOne({ role });
  const target = account || new Teacher({ role });

  target.username = username;
  target.name = name;
  target.email = email;
  target.password = password;
  await target.save();
};

export const syncFixedAccounts = async () => {
  const teacherEmail = required("TEACHER_EMAIL").toLowerCase();
  const teacherPassword = required("TEACHER_PASSWORD");
  const principalUsername = required("PRINCIPAL_USERNAME");
  const principalPassword = required("PRINCIPAL_PASSWORD");

  if (teacherPassword.length < 8 || principalPassword.length < 8) {
    throw new Error("Fixed account passwords must be at least 8 characters");
  }

  await upsertAccount({
    role: "teacher",
    username: teacherEmail,
    name: process.env.TEACHER_NAME?.trim() || "Teacher",
    email: teacherEmail,
    password: teacherPassword,
  });

  await upsertAccount({
    role: "principal",
    username: principalUsername,
    name: process.env.PRINCIPAL_NAME?.trim() || "Principal",
    email: undefined,
    password: principalPassword,
  });
};