import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";

// A confirmation box in the site's own style, used instead of the browser's
// window.confirm() popup. Stays open while `busy` so the person sees the
// action finish; Escape or tapping outside closes it (unless busy).
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  busyLabel = "Working…",
  cancelLabel = "Go back",
  tone = "danger",
  busy = false,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);
  const dialogRef = useRef(null);

  // Focus once when it opens. Not on every render: pages re-render each
  // second (countdowns), which would pull focus out of a text box inside.
  useEffect(() => {
    if (!open) return;
    const field = dialogRef.current?.querySelector("textarea, input");
    (field || cancelRef.current)?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape" && !busy) onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  const confirmCls = tone === "danger"
    ? "bg-red text-white"
    : "bg-orange text-white";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-ink/40 px-4 pb-4 sm:pb-0"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-[420px] bg-white rounded-xl border border-border/50 shadow-lg p-6"
      >
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
            tone === "danger" ? "bg-red-tint text-red" : "bg-orange-tint text-orange-dark"
          }`}>
            <AlertTriangle size={18} />
          </div>
          <div className="min-w-0">
            <h2 id="confirm-dialog-title" className="text-[17px] font-medium text-ink mb-1.5">{title}</h2>
            <div className="text-[14px] text-ink-muted leading-relaxed">{children}</div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 mt-6">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="h-11 px-5 rounded-lg text-sm font-medium bg-white border border-border-muted text-ink cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`h-11 px-5 rounded-lg text-sm font-medium border-none cursor-pointer disabled:opacity-60 ${confirmCls}`}
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
