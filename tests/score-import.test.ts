import assert from "node:assert/strict";
import test from "node:test";

import ExcelJS from "exceljs";

import { parseWorkbookRows, SpreadsheetFormatError } from "../lib/exam/excel";
import { validateScoreRows } from "../lib/exam/score-validation";

const columns = {
  seatNo: ["seatNo", "เลขที่นั่งสอบ"],
  score: ["score", "คะแนน"],
  outcome: ["outcome", "ผลการสอบ"],
} as const;

test("detects duplicate seat numbers and does not produce a second valid score row", () => {
  const result = validateScoreRows(
    [
      { rowNumber: 2, values: { seatNo: "C-2569-NDT-00001", score: "82", outcome: "ผ่าน" } },
      { rowNumber: 3, values: { seatNo: "C-2569-NDT-00001", score: "77", outcome: "ผ่าน" } },
    ],
    "program-a",
    new Map([["C-2569-NDT-00001", { applicationId: "application-a", examProgramId: "program-a" }]]),
  );

  assert.equal(result.issues.length, 1);
  assert.equal(result.issues[0]?.code, "DUPLICATE_SEAT");
  assert.deepEqual(result.validRows, [
    {
      rowNumber: 2,
      seatNo: "C-2569-NDT-00001",
      applicationId: "application-a",
      score: 82,
      outcome: "ผ่าน",
    },
  ]);
});

test("a mixed score file reports the bad row and blocks the all-or-nothing commit without altering valid rows", () => {
  const existingScore = { applicationId: "application-a", score: 60, outcome: "ผ่าน" };
  const result = validateScoreRows(
    [
      { rowNumber: 2, values: { seatNo: "C-2569-NDT-00001", score: "85", outcome: "ผ่าน" } },
      { rowNumber: 3, values: { seatNo: "UNKNOWN", score: "70", outcome: "ผ่าน" } },
    ],
    "program-a",
    new Map([["C-2569-NDT-00001", { applicationId: "application-a", examProgramId: "program-a" }]]),
  );

  const commitAllowed = result.issues.length === 0;

  assert.equal(commitAllowed, false);
  assert.equal(result.issues[0]?.rowNumber, 3);
  assert.equal(result.issues[0]?.code, "SEAT_NOT_FOUND");
  assert.equal(result.validRows[0]?.applicationId, "application-a");
  assert.deepEqual(existingScore, { applicationId: "application-a", score: 60, outcome: "ผ่าน" });
});

test("rejects a score workbook whose header layout is wrong", async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("คะแนน");
  worksheet.addRow(["wrong", "columns"]);
  worksheet.addRow(["x", "y"]);
  const bytes = new Uint8Array(await workbook.xlsx.writeBuffer());

  await assert.rejects(() => parseWorkbookRows(bytes, columns), SpreadsheetFormatError);
});

test("rejects a non-Excel score file even when it uses an .xlsx upload path", async () => {
  await assert.rejects(
    () => parseWorkbookRows(new Uint8Array([0x4d, 0x5a, 0x90, 0x00]), columns),
    SpreadsheetFormatError,
  );
});
