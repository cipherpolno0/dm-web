# Design System — ระบบสอบธรรมศึกษา–นักธรรม

| หลักออกแบบ        | ความหมายในการใช้งาน                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| น่าเชื่อถือและสงบ | ใช้เขียวเข้มเป็นสีแกน, พื้นอ่อน, เส้นขอบบาง, ไม่ใช้ gradient หรือสีจัดเป็นพื้นใหญ่                   |
| ภาษาไทยอ่านก่อน   | เนื้อหาปกติ 16px, line-height กว้าง, ข้อความสำคัญสั้นและใช้คำตรงไปตรงมา                              |
| ทางการแต่ไม่แข็ง  | ลำดับชั้นตัวอักษรชัด, card และตารางเรียบ, ใช้สีเฉพาะเพื่อสื่อสถานะ ไม่ตกแต่งเกินจำเป็น               |
| เข้าถึงได้        | WCAG AA, focus มองเห็นชัด, ไม่ใช้สีเป็นตัวบอกสถานะเพียงอย่างเดียว, แตะบนมือถือได้ไม่น้อยกว่า 44×44px |

## 1. Design tokens

### 1.1 สี

ใช้ชื่อ semantic token ใน component เสมอ ไม่อ้าง hex โดยตรงใน component. สี `primary` เป็นสีเขียวที่สื่อความน่าเชื่อถือและสอดคล้องกับบริบทสถาบันการศึกษา; สีทองใช้เป็นรองเพื่อเน้น ไม่ใช่สีข้อความเนื้อหายาว.

| Token                    | Hex (light) | Hex (dark) | ใช้สำหรับ                                                            |
| ------------------------ | ----------: | ---------: | -------------------------------------------------------------------- |
| `--color-canvas`         |   `#F7F9F8` |  `#121A18` | พื้นหลังหลัก                                                         |
| `--color-surface`        |   `#FFFFFF` |  `#1C2925` | card, form, dialog, table surface                                    |
| `--color-surface-subtle` |   `#EDF3F0` |  `#24332E` | แถวตารางสลับ, panel รอง, hover อ่อน                                  |
| `--color-text`           |   `#17221F` |  `#F5F8F6` | ข้อความหลัก                                                          |
| `--color-text-muted`     |   `#4E5D56` |  `#C4D0CA` | metadata, คำอธิบาย; ห้ามใช้กับข้อความสำคัญขนาดเล็กหาก contrast ไม่พอ |
| `--color-border`         |   `#D6E0DC` |  `#40514A` | เส้นแบ่งและขอบ input                                                 |
| `--color-primary`        |   `#0F4C3A` |  `#78C6AB` | ปุ่มหลัก, link สำคัญ, active navigation                              |
| `--color-on-primary`     |   `#FFFFFF` |  `#102019` | ตัวอักษรบน primary background                                        |
| `--color-secondary`      |   `#8A5A16` |  `#F2C66D` | emphasis รอง, icon หรือ label; ใช้อย่างประหยัด                       |
| `--color-link`           |   `#0B5E55` |  `#8DDCC1` | ลิงก์ข้อความ; ต้องมี underline เมื่อ hover/focus                     |
| `--color-focus`          |   `#1D4ED8` |  `#93C5FD` | focus ring เท่านั้น                                                  |
| `--color-success`        |   `#166534` |  `#86EFAC` | สำเร็จ/สอบได้                                                        |
| `--color-success-bg`     |   `#DCFCE7` |  `#173625` | badge/notice สำเร็จ                                                  |
| `--color-pending`        |   `#8A4B0F` |  `#FCD34D` | รอดำเนินการ/ต้องตรวจ                                                 |
| `--color-pending-bg`     |   `#FEF3C7` |  `#3B2C12` | badge/notice รอดำเนินการ                                             |
| `--color-error`          |   `#B42318` |  `#FDA4AF` | ผิดพลาด/ไม่ผ่าน/อันตราย                                              |
| `--color-error-bg`       |   `#FEE4E2` |  `#3A1D20` | error banner, field error, destructive dialog                        |
| `--color-info`           |   `#1D4ED8` |  `#93C5FD` | ข้อมูลทั่วไป/ประกาศ                                                  |
| `--color-info-bg`        |   `#DBEAFE` |  `#182B4A` | info banner                                                          |

ตัวอย่าง CSS token:

```css
:root {
  --color-canvas: #f7f9f8;
  --color-surface: #ffffff;
  --color-text: #17221f;
  --color-primary: #0f4c3a;
  --color-on-primary: #ffffff;
  --color-focus: #1d4ed8;
  --space-4: 1rem;
  --radius-md: 0.5rem;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-canvas: #121a18;
    --color-surface: #1c2925;
    --color-text: #f5f8f6;
    --color-primary: #78c6ab;
    --color-on-primary: #102019;
    --color-focus: #93c5fd;
  }
}
```

### 1.2 Contrast ที่ตรวจแล้ว

อัตราส่วนต่อไปนี้คำนวณด้วย WCAG relative luminance; เกณฑ์ AA คือ **4.5:1** สำหรับข้อความปกติ และ **3:1** สำหรับข้อความขนาดใหญ่/องค์ประกอบ UI.

| คู่สี                                    | Contrast | ผล          |
| ---------------------------------------- | -------: | ----------- |
| `#FFFFFF` บน `#0F4C3A` (ข้อความปุ่มหลัก) |   9.93:1 | ผ่าน AA/AAA |
| `#FFFFFF` บน `#8A5A16` (ข้อความปุ่มรอง)  |   5.91:1 | ผ่าน AA     |
| `#FFFFFF` บน `#166534` (success solid)   |   7.13:1 | ผ่าน AA/AAA |
| `#FFFFFF` บน `#8A4B0F` (pending solid)   |   6.79:1 | ผ่าน AA/AAA |
| `#FFFFFF` บน `#B42318` (error solid)     |   6.57:1 | ผ่าน AA/AAA |
| `#166534` บน `#DCFCE7` (success badge)   |   6.49:1 | ผ่าน AA/AAA |
| `#8A4B0F` บน `#FEF3C7` (pending badge)   |   6.10:1 | ผ่าน AA/AAA |
| `#B42318` บน `#FEE4E2` (error badge)     |   5.45:1 | ผ่าน AA     |
| `#17221F` บน `#F7F9F8` (body)            |  15.46:1 | ผ่าน AA/AAA |
| `#F5F8F6` บน `#121A18` (dark body)       |  16.55:1 | ผ่าน AA/AAA |
| `#93C5FD` บน `#121A18` (dark focus ring) |   9.81:1 | ผ่าน AA/AAA |

### 1.3 ระยะห่างและรูปทรง

Base unit คือ 4px. ใช้เฉพาะ token เพื่อรักษาจังหวะการอ่านให้สม่ำเสมอ.

| Token         |                            ค่า | ใช้สำหรับ                             |
| ------------- | -----------------------------: | ------------------------------------- |
| `--space-1`   |                            4px | ระยะ icon กับ label, รายละเอียดสั้น   |
| `--space-2`   |                            8px | ช่องว่างใน badge, label กับ help text |
| `--space-3`   |                           12px | gap ของ field ที่อยู่ใกล้กัน          |
| `--space-4`   |                           16px | padding card mobile, gap ปกติ         |
| `--space-5`   |                           24px | card desktop, section ย่อย            |
| `--space-6`   |                           32px | ช่องว่างระหว่าง section               |
| `--space-7`   |                           40px | section ใหญ่บน desktop                |
| `--space-8`   |                           48px | hero/heading block                    |
| `--space-9`   |                           64px | ระยะใหญ่ระหว่างกลุ่มเนื้อหาหลัก       |
| `--radius-sm` |                            4px | input, badge ขนาดเล็ก                 |
| `--radius-md` |                            8px | card, dialog, button                  |
| `--radius-lg` |                           12px | feature panel ขนาดใหญ่เท่าที่จำเป็น   |
| `--shadow-sm` | `0 1px 2px rgba(23,34,31,.08)` | card ยกตัวเล็กน้อย; ไม่ใช้เงาหนัก     |

### 1.4 Typography ภาษาไทย

| บทบาท       | Font stack ที่แนะนำ                               | ขนาด / line-height               | น้ำหนัก | ใช้สำหรับ                             |
| ----------- | ------------------------------------------------- | -------------------------------- | ------: | ------------------------------------- |
| UI และ body | `"Noto Sans Thai", "Sarabun", Tahoma, sans-serif` | 16px / 1.75                      |     400 | เนื้อหา ฟอร์ม ตาราง และข้อความอ่านยาว |
| UI emphasis | stack เดียวกัน                                    | ตามระดับ                         | 500–600 | ป้าย field, navigation, table header  |
| H1          | stack เดียวกัน                                    | 36px / 1.30 desktop, 30px mobile |     700 | ชื่อหน้าหลัก/ประกาศสำคัญ              |
| H2          | stack เดียวกัน                                    | 30px / 1.35 desktop, 24px mobile |     700 | หัวข้อ section                        |
| H3          | stack เดียวกัน                                    | 24px / 1.45                      |     600 | หัวข้อ card/กลุ่มข้อมูล               |
| H4          | stack เดียวกัน                                    | 20px / 1.50                      |     600 | หัวข้อย่อย                            |
| Body large  | stack เดียวกัน                                    | 18px / 1.70                      |     400 | lead หรือคำแนะนำสำคัญ                 |
| Body        | stack เดียวกัน                                    | 16px / 1.75                      |     400 | ค่าเริ่มต้น ห้ามลดในเนื้อหาหลัก       |
| Small       | stack เดียวกัน                                    | 14px / 1.60                      | 400–500 | metadata, help text, ตาราง dense      |
| Caption     | stack เดียวกัน                                    | 12px / 1.50                      | 400–500 | คำอธิบายรองที่ไม่ใช่ข้อมูลจำเป็น      |

กติกา: เนื้อหาไทยไม่จัดชิดขอบ, ไม่ใช้ตัวพิมพ์ใหญ่แทน emphasis, จำกัดความยาวบรรทัดเนื้อหาไว้ราว 45–75 ตัวอักษรไทย, และใช้ตัวเลขอารบิกใน UI/data table ให้สม่ำเสมอ. หากต้องใช้เลขไทย ให้เป็นเนื้อหาที่ออกแบบไว้โดยเฉพาะ ไม่ปะปนใน field เดียวกัน.

## 2. คอมโพเนนต์ที่ใช้ร่วมกัน

### 2.1 Navbar

| Variant       | โครงสร้าง                                                                | พฤติกรรม/ข้อกำหนด                                                                                                         |
| ------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Public navbar | ตราหน่วยงาน/ชื่อระบบ, เมนูหลัก, ปุ่ม “ค้นหาผลสอบ”, เข้าสู่ระบบ           | สูง 64px; sticky เฉพาะเมื่อเลื่อนผ่าน hero; mobile ใช้เมนูพับและคงปุ่มค้นหาผลสอบ; active item มีทั้งสีและเส้นใต้          |
| Admin navbar  | logo ย่อ, ชื่อปีการศึกษาที่กำลังทำงาน, profile menu/ออกจากระบบ           | สูง 56–64px; แสดง environment ชัดใน staging; logout อยู่ในเมนูบัญชี ไม่วางใกล้ save button                                |
| Admin sidebar | กลุ่มเมนู: Dashboard, รับสมัคร, สนามสอบ, ผลสอบ, เนื้อหา, รายงาน, ตั้งค่า | desktop กว้าง 264px; mobile เป็น drawer; menu group พับได้; ห้ามแสดงเมนูที่ไม่มีสิทธิ์แทนการใช้ authorization ฝั่ง server |

### 2.2 Card ข่าว/ประกาศ

| ส่วนประกอบ | กติกา                                                                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Header     | category badge + วันที่เผยแพร่; ใช้ `small` และไม่แข่งกับชื่อเรื่อง                                                                      |
| Title      | `H3`, ไม่เกิน 3 บรรทัดบนรายการ; link ครอบเฉพาะ title หรือมีปุ่ม “อ่านรายละเอียด” ที่ระบุชื่อข่าวได้                                      |
| Summary    | 2–3 บรรทัด, ตัดด้วย line clamp ได้เฉพาะ list view; หน้ารายละเอียดต้องเห็นเนื้อหาครบ                                                      |
| Footer     | ประเภท/ระดับที่เกี่ยวข้อง และลิงก์เอกสารถ้ามี                                                                                            |
| Layout     | 1 คอลัมน์บน mobile, 2 คอลัมน์บน tablet, สูงสุด 3 คอลัมน์ desktop; card ทั้งใบไม่จำเป็นต้องคลิกได้เพื่อเลี่ยง nested interactive elements |

### 2.3 ตารางผลสอบและตารางข้อมูล

| เรื่อง               | กติกา                                                                                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header               | sticky header เฉพาะตารางยาวในหลังบ้าน; มี label ชัด, sort button แยกจากข้อความ และระบุ ascending/descending ด้วย `aria-sort`                                   |
| Columns ผลสอบ public | ชื่อ–นามสกุล, ประเภท, ระดับ, ปีการศึกษา, สถานะผล; **ไม่**แสดงคะแนนดิบ วันเกิด เลขบัตร หรือที่อยู่                                                              |
| Columns admin        | เลือกได้ตาม role/scope; เริ่มจากข้อมูลจำเป็นต่อการตัดสินใจ แล้วใช้ detail page/drawer สำหรับข้อมูลยาว                                                          |
| Responsive           | public: mobile เปลี่ยนหนึ่ง record เป็น list/card ที่มี label–value; admin: คง table ใน horizontal scroll container พร้อม sticky first column เฉพาะเมื่อจำเป็น |
| Density              | public row อย่างน้อย 52px; admin default 48px, dense 40px ใช้เฉพาะ desktop/ข้อมูลมาก; touch control 44px ขึ้นไป                                                |
| Empty/loading/error  | ทุกตารางต้องมี 4 state: loading skeleton, empty ที่บอก next action, error ที่ retry ได้, และ no-permission ที่ไม่เปิดข้อมูล                                    |

### 2.4 Badge สถานะ

| สถานะ           | สี            | Label ที่แนะนำ                                      | กติกา                                           |
| --------------- | ------------- | --------------------------------------------------- | ----------------------------------------------- |
| สำเร็จ          | success       | `อนุมัติแล้ว`, `สอบได้`, `เผยแพร่แล้ว`              | icon check + text; ห้ามใช้สีเขียวล้วน           |
| รอดำเนินการ     | pending       | `รอตรวจ`, `กำลังประมวลผล`, `รออนุมัติ`              | ใช้คำกริยาชัดเจน ไม่ใช้เพียง “รอ”               |
| ผิดพลาด/ไม่ผ่าน | error         | `ต้องแก้ไข`, `นำเข้าไม่สำเร็จ`, `ไม่ผ่านการตรวจสอบ` | ระบุเหตุหรือ link ดูรายละเอียดใกล้ badge        |
| ข้อมูล          | info          | `ฉบับร่าง`, `มีการแก้ไขใหม่`                        | ไม่ใช้แทน success/pending/error                 |
| ปิดใช้          | muted surface | `ปิดรับสมัคร`, `ยกเลิก`, `เก็บถาวร`                 | ใช้ text + icon; ต้องไม่เหมือน disabled control |

Badge เป็น “display status” ไม่ใช่ปุ่ม. การเปลี่ยนสถานะต้องใช้ button/dialog ที่บอกผลกระทบและบันทึกเหตุผล.

### 2.5 ฟอร์ม

| ส่วนประกอบ        | กติกาใช้งาน                                                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Field             | label อยู่เหนือ input เสมอ, เชื่อมด้วย `for`/`id`, ขนาดตัวอักษร input อย่างน้อย 16px บนมือถือเพื่อไม่ให้ browser zoom   |
| Required/optional | ใช้ข้อความ `จำเป็น` หรือ `ไม่บังคับ` ข้าง label; อย่าใช้ดอกจันเป็นสัญลักษณ์เดียว                                        |
| Help text         | ใต้ field ก่อน error; เขียนตัวอย่าง format เช่น `ปีการศึกษา เช่น 2569`                                                  |
| Error             | ชิด field, มีข้อความที่อธิบายวิธีแก้, เชื่อม `aria-describedby`; ไม่ใช้สีแดงอย่างเดียว                                  |
| Group             | แบ่งเป็น fieldset/legend เมื่อเป็นกลุ่ม เช่น ประเภทการสอบ/ระดับชั้น                                                     |
| Save              | ปุ่มหลักหนึ่งปุ่มต่อ action area; save ที่มีผลสำคัญต้องมี loading state ป้องกันกดซ้ำ; destructive action แยกสีและยืนยัน |
| File upload       | แสดงชนิด/ขนาดไฟล์ที่อนุญาตก่อนเลือก, แสดงชื่อ/สถานะ scan/ผล validation หลังอัปโหลด, มี error report ดาวน์โหลดได้        |

### 2.6 Pagination

- แสดงผลรวม เช่น `แสดง 1–20 จาก 438 รายการ` ก่อนตัวควบคุมเสมอ.
- มี `ก่อนหน้า`/`ถัดไป` เป็นข้อความ ไม่ใช้ icon อย่างเดียว; หน้าแรก/สุดท้ายใช้เมื่อรายการมาก.
- Mobile แสดงก่อนหน้า–ตัวบอกหน้า–ถัดไป; desktop แสดงเลขหน้ารอบหน้าปัจจุบันและ ellipsis.
- เปลี่ยนหน้าแล้ว focus ที่ heading หรือต้นตาราง และประกาศผ่าน live region ว่าโหลดรายการช่วงใดแล้ว.
- คง filter/sort/search ไว้ใน URL query string เพื่อแชร์และย้อนกลับได้.

## 3. Layout: หน้าบ้านเทียบหลังบ้าน

| มิติ              | หน้าบ้าน (Public)                                                                | หลังบ้าน (Admin)                                                                                               |
| ----------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| เป้าหมาย          | ค้นข้อมูลเร็ว, เข้าใจขั้นตอน, อ่านบนมือถือ                                       | ทำงานกับข้อมูลจำนวนมากอย่างแม่นยำและตรวจสอบได้                                                                 |
| ความกว้าง content | `max-width: 1200px`; บทความ/คู่มือ 720–800px                                     | canvas กว้างได้ถึง 1440px; ตารางใช้พื้นที่เต็มเท่าที่จำเป็น                                                    |
| Padding           | 16px mobile, 24px tablet, 32px desktop                                           | 16px mobile, 24px desktop; ลดพื้นที่รอบ table แต่ไม่ลด touch target                                            |
| โครงหน้า          | single-column เป็นค่าเริ่มต้น; card/grid เฉพาะสรุปข่าว; CTA หลักเดียวต่อ section | top bar + sidebar desktop; page header มี title, year/program context, primary action; filters อยู่เหนือ table |
| ลำดับข้อมูล       | ข่าว/กำหนดการ/ค้นหาผลก่อน; ใช้ภาษาไม่เทคนิค                                      | สถานะงาน/ตัวกรอง/ตาราง/รายละเอียด; แสดง audit/status timeline ใน detail view                                   |
| Mobile            | ออกแบบ mobile-first; ข้อความและปุ่มเต็มความกว้างเมื่อจำเป็น                      | sidebar เป็น drawer; filters เป็น sheet; ตารางสลับ list หรือ scroll อย่างมี label                              |
| Feedback          | ใช้ข้อความอธิบายสิ่งที่ผู้ใช้ทำได้ต่อไป                                          | แสดง loading/save/sync/error อย่างละเอียดพอให้เจ้าหน้าที่แก้ปัญหาได้                                           |

### Page patterns ที่ต้องมี

1. **Public home**: notification bar → hero สั้น → ทางลัด 4 รายการ (ขั้นตอน, ปฏิทิน, เอกสาร, ค้นหาผล) → ข่าวล่าสุด → ติดต่อ.
2. **ค้นหาผลสอบ**: heading และคำอธิบาย privacy → form ชื่อเต็ม + ปีการศึกษา → ผลเป็น table/list → empty/error states → ลิงก์ผลรายบุคคล.
3. **Admin list**: breadcrumb → title + program/year context → action หลัก → filter bar → result table → pagination.
4. **Admin detail/form**: heading + status badge → summary → sections ตาม workflow → sticky action bar บน mobile เฉพาะเมื่อไม่บัง field/error.

## 4. Accessibility และ interaction baseline

- ทุก interactive element ใช้ keyboard ได้, มีชื่อ accessible และลำดับ tab ตามลำดับสายตา.
- Focus ใช้ `outline: 3px solid var(--color-focus); outline-offset: 2px;` ห้ามลบ outline โดยไม่แทนที่; สี ring light/dark ผ่าน contrast ตามตาราง.
- Hover ไม่เป็นวิธีเดียวในการเปิดข้อมูล/ปุ่ม; touch device ต้องเห็น action สำคัญโดยไม่ hover.
- ข้อความ error/success ที่เปลี่ยนตาม action ใช้ `aria-live="polite"`; error ที่ขัดขวางการส่งใช้ `role="alert"`.
- ไม่พึ่งสีอย่างเดียว: status มีข้อความ, icon, และในตารางมี text state; required field มีข้อความ.
- Modal/drawer ต้อง trap focus, ปิดด้วย Escape, คืน focus ไปยัง trigger และมี heading/label.
- ลำดับ heading ต่อเนื่อง, มี skip link, รูป/ตราหน่วยงานมี alt ที่มีความหมายหรือ `alt=""` หากตกแต่ง.
- เคารพ `prefers-reduced-motion`; transition สั้นเพื่ออธิบาย state ไม่ใช้ animation วน.

## 5. Handoff ให้ทีมพัฒนา

### Token implementation

- สร้าง semantic color variables ใน `app/globals.css` ก่อนสร้าง component; mapping เข้ากับ Tailwind theme ด้วย CSS variables.
- ใช้ component API ที่สื่อเจตนา เช่น `<StatusBadge tone="success">อนุมัติแล้ว</StatusBadge>` แทนรับ class สีจาก caller.
- component ทุกตัวต้องมี state: default, hover, focus-visible, disabled, loading (ถ้าเป็น action), error (ถ้าเกี่ยวกับ input).
- เขียน visual regression/Playwright สำหรับ public search, form error, admin table overflow, keyboard focus และ dark mode หากเปิดใช้.

### Checklist ก่อนรับ component

- [x] ใช้ token ไม่ hard-code สี/spacing ใน component
- [x] ข้อความไทย body อย่างน้อย 16px และ line-height 1.75
- [x] มี visible keyboard focus และผ่าน AA ตามคู่สีที่กำหนด
- [x] สถานะมี text ไม่พึ่งสีอย่างเดียว
- [x] รองรับ mobile 320px โดยไม่มีการตัด label/action สำคัญ
- [x] ตารางมี loading, empty, error และ pagination state
- [x] ฟอร์มมี label, help text, error ที่อธิบายวิธีแก้ และ touch target 44px
- [x] หน้าบ้านเน้นการอ่าน/ค้นหา; หลังบ้านเน้น filter/table/workflow โดยไม่ลด accessibility
