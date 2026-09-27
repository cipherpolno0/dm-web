"use client";

import { useDeferredValue, useMemo, useState } from "react";

import type { PublicResult } from "@/lib/public-data";
import { StatusBadge } from "@/components/ui/status-badge";

type ResultSearchProps = Readonly<{
  results: PublicResult[];
}>;

const MAX_VISIBLE_RESULTS = 100;

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("th-TH").replace(/\s+/g, " ");
}

function outcomeTone(outcome: string) {
  if (outcome.includes("ผ่าน") || outcome.includes("ได้")) {
    return "success" as const;
  }

  if (outcome.includes("รอ") || outcome.includes("กำลัง")) {
    return "pending" as const;
  }

  return "info" as const;
}

export function ResultSearch({ results }: ResultSearchProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = normalize(deferredQuery);
  const searchableResults = useMemo(
    () =>
      results.map((result) => ({
        result,
        displayName: normalize(result.displayName),
        seatNo: normalize(result.seatNo ?? ""),
      })),
    [results],
  );
  const filteredResults = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return searchableResults
      .filter(
        ({ displayName, seatNo }) =>
          displayName.includes(normalizedQuery) || seatNo.includes(normalizedQuery),
      )
      .map(({ result }) => result);
  }, [normalizedQuery, searchableResults]);
  const visibleResults = filteredResults.slice(0, MAX_VISIBLE_RESULTS);

  return (
    <section aria-labelledby="result-search-title">
      <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] md:p-6">
        <h2 className="text-xl leading-[1.5] font-semibold" id="result-search-title">
          ค้นหาผลสอบ
        </h2>
        <p className="mt-2 text-[var(--color-text-muted)]">
          กรอกเลขที่นั่งสอบ หรือชื่อ–สกุลอย่างน้อยบางส่วน ระบบจะแสดงเฉพาะผลที่เผยแพร่แล้ว
        </p>
        <div className="mt-4">
          <label className="block text-base font-semibold" htmlFor="result-query">
            เลขที่นั่งสอบ หรือชื่อ–สกุล
          </label>
          <input
            autoComplete="off"
            className="mt-2 min-h-11 w-full rounded-sm border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base text-[var(--color-text)]"
            id="result-query"
            name="query"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="เช่น 69010001 หรือ สมชาย ใจดี"
            type="search"
            value={query}
          />
        </div>
      </div>

      <div
        aria-busy={query !== deferredQuery}
        aria-live="polite"
        className="mt-6"
        id="search-results"
      >
        {!normalizedQuery ? (
          <p className="rounded-md bg-[var(--color-surface-subtle)] p-4 text-[var(--color-text-muted)]">
            เริ่มต้นด้วยการกรอกเลขที่นั่งสอบหรือชื่อ–สกุล
          </p>
        ) : filteredResults.length === 0 ? (
          <p className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-[var(--color-text-muted)]">
            ไม่พบผลสอบที่ตรงกับคำค้น กรุณาตรวจสอบการสะกดชื่อหรือเลขที่นั่งสอบอีกครั้ง
          </p>
        ) : (
          <>
            <p className="mb-3 text-sm text-[var(--color-text-muted)]">
              พบ {filteredResults.length.toLocaleString("th-TH")} รายการ
              {filteredResults.length > MAX_VISIBLE_RESULTS
                ? ` แสดง ${MAX_VISIBLE_RESULTS.toLocaleString("th-TH")} รายการแรก`
                : ""}
            </p>
            <div className="hidden overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] md:block">
              <table className="w-full border-collapse text-left">
                <thead className="bg-[var(--color-surface-subtle)] text-sm">
                  <tr>
                    <th className="p-3 font-semibold" scope="col">
                      ชื่อ–นามสกุล
                    </th>
                    <th className="p-3 font-semibold" scope="col">
                      ประเภท
                    </th>
                    <th className="p-3 font-semibold" scope="col">
                      ระดับ
                    </th>
                    <th className="p-3 font-semibold" scope="col">
                      ปีการศึกษา
                    </th>
                    <th className="p-3 font-semibold" scope="col">
                      สถานะผล
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleResults.map((result) => (
                    <tr className="border-t border-[var(--color-border)]" key={result.id}>
                      <td className="p-3 font-medium">{result.displayName}</td>
                      <td className="p-3">{result.examType}</td>
                      <td className="p-3">{result.examLevel}</td>
                      <td className="p-3">{result.academicYear}</td>
                      <td className="p-3">
                        <StatusBadge tone={outcomeTone(result.outcome)}>
                          {result.outcome}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ol className="space-y-3 md:hidden">
              {visibleResults.map((result) => (
                <li
                  className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                  key={result.id}
                >
                  <p className="font-semibold">{result.displayName}</p>
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                    <dt className="text-[var(--color-text-muted)]">ประเภท</dt>
                    <dd>{result.examType}</dd>
                    <dt className="text-[var(--color-text-muted)]">ระดับ</dt>
                    <dd>{result.examLevel}</dd>
                    <dt className="text-[var(--color-text-muted)]">ปีการศึกษา</dt>
                    <dd>{result.academicYear}</dd>
                  </dl>
                  <div className="mt-3">
                    <StatusBadge tone={outcomeTone(result.outcome)}>{result.outcome}</StatusBadge>
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </section>
  );
}
