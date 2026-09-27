import { createHmac } from "node:crypto";

export function normalizeText(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeCode(value: unknown) {
  return normalizeText(value).toUpperCase();
}

export function normalizeSeatNo(value: unknown) {
  return normalizeCode(value).replace(/\s+/g, "");
}

export function normalizeNationalId(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

export function isValidThaiNationalId(value: unknown) {
  const nationalId = normalizeNationalId(value);

  if (!/^\d{13}$/.test(nationalId)) return false;

  const checksum = Array.from(nationalId.slice(0, 12)).reduce(
    (total, digit, index) => total + Number(digit) * (13 - index),
    0,
  );

  return (11 - (checksum % 11)) % 10 === Number(nationalId[12]);
}

export function hashNationalId(nationalId: string) {
  const secret = process.env.APPLICANT_ID_HASH_SECRET;

  if (!secret) {
    throw new Error("APPLICANT_ID_HASH_SECRET is required to process applications.");
  }

  return createHmac("sha256", secret).update(normalizeNationalId(nationalId)).digest("hex");
}
