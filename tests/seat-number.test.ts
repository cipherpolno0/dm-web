import assert from "node:assert/strict";
import test from "node:test";

import { formatSeatNumber } from "../lib/exam/seat-number";

test("issues canonical non-duplicate seat numbers for successive sequences in one center/program", () => {
  const base = { centerCode: "CN-01", academicYearBe: 2569, programCode: "NDT-TRI" };
  const first = formatSeatNumber({ ...base, sequenceNo: 1 });
  const second = formatSeatNumber({ ...base, sequenceNo: 2 });

  assert.equal(first, "CN-01-2569-NDT-TRI-00001");
  assert.equal(second, "CN-01-2569-NDT-TRI-00002");
  assert.notEqual(first, second);
});

test("rejects zero, negative, and fractional sequence values before an assignment is created", () => {
  const base = { centerCode: "CN-01", academicYearBe: 2569, programCode: "NDT-TRI" };

  for (const sequenceNo of [0, -1, 1.5]) {
    assert.throws(() => formatSeatNumber({ ...base, sequenceNo }));
  }
});
