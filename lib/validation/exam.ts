import { z } from "zod";

const code = z.string().trim().min(2, "กรุณาระบุรหัส").max(80, "รหัสยาวเกินไป");

export const applicationInputSchema = z.object({
  nationalId: z.string().trim().min(1, "กรุณาระบุเลขบัตรประชาชน"),
  firstName: z.string().trim().min(1, "กรุณาระบุชื่อ").max(150),
  lastName: z.string().trim().min(1, "กรุณาระบุนามสกุล").max(150),
  schoolCode: code,
  examCenterCode: code,
  examProgramCode: code,
});

export const examProgramIdSchema = z.string().uuid("ไม่พบรหัสหลักสูตรสอบที่ถูกต้อง");
export const applicationIdSchema = z.string().uuid("ไม่พบรหัสใบสมัครที่ถูกต้อง");
export const scoreImportBatchIdSchema = z.string().uuid("ไม่พบรหัสชุดนำเข้าคะแนนที่ถูกต้อง");
