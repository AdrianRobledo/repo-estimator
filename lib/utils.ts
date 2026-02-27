/** Safely parse a JSON string, returning fallback on failure. */
export function safeParseJSON<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/** Generate an invoice number like INV-260226-847 */
export function generateInvoiceNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 900 + 100);
  return `INV-${y}${m}${d}-${rand}`;
}

/** Generate a due date ISO string 30 days from now (YYYY-MM-DD). */
export function generateDueDate(): string {
  const due = new Date();
  due.setDate(due.getDate() + 30);
  return `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}-${String(due.getDate()).padStart(2, "0")}`;
}

/** Format today's date as a long display string (e.g. "February 26, 2026"). */
export function todayDisplayDate(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
