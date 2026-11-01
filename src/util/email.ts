// Emails are case-insensitive in practice; store and compare them trimmed and lowercased.
export function normalizeEmail(value: unknown): string
{
  return String(value === undefined || value === null ? "" : value).trim().toLowerCase();
}
