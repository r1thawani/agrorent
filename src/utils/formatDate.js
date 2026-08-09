// Date display helpers shared across pages. mockData.js stores dates as
// "YYYY-MM-DD" strings; these turn them into the human-friendly formats
// used throughout the UI (e.g. booking rows, listing details).

// "2025-02-10" -> "10 Feb 2025"
export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// "2025-02-10", "2025-02-17" -> "10 Feb 2025 → 17 Feb 2025"
export function formatDateRange(startDate, endDate) {
  return `${formatDate(startDate)} → ${formatDate(endDate)}`;
}

// Rough "time ago" style label for timestamps like notifications/messages
// when only an ISO date (not a canned "2 hours ago" string) is available.
export function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  return formatDate(dateStr);
}
