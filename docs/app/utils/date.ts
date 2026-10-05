const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

/**
 * Formats an ISO `YYYY-MM-DD` string as e.g. `September 12, 2026`.
 *
 * Parsed by hand rather than with `new Date()` so the output is identical on
 * the server and the client regardless of timezone or locale.
 */
export function formatDate(iso: string | undefined): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  if (!match) return "";

  const [, year, month, day] = match;
  const monthName = MONTHS[Number(month) - 1];
  if (!monthName) return "";

  return `${monthName} ${Number(day)}, ${year}`;
}
