export type SeatNumberParts = Readonly<{
  academicYearBe: number;
  centerCode: string;
  programCode: string;
  sequenceNo: number;
}>;

/**
 * Creates the immutable human-readable examination seat number. Database
 * uniqueness constraints remain the concurrency guard; this function keeps
 * its representation consistent wherever a number is issued or displayed.
 */
export function formatSeatNumber({
  academicYearBe,
  centerCode,
  programCode,
  sequenceNo,
}: SeatNumberParts) {
  if (!Number.isSafeInteger(sequenceNo) || sequenceNo < 1) {
    throw new Error("Seat sequence number must be a positive integer.");
  }

  return `${centerCode}-${academicYearBe}-${programCode}-${String(sequenceNo).padStart(5, "0")}`;
}
