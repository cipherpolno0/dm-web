import { createHash } from "node:crypto";

import ExcelJS from "exceljs";

import { normalizeText } from "@/lib/exam/validation";

export const MAX_EXCEL_IMPORT_BYTES = 20 * 1024 * 1024;
export const EXCEL_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export class SpreadsheetFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpreadsheetFormatError";
  }
}

export type SpreadsheetRow = Readonly<{
  rowNumber: number;
  values: Record<string, string>;
}>;

export type PreparedExcelFile = Readonly<{
  bytes: Uint8Array;
  sha256: string;
  mimeType: typeof EXCEL_MIME_TYPE;
  originalName: string;
  sizeBytes: number;
}>;

function hasZipSignature(bytes: Uint8Array) {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    ((bytes[2] === 0x03 && bytes[3] === 0x04) || (bytes[2] === 0x05 && bytes[3] === 0x06))
  );
}

export async function prepareExcelFile(file: File): Promise<PreparedExcelFile> {
  if (file.size === 0 || file.size > MAX_EXCEL_IMPORT_BYTES) {
    throw new SpreadsheetFormatError("ไฟล์ Excel ต้องมีขนาดมากกว่า 0 และไม่เกิน 20 MB");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  return {
    bytes,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    mimeType: EXCEL_MIME_TYPE,
    originalName: normalizeText(file.name) || "import.xlsx",
    sizeBytes: file.size,
  };
}

export async function parseWorkbookRows(
  bytes: Uint8Array,
  columns: Readonly<Record<string, readonly string[]>>,
): Promise<SpreadsheetRow[]> {
  if (!hasZipSignature(bytes)) {
    throw new SpreadsheetFormatError("ไฟล์ต้องเป็น Excel (.xlsx) ที่มีโครงสร้างไฟล์ถูกต้อง");
  }

  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.load(Buffer.from(bytes) as never);
  } catch {
    throw new SpreadsheetFormatError("ไม่สามารถอ่านไฟล์ Excel ได้ กรุณาใช้ไฟล์ .xlsx ที่สมบูรณ์");
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new SpreadsheetFormatError("ไม่พบแผ่นงานในไฟล์ Excel");

  const headerCells = new Map<string, number>();
  worksheet.getRow(1).eachCell({ includeEmpty: false }, (cell, index) => {
    const header = normalizeText(cell.text).toLocaleLowerCase("th-TH");
    if (header) headerCells.set(header, index);
  });

  const indexes = Object.fromEntries(
    Object.entries(columns).map(([field, aliases]) => {
      const index = aliases
        .map((alias) => headerCells.get(alias.toLocaleLowerCase("th-TH")))
        .find((candidate): candidate is number => Boolean(candidate));
      if (!index) {
        throw new SpreadsheetFormatError(`ไม่พบคอลัมน์ ${aliases.join(" / ")}`);
      }
      return [field, index];
    }),
  ) as Record<string, number>;

  const rows: SpreadsheetRow[] = [];
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const values = Object.fromEntries(
      Object.entries(indexes).map(([field, index]) => [
        field,
        normalizeText(row.getCell(index).text),
      ]),
    );

    if (Object.values(values).every((value) => value === "")) continue;
    rows.push({ rowNumber, values });
  }

  if (rows.length === 0) throw new SpreadsheetFormatError("ไฟล์ Excel ไม่มีข้อมูลรายการ");
  return rows;
}
