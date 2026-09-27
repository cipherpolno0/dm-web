import { z } from "zod";

const codeSchema = z
  .string()
  .trim()
  .min(2, "รหัสต้องมีอย่างน้อย 2 ตัวอักษร")
  .max(30, "รหัสยาวเกิน 30 ตัวอักษร")
  .regex(/^[A-Za-z0-9_-]+$/, "รหัสใช้ได้เฉพาะ A-Z, 0-9, _ และ -");

const nameSchema = z.string().trim().min(2, "กรุณาระบุชื่อ").max(255, "ชื่อยาวเกินไป");

export const announcementInputSchema = z.object({
  title: z.string().trim().min(5, "หัวข้อข่าวต้องมีอย่างน้อย 5 ตัวอักษร").max(255),
  category: z.string().trim().min(2, "กรุณาระบุหมวดหมู่").max(100),
  bodyHtml: z.string().trim().min(1, "กรุณาระบุเนื้อหาประกาศ").max(100_000),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  publishedAt: z.string().trim().max(40).optional(),
});

export const mediaInputSchema = z.object({
  category: z.enum(["FORM", "EXAM", "GUIDE"]),
});

export const organizationInputSchema = z.object({
  id: z.string().uuid().optional(),
  code: codeSchema,
  nameTh: nameSchema,
  notificationEmail: z
    .string()
    .trim()
    .email("อีเมลสำหรับแจ้งผลไม่ถูกต้อง")
    .max(320)
    .optional()
    .or(z.literal("")),
});

export const examCenterInputSchema = z.object({
  id: z.string().uuid().optional(),
  code: codeSchema,
  nameTh: nameSchema,
});

export const examLevelInputSchema = z.object({
  id: z.string().uuid().optional(),
  code: codeSchema,
  nameTh: nameSchema,
});

export const academicYearInputSchema = z.object({
  id: z.string().uuid().optional(),
  yearBe: z.coerce.number().int().min(2400, "ปีการศึกษาไม่ถูกต้อง").max(2700),
  label: nameSchema.max(100),
});

export function optionalId(formData: FormData) {
  const id = formData.get("id");

  return typeof id === "string" && id ? id : undefined;
}
