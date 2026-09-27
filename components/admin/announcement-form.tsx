"use client";

import { useState } from "react";

import { RichTextEditor } from "@/components/admin/rich-text-editor";

type AnnouncementFormProps = Readonly<{
  initial?: {
    title: string;
    category: string;
    bodyHtml: string;
    status: "DRAFT" | "PUBLISHED";
    publishedAt: string;
  };
  action: (formData: FormData) => void | Promise<void>;
}>;

export function AnnouncementForm({ initial, action }: AnnouncementFormProps) {
  const [bodyHtml, setBodyHtml] = useState(initial?.bodyHtml ?? "");

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="block font-semibold" htmlFor="title">
          หัวข้อประกาศ
        </label>
        <input
          className="mt-2 min-h-11 w-full rounded-sm border border-[var(--color-border)] px-3"
          defaultValue={initial?.title}
          id="title"
          maxLength={255}
          name="title"
          required
        />
      </div>
      <div>
        <label className="block font-semibold" htmlFor="category">
          หมวดหมู่
        </label>
        <input
          className="mt-2 min-h-11 w-full rounded-sm border border-[var(--color-border)] px-3"
          defaultValue={initial?.category}
          id="category"
          maxLength={100}
          name="category"
          required
        />
      </div>
      <div>
        <p className="font-semibold">เนื้อหาประกาศ</p>
        <div className="mt-2">
          <RichTextEditor onChange={setBodyHtml} value={bodyHtml} />
        </div>
        <input name="bodyHtml" type="hidden" value={bodyHtml} />
      </div>
      <div>
        <label className="block font-semibold" htmlFor="status">
          สถานะ
        </label>
        <select
          className="mt-2 min-h-11 w-full rounded-sm border border-[var(--color-border)] px-3"
          defaultValue={initial?.status ?? "DRAFT"}
          id="status"
          name="status"
        >
          <option value="DRAFT">ฉบับร่าง</option>
          <option value="PUBLISHED">เผยแพร่</option>
        </select>
      </div>
      <div>
        <label className="block font-semibold" htmlFor="publishedAt">
          กำหนดเวลาเผยแพร่
        </label>
        <input
          className="mt-2 min-h-11 w-full rounded-sm border border-[var(--color-border)] px-3"
          defaultValue={initial?.publishedAt}
          id="publishedAt"
          name="publishedAt"
          type="datetime-local"
        />
      </div>
      <button
        className="min-h-11 rounded-md bg-[var(--color-primary)] px-4 font-semibold text-[var(--color-on-primary)]"
        type="submit"
      >
        บันทึกประกาศ
      </button>
    </form>
  );
}
