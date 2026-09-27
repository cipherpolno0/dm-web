import assert from "node:assert/strict";
import test from "node:test";

import { inspectMediaFile } from "../lib/media/inspect";

test("rejects a Windows executable renamed as PDF", async () => {
  const executableBytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
  const renamedExecutable = new File([executableBytes], "report.pdf", {
    type: "application/pdf",
  });

  await assert.rejects(
    () => inspectMediaFile(renamedExecutable),
    /รองรับเฉพาะ PDF, JPEG, PNG และ WebP/,
  );
});

test("accepts a PDF whose binary signature is actually PDF", async () => {
  const pdf = new File([new TextEncoder().encode("%PDF-1.7\n")], "guide.pdf", {
    type: "application/pdf",
  });

  const inspected = await inspectMediaFile(pdf);

  assert.equal(inspected.mimeType, "application/pdf");
  assert.equal(inspected.extension, "pdf");
  assert.equal(inspected.sha256.length, 64);
});
