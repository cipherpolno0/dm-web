import assert from "node:assert/strict";
import test from "node:test";

import {
  generatePassedCandidatesExcel,
  generatePassedCandidatesPdf,
} from "../lib/reports/generate";

const rows = [
  {
    displayName: "สมชาย ใจดี",
    seatNo: "CENTER-2569-NDT-00001",
    examType: "นักธรรม",
    examLevel: "ตรี",
    academicYear: 2569,
    outcome: "ผ่าน",
    organizationName: "สำนักเรียนตัวอย่าง",
  },
];

test("generates an Excel report for passed candidates", async () => {
  const file = await generatePassedCandidatesExcel(rows);

  assert.equal(file.subarray(0, 2).toString("ascii"), "PK");
  assert.ok(file.length > 500);
});

test("generates a Thai-capable PDF report for passed candidates", async () => {
  const file = await generatePassedCandidatesPdf(rows);

  assert.equal(file.subarray(0, 4).toString("ascii"), "%PDF");
  assert.ok(file.length > 500);
});
