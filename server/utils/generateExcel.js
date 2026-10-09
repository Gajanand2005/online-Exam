import ExcelJS from "exceljs";

export async function exportResultsToExcel(results) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Results", {
    columns: [
      { width: 25 },
      { width: 20 },
      { width: 10 },
      { width: 10 },
      { width: 10 },
      { width: 25 },
      { width: 15 },
      { width: 15 },
      { width: 12 },
      { width: 12 },
      { width: 8 },
    ],
  });

  sheet.addRow([
    "Student Name",
    "Father Name",
    "Class",
    "Section",
    "Roll No",
    "Exam",
    "Total Marks",
    "Obtained",
    "Percentage",
    "Submitted At",
    "Rank",
  ]);
  sheet.getRow(1).font = { bold: true };

  results.forEach((r) => {
    const student = r.student || {};
    const exam = r.exam || {};
    sheet.addRow([
      student.name || "-",
      student.fatherName || "-",
      student.class || "-",
      student.section || "-",
      student.rollNo || "-",
      exam.examName || exam.title || "-",
      r.totalMarks || "-",
      r.score || r.marksObtained || 0,
      (r.percentage || 0) + "%",
      r.submittedAt
        ? new Date(r.submittedAt).toLocaleString()
        : "-",
      r.rank ?? "-",
    ]);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}
