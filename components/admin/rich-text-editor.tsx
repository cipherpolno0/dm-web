"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

type RichTextEditorProps = Readonly<{
  value: string;
  onChange: (value: string) => void;
}>;

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editorProps: {
      attributes: {
        class:
          "min-h-48 rounded-sm border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-base text-[var(--color-text)] focus:outline-none",
      },
    },
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2" aria-label="เครื่องมือแก้ไขข้อความ">
        <button
          className="min-h-11 rounded-sm border border-[var(--color-border)] px-3"
          onClick={() => editor.chain().focus().toggleBold().run()}
          type="button"
        >
          ตัวหนา
        </button>
        <button
          className="min-h-11 rounded-sm border border-[var(--color-border)] px-3"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          type="button"
        >
          ตัวเอียง
        </button>
        <button
          className="min-h-11 rounded-sm border border-[var(--color-border)] px-3"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          type="button"
        >
          รายการ
        </button>
        <button
          className="min-h-11 rounded-sm border border-[var(--color-border)] px-3"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          type="button"
        >
          หัวข้อ
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
