import { NextResponse } from "next/server";
import { AuditAction } from "@prisma/client";

import { writeAuditLog } from "@/lib/audit";
import { AuthorizationError } from "@/lib/authorization/require-role";
import { getCurrentPrincipal } from "@/lib/authorization/server";
import { getPrisma } from "@/lib/db/prisma";
import { generatePassedCandidatesExcel, generatePassedCandidatesPdf } from "@/lib/reports/generate";
import { getPassedCandidateReport } from "@/lib/reports/data";

export const runtime = "nodejs";

function reportFilename(format: "xlsx" | "pdf") {
  return `passed-candidates-${new Date().toISOString().slice(0, 10)}.${format}`;
}

export async function GET(request: Request) {
  try {
    const actor = await getCurrentPrincipal();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const url = new URL(request.url);
    const format = url.searchParams.get("format") === "pdf" ? "pdf" : "xlsx";
    const organizationId = url.searchParams.get("organizationId");
    const rows = await getPassedCandidateReport(actor, organizationId);
    const data =
      format === "pdf"
        ? await generatePassedCandidatesPdf(rows)
        : await generatePassedCandidatesExcel(rows);
    await getPrisma().$transaction((transaction) =>
      writeAuditLog(transaction, {
        actorId: actor.id,
        action: AuditAction.UPDATE,
        entityType: "PassedCandidateReport",
        entityId: `${format}:${organizationId ?? "all"}`,
        afterJson: { format, organizationId, rowCount: rows.length },
      }),
    );
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type":
          format === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${reportFilename(format)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: "Forbidden" }, { status: error.status });
    }
    throw error;
  }
}
