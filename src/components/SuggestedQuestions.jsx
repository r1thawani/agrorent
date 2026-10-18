import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { getSuggestedQuestions } from "../utils/suggestedQuestions";

// "Not sure what to ask?" list for renters in a chat. Tapping a question
// hands it to onPick, which puts it in the message box to edit and send.
export default function SuggestedQuestions({ category, onPick, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const groups = getSuggestedQuestions(category);

  return (
    <div className="border-t border-border bg-white">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-green bg-transparent border-none cursor-pointer text-left">
        <HelpCircle size={15} />
        Not sure what to ask? Tap a question
        {open ? <ChevronUp size={15} className="ml-auto" /> : <ChevronDown size={15} className="ml-auto" />}
      </button>

      {open && (
        <div className="max-h-[260px] overflow-y-auto px-4 pb-3 flex flex-col gap-3">
          {groups.map((group) => (
            <div key={group.title}>
              <div className="text-[11px] font-medium uppercase tracking-[0.05em] text-ink-muted mb-1.5">{group.title}</div>
              <div className="flex flex-wrap gap-1.5">
                {group.questions.map((q) => (
                  <button key={q} type="button"
                    onClick={() => { onPick(q); setOpen(false); }}
                    className="text-left text-[13px] text-ink bg-page border border-border rounded-2xl px-3 py-1.5 cursor-pointer hover:border-green hover:bg-green-tint transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
