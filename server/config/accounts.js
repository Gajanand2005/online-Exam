import Teacher from "../models/teacherModel.js";

// Logins are fixed: they come from the environment and there is no sign-up.
// Changing a password in .env and restarting the server updates it.
const MIN_PASSWORD_LENGTH = 8;

const upsertAccount = async ({ role, match, fields, password }) => {
  const label = `${role} (${Object.values(match)[0]})`;
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`❌ ${label}: password must be at least ${MIN_PASSWORD_LENGTH} characters — account not updated`);
    return;
  }
  const account = await Teacher.findOne({ role, ...match });
  if (!account) {
    await Teacher.create({ role, ...match, ...fields, password });
    console.log(`✅ Created ${label} login`);
  } else if (!(await account.comparePassword(password))) {
    account.password = password;
    await account.save();
    console.log(`✅ Updated ${label} password`);
  }
};

export const syncFixedAccounts = async () => {
  const { TEACHER_EMAIL, TEACHER_PASSWORD, TEACHER_NAME, PRINCIPAL_USERNAME, PRINCIPAL_PASSWORD, PRINCIPAL_NAME } =
    process.env;

  if (TEACHER_EMAIL && TEACHER_PASSWORD) {
    const email = TEACHER_EMAIL.trim().toLowerCase();
    await upsertAccount({
      role: "teacher",
      match: { email },
      fields: { username: email, name: TEACHER_NAME || "Teacher" },
      password: TEACHER_PASSWORD,
    });
  } else {
    console.warn("⚠️  TEACHER_EMAIL / TEACHER_PASSWORD not set — teacher login is not configured");
  }

  if (PRINCIPAL_USERNAME && PRINCIPAL_PASSWORD) {
    await upsertAccount({
      role: "principal",
      match: { username: PRINCIPAL_USERNAME.trim() },
      fields: { name: PRINCIPAL_NAME || "Principal" },
      password: PRINCIPAL_PASSWORD,
    });
  } else {
    console.warn("⚠️  PRINCIPAL_USERNAME / PRINCIPAL_PASSWORD not set — principal login is not configured");
  }
};
