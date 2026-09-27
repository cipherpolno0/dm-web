# Security Review — ระบบสอบธรรมศึกษา–นักธรรม

วันที่ตรวจ: 27 กันยายน 2569  
ขอบเขต: static code review ของ route, Server Action, Prisma query, input/upload/Excel และการจัดการเลขบัตรประชาชนใน working tree ปัจจุบันเท่านั้น

ข้อจำกัดของการตรวจ: ไม่ได้เชื่อม PostgreSQL, Supabase Storage, Inngest หรือ production deployment จึงไม่สรุปเรื่องค่าความลับ, HTTPS/WAF, bucket policy หรือผลการทดสอบ runtime ที่ไม่มีหลักฐานในโค้ด

## สรุป

พบความเสี่ยงยืนยันได้ 5 รายการ: สูง 2, กลาง 3, ต่ำ 0

| ระดับ | รหัส   | ประเด็น                                                                                                        |
| ----- | ------ | -------------------------------------------------------------------------------------------------------------- |
| สูง   | SEC-01 | `/results` ส่งผลสอบที่เผยแพร่ทั้งหมดลง browser และค้นหาแบบ partial client-side โดยไม่มี rate limit             |
| สูง   | SEC-02 | สิทธิ์/สถานะบัญชีใน JWT คงอยู่ได้ถึง 8 ชั่วโมง แม้ปิดบัญชีหรือเปลี่ยน role/scope แล้ว                          |
| กลาง  | SEC-03 | สำนักเรียนหนึ่งตรวจพบสถานะสมัครของบุคคลที่สมัครผ่านสำนักเรียนอื่นได้จากข้อความ validation                      |
| กลาง  | SEC-04 | การล็อกบัญชีหลังผิด 5 ครั้งไม่ครอบคลุม username ที่ไม่มีอยู่ และไม่มี rate limit ตามต้นทาง                     |
| กลาง  | SEC-05 | Excel parser ไม่มีเพดานขนาดหลังคลาย ZIP หรือจำนวน worksheet/row/cell ทำให้ผู้ใช้ที่มีสิทธิ์ทำให้ทรัพยากรหมดได้ |

## การครอบคลุม route และสิทธิ์

ไม่พบหน้าหลังบ้านหรือ Server Action ที่ลืมตรวจ role ในโค้ดที่มีอยู่

| Route/จุดทำงาน                            | หลักฐาน server-side                                                                                                                 | ผลตรวจ                                             |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `/admin`, `/admin/field`, `/admin/school` | `app/(admin)/admin/page.tsx:4`, `field/page.tsx:4`, `school/page.tsx:4`                                                             | ตรวจ role ครบ                                      |
| `/applications` และสมัคร/อนุมัติ          | `app/(admin)/applications/page.tsx:41`; actions `:19`, `:33`, `:49`; scope สนามสอบใน `lib/exam/workflow.ts:302-303`                 | ตรวจ role และ scope ก่อนอนุมัติ                    |
| `/content`, `/media` และ actions          | pages: `content/page.tsx:12`, `media/page.tsx:14`; actions: `content/actions.ts:101,139,188`, `media/actions.ts:18,75`              | จำกัด `super_admin`, `field_officer`               |
| `/master-data` และ actions                | page `master-data/page.tsx:57`; action scope สนามสอบ `master-data/actions.ts:80-85,178-181`                                         | จำกัด role และสนามสอบของเจ้าหน้าที่                |
| `/dashboard` และรายงาน                    | page `dashboard/page.tsx:8`; API ตรวจ principal `app/api/reports/passed/route.ts:19-24`; scope `lib/reports/authorization.ts:12-28` | ตรวจ role และ org/center scope                     |
| `/results-management` และ actions         | page `results-management/page.tsx:22`; actions `results-management/actions.ts:14,24,30`                                             | `super_admin` เท่านั้น                             |
| middleware                                | `middleware.ts:16-24,29-38` และ rule `lib/authorization/route-policy.ts:8-27`                                                       | ป้องกัน route ซ้ำอีกชั้น; Server Action ยังตรวจเอง |

`/api/auth/[...nextauth]` เป็น endpoint login ตามออกแบบ และ `/api/inngest` เป็น endpoint service ที่ Inngest SDK ตรวจลายเซ็นเมื่ออยู่ cloud และมี `INNGEST_SIGNING_KEY`; จึงไม่จัดเป็นช่องโหว่ role-based จาก static code นี้

## ความเสี่ยงสูง

### SEC-01 — ผลสอบที่ประกาศแล้วทั้งชุดถูกส่งให้ผู้เยี่ยมชมทุกคน

**หลักฐาน**

- `app/(public)/results/page.tsx:7-25` เรียก `getPublishedResults()` และส่ง `results` ทั้งหมดเป็น props ให้ Client Component
- `lib/public-data.ts:104-128` ใช้ `findMany()` โดยไม่มี year, exact lookup, pagination หรือ `take`; เลือกชื่อ, เลขที่นั่ง, ผลสอบ และสำนักเรียน
- `components/public/result-search.tsx:30-45` กรองข้อมูลนั้นใน browser ด้วย `name.includes()` หรือ `seatNo.includes()`; ข้อความ UI ระบุว่ายอมรับชื่อ “อย่างน้อยบางส่วน” ที่บรรทัด `53-55`

**ผลกระทบ**

ผู้ไม่ต้องล็อกอินดาวน์โหลด/อ่านผลสอบที่ประกาศแล้วทั้งหมดจาก payload ของหน้าได้ แม้ UI จะแสดงไม่เกิน 100 แถว (`components/public/result-search.tsx:12,45`) และสามารถค้นจากอักษรบางส่วนได้โดยไม่มี rate limit. ข้อมูลที่ถูกส่งรวมชื่อ–นามสกุล, เลขที่นั่งสอบ, ประเภท/ระดับ/ปี, ผลสอบ และสำนักเรียน

**ข้อเสนอแก้ไข**

ย้ายการค้นหาไปเป็น Route Handler ฝั่ง server ที่รับ `academicYear` บังคับร่วมกับเลขที่นั่งสอบแบบ exact หรือชื่อเต็มที่ normalize แล้ว; คืนเฉพาะ record ที่ match, ไม่ serialize รายการทั้งชุดไป browser. ใส่ rate limit ต่อ IP/lookup key, response limit, audit แบบไม่เก็บคำค้นดิบ และใช้ public projection/read model เท่านั้น.

### SEC-02 — การเพิกถอนสิทธิ์ไม่เกิดผลจนกว่า JWT จะหมดอายุ

**หลักฐาน**

- `auth.ts:10` กำหนด JWT session อายุ `8 * 60 * 60` วินาที
- `auth.ts:27-32` ฝัง `role`, `organizationId` และ `examCenterId` ลง token
- `lib/authorization/server.ts:9-22` สร้าง principal จาก `auth()` เพียงอย่างเดียว ไม่อ่าน `User.isActive`, `deletedAt`, role หรือ scope ปัจจุบันจากฐานข้อมูล
- `middleware.ts:9-24` ใช้ role ใน token เดิมเช่นกัน
- การตรวจ `isActive` และ `deletedAt` มีเฉพาะช่วง login ที่ `lib/auth/credentials.ts:112-146`

**ผลกระทบ**

หากบัญชี `field_officer` หรือ `school` ถูกปิด, ย้ายสนามสอบ/สำนักเรียน หรือถูกลดสิทธิ์หลัง login แล้ว session เดิมยังใช้ route และ Server Action ตาม claim เดิมได้จนหมดอายุสูงสุด 8 ชั่วโมง ซึ่งอาจเปิดให้เข้าถึงใบสมัคร, รายงาน หรือออกเลขที่นั่งสอบต่อได้

**ข้อเสนอแก้ไข**

ให้ `getCurrentPrincipal()` ตรวจ user ปัจจุบันและ membership/scope จากฐานข้อมูลก่อนอนุญาต mutation หรือใช้ `sessionVersion`/`authorizationVersion` ใน user แล้วตรวจทุกคำขอ; เมื่อเปลี่ยน role, scope หรือปิดบัญชีให้ increment version และ revoke session. คง middleware ไว้สำหรับ UX แต่ให้ server authorization เป็นจุดตัดสินสุดท้าย

## ความเสี่ยงกลาง

### SEC-03 — Validation ของใบสมัครเปิดเผยว่าบุคคลสมัครผ่านสำนักเรียนอื่นแล้ว

**หลักฐาน**

- `lib/exam/workflow.ts:138-153` ค้น applicant และ `examApplication` ที่มีอยู่โดยไม่จำกัด `organizationId`
- `lib/exam/workflow.ts:155-166` ส่งข้อความเฉพาะเจาะจงว่า `ผู้สมัครมีใบสมัครในหลักสูตรนี้แล้ว`
- ข้อความถูกโยนกลับให้บัญชีสำนักเรียนทั้งการสมัครรายคน (`:172-176`) และนำเข้า Excel (`app/(admin)/applications/actions.ts:37-43`)

**ผลกระทบ**

สำนักเรียน A ที่รู้เลขบัตรประชาชนของบุคคลหนึ่งสามารถลองยื่นในหลักสูตรเดียวกันและทราบได้ว่ามีใบสมัคร active อยู่แล้วจากสำนักเรียนใด ๆ แม้ไม่เห็นชื่อหรือสำนักเรียนเจ้าของเดิม. เป็นการเปิดเผยสถานะการสมัครข้ามขอบเขตองค์กร

**ข้อเสนอแก้ไข**

เมื่อชนกับใบสมัครขององค์กรอื่น ให้คืนข้อความกลางที่ไม่ยืนยันการมีอยู่ของผู้สมัคร/ใบสมัคร เช่น “ไม่สามารถดำเนินการใบสมัครนี้ได้ โปรดติดต่อผู้ดูแล”; แยกเหตุผลละเอียดไว้เฉพาะ audit ที่มีสิทธิ์. หากกติกาธุรกิจอนุญาต ให้ตรวจ duplicate ภายใน `organizationId` ก่อน; หากต้อง global unique ให้ใช้ข้อความกลางเสมอ

### SEC-04 — Login จำกัดความพยายามเฉพาะบัญชีที่มีอยู่

**หลักฐาน**

- `lib/auth/credentials.ts:82-90` กรณีไม่พบ username ยังทำ bcrypt และ insert `AuthAuditLog` ทุกครั้ง แต่ไม่มี counter/lockout
- `lib/auth/credentials.ts:112-138` `failedLoginAttempts` และ lock 15 นาทีถูกเพิ่มเฉพาะหลังพบ user
- ไม่พบ rate limiter ต่อ IP/username ใน route login หรือ middleware (`middleware.ts:7-38`)

**ผลกระทบ**

ผู้ไม่ยืนยันตัวตนยิง username ที่ไม่มีอยู่ได้ไม่จำกัด ทำให้เกิด bcrypt workload และ audit rows ต่อเนื่อง ซึ่งเป็นช่องทาง resource exhaustion และไม่บรรลุข้อกำหนดล็อกชั่วคราวหลังผิด 5 ครั้งอย่างครอบคลุม

**ข้อเสนอแก้ไข**

เพิ่ม distributed rate limit ก่อน bcrypt โดยใช้ hashed IP + normalized username, จำกัดทั้ง known/unknown account, ตอบข้อความเดียวกัน, และกำหนด TTL/retention สำหรับ failed-attempt audit. ไม่ใช้ IP ดิบใน key หรือ log

### SEC-05 — Excel import เสี่ยง resource exhaustion จาก ZIP/XLSX ที่ขยายตัวมาก

**หลักฐาน**

- `lib/exam/excel.ts:39-52` จำกัดเฉพาะขนาดไฟล์ที่อัปโหลด 20 MB
- `lib/exam/excel.ts:30-36,55-68` ตรวจเพียง ZIP signature แล้วส่ง bytes ทั้งก้อนไป `ExcelJS.Workbook().xlsx.load()`
- `lib/exam/excel.ts:92-104` วนทุกแถวตาม `worksheet.rowCount` โดยไม่มีเพดานจำนวนแถว/cell/worksheet หรือ uncompressed size
- School และ super admin เรียก importer ผ่าน `applications/actions.ts:32-43` และ `results-management/actions.ts:13-20`

**ผลกระทบ**

ผู้ใช้ที่มีสิทธิ์อัปโหลด XLSX/ZIP ที่บีบอัดได้สูงหรือมีจำนวนแถวมาก สามารถทำให้ process ใช้ memory/CPU สูงก่อน validation แถวและก่อน transaction ซึ่งอาจทำให้บริการหลังบ้านไม่พร้อมใช้งาน

**ข้อเสนอแก้ไข**

ตรวจ ZIP central directory ก่อน parse และจำกัด uncompressed total/ratio/entry count; กำหนด max worksheet, row และ cell count ตาม template; ปฏิเสธ workbook ที่เกินเพดานก่อน `xlsx.load()` หรือใช้ parser แบบ streaming/worker พร้อม timeout และ queue. จำกัดความถี่อัปโหลดต่อ actor ด้วย

## ความเสี่ยงต่ำ

ไม่พบรายการระดับต่ำที่ยืนยันได้จากโค้ดโดยไม่อาศัยสมมติฐานเพิ่ม

## จุดที่ตรวจแล้วและไม่จัดเป็นความเสี่ยง

- เลขบัตรประชาชนไม่ถูกเก็บเป็น plaintext ใน `Applicant`: เก็บ `nationalIdHash` และ 4 หลักท้าย (`prisma/schema.prisma:340-348`); การ hash เป็น HMAC ที่ `lib/exam/validation.ts:34-41`
- ข้อความ validation ที่ตรวจพบไม่สะท้อนเลขบัตรเต็ม; audit calls ปัจจุบันบันทึก identifier, status, seat number, metadata การ import และไม่ส่งเลขบัตรเต็มเข้า `writeAuditLog()`
- คะแนนดิบไม่ถูก query ในหน้าสาธารณะ: public query ต้องผ่าน `isPublished`, `publishedAt`, `PUBLISHED` และ `isActive` (`lib/public-data.ts:107-115`)
- CRUD และรายงานใช้ Prisma query API; ไม่พบ raw SQL, `eval`, หรือ `dangerouslySetInnerHTML` ใน app/lib
- CMS sanitize allowlist และลิงก์ `http/https/mailto` (`app/(admin)/content/actions.ts:26-50`)
- Media ตรวจ magic bytes, allowlist MIME และ 20 MB ก่อน upload (`lib/media/inspect.ts:23-46`); Excel ที่ไม่ใช่ XLSX ถูก parse/reject และ import คะแนนเป็น all-or-nothing เมื่อมี issue
- Report route ตรวจ principal และ scope ซ้ำใน service (`app/api/reports/passed/route.ts:19-24`, `lib/reports/authorization.ts:12-28`) พร้อม `Cache-Control: private, no-store` ที่ `route.ts:45`

## Prompts สำหรับส่งให้ Codex แก้ไข

### SEC-01

```text
แก้ SEC-01 ในระบบ Next.js App Router นี้: ห้ามส่งผลสอบที่เผยแพร่ทั้งหมดไปยัง browser อีกต่อไป. แทน getPublishedResults/ResultSearch แบบ client filter ด้วย Route Handler ฝั่ง server ที่บังคับ academicYear และรับเลขที่นั่งแบบ exact หรือชื่อเต็มที่ normalize; query เฉพาะ result_public_projection ที่ is_active + publication.is_published/published/status ถูกต้อง, return allowlisted fields เฉพาะที่ match, จำกัดผลลัพธ์. เพิ่ม rate limit ต่อ hashed IP + lookup key, 429 ที่ปลอดภัย, และ test ว่า payload ของ /results ไม่มีรายการทั้งหมด/ค้นหาชื่อบางส่วนไม่ได้. รักษา public result gate เดิม และรัน type-check, lint, test, build.
```

### SEC-02

```text
แก้ SEC-02: ทำให้การปิด user หรือแก้ role/organizationId/examCenterId มีผลทันทีต่อทุก protected route และ Server Action. ปรับ getCurrentPrincipal ให้ตรวจสถานะ user และ scope ปัจจุบันแบบ server-side (หรือใช้ sessionVersion ที่ตรวจทุก request); deny หาก isActive=false/deletedAt ไม่ว่างหรือ claim ไม่ตรง. Middleware ใช้เพื่อ redirect/UX ได้ แต่ห้ามเป็น authorization จุดเดียว. เพิ่ม unit/integration tests สำหรับ user ถูกปิดหรือเปลี่ยน scope หลังได้ JWT แล้ว และรัน type-check, lint, test, build.
```

### SEC-03

```text
แก้ SEC-03: ใน validation ใบสมัคร ห้ามบัญชี school ทราบว่าผู้สมัครมีใบสมัครอยู่กับองค์กรอื่น. คง global uniqueness ตาม business rule ได้ แต่เมื่อ duplicate ข้าม organization ให้ตอบข้อความกลางที่ไม่ยืนยันการมีอยู่ของ applicant/application และเก็บเหตุผลละเอียดเฉพาะ audit ที่ super_admin อ่านได้. เพิ่ม test school A ใช้เลขบัตรของ applicant school B แล้วไม่ได้รับ existence disclosure; รัน type-check, lint, test, build.
```

### SEC-04

```text
แก้ SEC-04: เพิ่ม distributed login rate limit ก่อน bcrypt ครอบคลุมทั้ง username ที่มีและไม่มีอยู่ โดยใช้ normalized username และ IP ที่ hash ด้วย secret; กำหนด 5 attempts/15 นาที หรือ policy ที่เทียบเท่า, คืนข้อความเดียวกัน, ไม่ log IP ดิบ, และกำหนด TTL/retention ของ attempt counter. เพิ่ม tests สำหรับ unknown username, known username และ IP เดียวกันที่ยิงหลายชื่อ; รัน type-check, lint, test, build.
```

### SEC-05

```text
แก้ SEC-05: harden Excel import โดยจำกัด ZIP uncompressed total size, compression ratio, entry count, worksheet count, row count และ cell count ก่อน/ระหว่าง parse; ปฏิเสธเกินเพดานด้วย SpreadsheetFormatError โดยไม่เขียน DB/Storage transaction. ใช้ worker/queue หรือ parser streaming หากเหมาะสม และเพิ่ม tests สำหรับ workbook/ZIP ที่เกิน row limit และ compressed payload ที่เกิน expansion limit. คง 20 MB upload cap และ all-or-nothing score import; รัน type-check, lint, test, build.
```
