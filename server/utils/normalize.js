// Students type their details by hand, so the same student can arrive as
// "10th" / "Class 10" / "10", "a" / "Sec A" / "A", or "001" / "1".
// These reduce each to one form so they all reach the same record and exams.
const collapse = (value) => String(value ?? "").trim().replace(/\s+/g, " ");

export const normalizeClass = (value) =>
  collapse(value)
    .replace(/^class\s*/i, "")
    .replace(/^(\d+)\s*(st|nd|rd|th)$/i, "$1")
    .toUpperCase();

export const normalizeSection = (value) =>
  collapse(value)
    .replace(/^sec(tion)?\.?\s*/i, "")
    .toUpperCase();

export const normalizeRollNo = (value) => collapse(value).replace(/^0+(?=\d)/, "").toUpperCase();

export const cleanName = collapse;

// Names match regardless of letter case and extra spaces.
export const sameName = (a, b) => collapse(a).toLowerCase() === collapse(b).toLowerCase();
