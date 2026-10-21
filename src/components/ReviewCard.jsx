import { useState } from "react";
import StarRating from "./StarRating";
import Avatar from "./Avatar";
import { friendlyError } from "../utils/friendlyError";

const REPLY_MAX = 500;

// onSaveReply is passed only when the viewer owns the equipment; it shows a
// Reply / Edit reply button under the review.
export default function ReviewCard({ review, onSaveReply }) {
  const { id, name, photo, date, rating, text, reply } = review;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function startEditing() {
    setDraft(reply || "");
    setError("");
    setEditing(true);
  }

  async function save(value) {
    setSaving(true);
    setError("");
    try {
      await onSaveReply(id, value);
      setEditing(false);
    } catch (err) {
      setError(friendlyError(err, "Could not save your reply. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-border/50 rounded-xl p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Avatar src={photo} name={name} className="w-8 h-8 text-[10px]" />
          <span className="text-sm font-medium text-ink">{name}</span>
        </div>
        <span className="text-xs text-ink-muted">{date}</span>
      </div>

      <StarRating rating={rating} />

      <p className="text-sm text-ink mt-2 leading-relaxed">{text}</p>

      {reply && !editing && (
        <div className="mt-3 pl-3 border-l-[3px] border-l-green">
          <div className="text-xs font-medium text-green">Owner reply:</div>
          <p className="text-sm text-ink mt-1">{reply}</p>
        </div>
      )}

      {onSaveReply && !editing && (
        <button
          type="button"
          onClick={startEditing}
          className="mt-3 text-[13px] font-medium text-green bg-transparent border-none p-0 cursor-pointer"
        >
          {reply ? "Edit reply" : "Reply"}
        </button>
      )}

      {editing && (
        <div className="mt-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={REPLY_MAX}
            rows={3}
            disabled={saving}
            aria-label="Your reply"
            placeholder="Thank the renter or respond to their review"
            className="w-full px-3 py-2 text-sm text-ink border border-border-muted rounded-lg outline-none resize-none focus:border-green"
          />
          <div className="flex justify-between gap-3 text-xs mt-1">
            <span className="text-red">{error}</span>
            <span className="text-ink-muted shrink-0">{draft.length}/{REPLY_MAX}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <button
              type="button"
              onClick={() => save(draft)}
              disabled={saving || !draft.trim()}
              className="h-9 px-4 rounded-lg text-[13px] font-medium bg-green text-white border-none cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save reply"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={saving}
              className="h-9 px-4 rounded-lg text-[13px] font-medium bg-white border border-border-muted text-ink cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            {reply && (
              <button
                type="button"
                onClick={() => save("")}
                disabled={saving}
                className="h-9 px-2 text-[13px] font-medium text-red bg-transparent border-none cursor-pointer disabled:opacity-50"
              >
                Remove reply
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
