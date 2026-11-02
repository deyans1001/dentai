import { timingSafeEqual } from "crypto";

// Защита за вътрешни (сървър → сървър) извиквания към нашите API маршрути.
// Секретът е в env променливата INTERNAL_API_SECRET и се праща в този header.
export const INTERNAL_SECRET_HEADER = "x-internal-secret";

export function internalHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    [INTERNAL_SECRET_HEADER]: process.env.INTERNAL_API_SECRET ?? "",
  };
}

export function isInternalRequest(headers: Headers): boolean {
  const expected = process.env.INTERNAL_API_SECRET;
  const received = headers.get(INTERNAL_SECRET_HEADER);
  if (!expected || !received) return false;

  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
