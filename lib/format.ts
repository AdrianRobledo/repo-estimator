/** Format a date string for display with short month (e.g. "Feb 17, 2026"). */
export function formatDate(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  return dateStr;
}

/** Format a date string for display with long month (e.g. "February 17, 2026"). */
export function formatDisplayDate(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  return dateStr;
}

/** Format a phone number for US display: (555) 123-4567. */
export function formatPhone(value: string): string {
  const hasPlus = value.startsWith("+");
  const digits = value.replace(/\D/g, "");
  if (hasPlus || digits.length > 10) return hasPlus ? "+" + digits : digits;
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

/** Validate an email address. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Estimate status badge CSS classes. */
export const estimateStatusBadge: Record<string, string> = {
  draft: "bg-slate-500/15 text-slate-400 border-slate-500/20",
  sent: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  declined: "bg-red-500/15 text-red-400 border-red-500/20",
};

/** Invoice status badge CSS classes. */
export const invoiceStatusBadge: Record<string, string> = {
  unpaid: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  paid: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  overdue: "bg-red-500/15 text-red-400 border-red-500/20",
};
