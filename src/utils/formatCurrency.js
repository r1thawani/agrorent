// Formats a number as Zambian Kwacha for display, e.g. formatCurrency(1750) -> "K1,750".
// Centralized here so every page shows prices the same way instead of each
// page hand-rolling `K${value.toLocaleString()}`.
export function formatCurrency(amount) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return "K0";
  return `K${Number(amount).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}
