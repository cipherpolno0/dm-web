import { join } from "node:path";

import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

import type { PassedCandidateReportRow } from "@/lib/reports/data";

const sarabunRegular = join(
  process.cwd(),
  "node_modules/@expo-google-fonts/sarabun/400Regular/Sarabun_400Regular.ttf",
);
const sarabunBold = join(
  process.cwd(),
  "node_modules/@expo-google-fonts/sarabun/700Bold/Sarabun_700Bold.ttf",
);

export async function generatePassedCandidatesExcel(rows: readonly PassedCandidateReportRow[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ระบบสอบธรรมศึกษา–นักธรรม";
  const worksheet = workbook.addWorksheet("รายชื่อผู้สอบผ่าน");
  worksheet.mergeCells("A1:G1");
  worksheet.getCell("A1").value = "รายชื่อผู้สอบผ่าน การสอบธรรมศึกษา–นักธรรม";
  worksheet.getCell("A1").font = { bold: true, size: 16 };
  worksheet.addRow([
    "ลำดับ",
    "ชื่อ–นามสกุล",
    "เลขที่นั่งสอบ",
    "ประเภท",
    "ระดับ",
    "ปีการศึกษา",
    "สำนักเรียน",
  ]);
  rows.forEach((row, index) => {
    worksheet.addRow([
      index + 1,
      row.displayName,
      row.seatNo ?? "",
      row.examType,
      row.examLevel,
      row.academicYear,
      row.organizationName ?? "",
    ]);
  });
  worksheet.getRow(2).font = { bold: true };
  worksheet.views = [{ state: "frozen", ySplit: 2 }];
  worksheet.columns = [
    { width: 10 },
    { width: 32 },
    { width: 28 },
    { width: 18 },
    { width: 18 },
    { width: 14 },
    { width: 36 },
  ];
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function generatePassedCandidatesPdf(rows: readonly PassedCandidateReportRow[]) {
  return new Promise<Buffer>((resolve, reject) => {
    const document = new PDFDocument({ size: "A4", margin: 36 });
    const chunks: Buffer[] = [];
    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);
    document.registerFont("Sarabun", sarabunRegular);
    document.registerFont("SarabunBold", sarabunBold);
    document
      .font("SarabunBold")
      .fontSize(16)
      .text("รายชื่อผู้สอบผ่าน การสอบธรรมศึกษา–นักธรรม", { align: "center" });
    document.moveDown(0.5);
    document
      .font("Sarabun")
      .fontSize(10)
      .text(`จำนวน ${rows.length.toLocaleString("th-TH")} รายการ`, { align: "right" });
    document.moveDown(0.5);
    const columns = [36, 70, 210, 350, 430, 500];
    const drawHeader = () => {
      document.font("SarabunBold").fontSize(9);
      ["ลำดับ", "ชื่อ–นามสกุล", "เลขที่นั่งสอบ", "ระดับ", "ปี", "สำนักเรียน"].forEach(
        (label, index) =>
          document.text(label, columns[index], document.y, {
            width: (columns[index + 1] ?? 559) - columns[index] - 4,
          }),
      );
      document.moveDown(1.2);
    };
    drawHeader();
    document.font("Sarabun").fontSize(8.5);
    rows.forEach((row, index) => {
      if (document.y > 780) {
        document.addPage();
        drawHeader();
        document.font("Sarabun").fontSize(8.5);
      }
      const y = document.y;
      const values = [
        String(index + 1),
        row.displayName,
        row.seatNo ?? "",
        `${row.examType} ${row.examLevel}`,
        String(row.academicYear),
        row.organizationName ?? "",
      ];
      values.forEach((value, column) =>
        document.text(value, columns[column], y, {
          width: (columns[column + 1] ?? 559) - columns[column] - 4,
        }),
      );
      document.moveDown(1.55);
    });
    document.end();
  });
}
