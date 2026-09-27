import assert from "node:assert/strict";
import test from "node:test";

import { retryDelayMinutes } from "../lib/jobs/result-notifications";
import { resolveReportScope } from "../lib/reports/authorization";

const schoolA = {
  id: "school-user-a",
  role: "school" as const,
  organizationId: "organization-a",
  examCenterId: null,
};

test("school A cannot request an export for school B", () => {
  assert.throws(
    () => resolveReportScope(schoolA, "organization-b"),
    /ไม่มีสิทธิ์ดูหรือส่งออกรายงานของสำนักเรียนอื่น/,
  );
});

test("school A report scope is always fixed to school A", () => {
  assert.deepEqual(resolveReportScope(schoolA), { organizationId: "organization-a" });
  assert.deepEqual(resolveReportScope(schoolA, "organization-a"), {
    organizationId: "organization-a",
  });
});

test("email retries use bounded exponential backoff", () => {
  assert.equal(retryDelayMinutes(1), 5);
  assert.equal(retryDelayMinutes(2), 10);
  assert.equal(retryDelayMinutes(10), 24 * 60);
});
