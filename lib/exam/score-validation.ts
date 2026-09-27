import { normalizeSeatNo, normalizeText } from "@/lib/exam/validation";
import type { SpreadsheetRow } from "@/lib/exam/excel";

export type ScoreImportIssueInput = Readonly<{
  rowNumber: number;
  code: string;
  message: string;
  rawRow: Record<string, string>;
}>;

export type ResolvedSeat = Readonly<{
  applicationId: string;
  examProgramId: string;
}>;

export type ValidScoreRow = Readonly<{
  rowNumber: number;
  seatNo: string;
  applicationId: string;
  score: number;
  outcome: string;
}>;

export function validateScoreRows(
  rows: readonly SpreadsheetRow[],
  targetExamProgramId: string,
  seatsByNumber: ReadonlyMap<string, ResolvedSeat>,
) {
  const issues: ScoreImportIssueInput[] = [];
  const validRows: ValidScoreRow[] = [];
  const seenSeats = new Set<string>();

  for (const row of rows) {
    const seatNo = normalizeSeatNo(row.values.seatNo);
    const rawScore = normalizeText(row.values.score);
    const outcome = normalizeText(row.values.outcome);
    let valid = true;

    if (!seatNo) {
      issues.push({
        rowNumber: row.rowNumber,
        code: "SEAT_REQUIRED",
        message: "ไม่พบเลขที่นั่งสอบ",
        rawRow: row.values,
      });
      valid = false;
    } else if (seenSeats.has(seatNo)) {
      issues.push({
        rowNumber: row.rowNumber,
        code: "DUPLICATE_SEAT",
        message: "เลขที่นั่งสอบซ้ำในไฟล์",
        rawRow: row.values,
      });
      valid = false;
    } else {
      seenSeats.add(seatNo);
    }

    const score = Number(rawScore);
    if (!rawScore || !Number.isFinite(score) || score < 0 || score > 100) {
      issues.push({
        rowNumber: row.rowNumber,
        code: "INVALID_SCORE",
        message: "คะแนนต้องเป็นตัวเลขตั้งแต่ 0 ถึง 100",
        rawRow: row.values,
      });
      valid = false;
    }

    if (!outcome || outcome.length > 100) {
      issues.push({
        rowNumber: row.rowNumber,
        code: "INVALID_OUTCOME",
        message: "ผลการสอบต้องมีความยาว 1 ถึง 100 ตัวอักษร",
        rawRow: row.values,
      });
      valid = false;
    }

    const seat = seatsByNumber.get(seatNo);
    if (seatNo && !seat) {
      issues.push({
        rowNumber: row.rowNumber,
        code: "SEAT_NOT_FOUND",
        message: "ไม่พบเลขที่นั่งสอบในระบบ",
        rawRow: row.values,
      });
      valid = false;
    } else if (seat && seat.examProgramId !== targetExamProgramId) {
      issues.push({
        rowNumber: row.rowNumber,
        code: "SEAT_PROGRAM_MISMATCH",
        message: "เลขที่นั่งสอบไม่อยู่ในหลักสูตรที่เลือก",
        rawRow: row.values,
      });
      valid = false;
    }

    if (valid && seat) {
      validRows.push({
        rowNumber: row.rowNumber,
        seatNo,
        applicationId: seat.applicationId,
        score,
        outcome,
      });
    }
  }

  return { issues, validRows };
}
