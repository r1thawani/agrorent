import { useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import { useAuth } from "../hooks/useAuth";
import { disputeService, REASON_MAX, REASON_MIN } from "../services/disputeService";
import { formatDateRange } from "../utils/formatDate";
import { friendlyError } from "../utils/friendlyError";

// Shown on a booking the user has reported: still open, or resolved with the
// admin's notes.
export function ReportStatus({ report }) {
  if (!report) return null;
  if (report.status === "open") {
    return <div className="text-xs text-orange-dark mt-1.5">Problem reported. AgroRent is looking into it.</div>;
  }
  return (
    <div className="text-xs text-ink-muted mt-1.5">
      Problem resolved by AgroRent{report.resolution_notes ? `: ${report.resolution_notes}` : "."}
    </div>
  );
}

// Dialog for reporting a problem with a booking (damage, no-show...). The
// report goes to the admins' Disputes page.
export default function ReportProblemDialog({ booking, otherName, onClose, onReported }) {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const length = reason.trim().length;
    if (length < REASON_MIN) {
      setError(`Please describe the problem in at least ${REASON_MIN} characters.`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const report = await disputeService.report({ booking, reporterId: user.id, reason });
      onReported(report);
    } catch (err) {
      setError(friendlyError(err, "Could not send your report. Please try again."));
      setBusy(false);
    }
  }

  return (
    <ConfirmDialog
      open={Boolean(booking)}
      title="Report a problem"
      confirmLabel="Send report"
      busyLabel="Sending…"
      cancelLabel="Go back"
      tone="warning"
      busy={busy}
      onConfirm={submit}
      onCancel={onClose}
    >
      {booking && (
        <>
          <p>
            <span className="font-medium text-ink">{booking.equipment?.name}</span>
            {" · "}{formatDateRange(booking.start_date, booking.end_date)}
            {otherName ? <> · with {otherName}</> : null}
          </p>
          <p className="mt-2">
            Tell us what went wrong, for example damaged equipment or a missed pickup. An AgroRent
            admin will review it and contact you both.
          </p>
          <textarea
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError(""); }}
            maxLength={REASON_MAX}
            rows={4}
            disabled={busy}
            aria-label="What went wrong"
            placeholder="What happened?"
            className="mt-3 w-full px-3 py-2 text-sm text-ink border border-border-muted rounded-lg outline-none resize-none focus:border-green"
          />
          <div className="flex justify-between gap-3 text-xs mt-1">
            <span className="text-red">{error}</span>
            <span className="text-ink-muted shrink-0">{reason.length}/{REASON_MAX}</span>
          </div>
        </>
      )}
    </ConfirmDialog>
  );
}
