import { expect, test } from "@playwright/test";

import { e2eData, e2eUsers, prepareApprovedScoreForE2e } from "./support/test-database";

async function login(page: import("@playwright/test").Page, username: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("ชื่อผู้ใช้").fill(username);
  await page.getByLabel("รหัสผ่าน").fill(password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
}

test.describe.serial("critical examination lifecycle", () => {
  test("school applies, field officer assigns a seat, admin publishes, and guest finds the published result", async ({
    browser,
  }) => {
    const school = await browser.newContext();
    const schoolPage = await school.newPage();
    await login(schoolPage, e2eUsers.school.username, e2eUsers.school.password);
    await expect(schoolPage).toHaveURL(/\/admin\/school$/);
    await schoolPage.goto("/applications");
    await schoolPage.getByLabel("เลขบัตรประชาชน").fill(e2eData.applicant.nationalId);
    await schoolPage.getByLabel("ชื่อ").fill(e2eData.applicant.firstName);
    await schoolPage.getByLabel("นามสกุล").fill(e2eData.applicant.lastName);
    await schoolPage.getByLabel("รหัสสนามสอบ").fill(e2eData.examCenterCode);
    await schoolPage.getByLabel("รหัสหลักสูตรสอบ").fill(e2eData.examProgramCode);
    await schoolPage.getByRole("button", { name: "ส่งใบสมัคร" }).click();
    await expect(schoolPage.getByRole("cell", { name: "ทดสอบ อัตโนมัติ" })).toBeVisible();
    await school.close();

    const officer = await browser.newContext();
    const officerPage = await officer.newPage();
    await login(officerPage, e2eUsers.fieldOfficer.username, e2eUsers.fieldOfficer.password);
    await expect(officerPage).toHaveURL(/\/admin\/field$/);
    await officerPage.goto("/applications");
    await officerPage.getByRole("button", { name: "อนุมัติและออกเลขที่นั่ง" }).click();
    await expect(officerPage.getByText("อนุมัติแล้ว")).toBeVisible();
    await expect(officerPage.getByText("E2E-CENTER-2569-NDT-TRI-E2E-00001")).toBeVisible();
    await officer.close();

    await prepareApprovedScoreForE2e();

    const administrator = await browser.newContext();
    const adminPage = await administrator.newPage();
    await login(adminPage, e2eUsers.superAdmin.username, e2eUsers.superAdmin.password);
    await expect(adminPage).toHaveURL(/\/admin$/);
    await adminPage.goto("/results-management");
    await adminPage.getByRole("button", { name: `ประกาศ ${e2eData.examProgramCode}` }).click();
    await expect(
      adminPage.getByText("การประกาศจะสร้าง public projection ใหม่แบบ atomic"),
    ).toBeVisible();
    await administrator.close();

    const guest = await browser.newContext();
    const guestPage = await guest.newPage();
    await guestPage.goto("/results");
    await guestPage
      .getByLabel("เลขที่นั่งสอบ หรือชื่อ–สกุล")
      .fill("E2E-CENTER-2569-NDT-TRI-E2E-00001");
    await expect(guestPage.getByText("ทดสอบ อัตโนมัติ")).toBeVisible();
    await expect(guestPage.getByText("ผ่าน")).toBeVisible();
    await guest.close();
  });
});
