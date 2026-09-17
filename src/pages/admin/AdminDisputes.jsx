import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import AdminTopNav from "../../components/AdminTopNav";
import { adminService } from "../../services/adminService";
import Avatar from "../../components/Avatar";

export default function AdminDisputes() {
  const [activeTab, setActiveTab] = useState("open");
  const [notes, setNotes] = useState({});
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getAllDisputes().then(setDisputes).finally(() => setLoading(false));
  }, []);

  async function resolve(id) {
    const noteText = notes[id] ?? "";
    setDisputes((prev) => prev.map((d) => (d.id === id ? { ...d, status: "resolved" } : d)));
    try { await adminService.resolveDispute(id, noteText); }
    catch { setDisputes((prev) => prev.map((d) => (d.id === id ? { ...d, status: "open" } : d))); }
  }

  const filtered = disputes.filter((d) => d.status === activeTab);

  function tabCls(tab) {
    return activeTab === tab
      ? "text-sm font-medium pb-2.5 border-b-2 border-orange text-orange bg-transparent border-0 border-b-2 cursor-pointer"
      : "text-sm pb-2.5 border-b-2 border-transparent text-ink-muted bg-transparent border-0 border-b-2 cursor-pointer";
  }

  const miniLabel = "text-[11px] font-medium uppercase tracking-[0.03em] text-ink-muted mb-2";

  return (
    <div>
      <AdminTopNav />
      <div className="min-h-[calc(100vh-56px)] bg-page px-4 sm:px-8 py-8">
        <h1 className="text-[22px] font-medium text-ink mb-4">Disputes</h1>

        <div className="flex gap-6 border-b border-border mb-5">
          <button className={tabCls("open")} onClick={() => setActiveTab("open")}>Open</button>
          <button className={tabCls("resolved")} onClick={() => setActiveTab("resolved")}>Resolved</button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-ink-muted">Loading…</div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((d) => (
              <div key={d.id} className="bg-white rounded-xl p-5 border border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} color="#CC4A00" />
                    <span className="text-[14px] font-medium text-ink">Dispute #{d.id.slice(0, 8)}</span>
                  </div>
                  <span className="text-xs text-ink-muted">{new Date(d.created_at).toLocaleDateString()}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className={miniLabel}>Reported by</div>
                    <div className="flex items-center gap-2">
                      <Avatar src={d.reporter?.photo_url} name={d.reporter?.name}
                        className="w-7 h-7 text-[9px]" />
                      <span className="text-[14px] text-ink">{d.reporter?.name}</span>
                    </div>
                  </div>
                  <div>
                    <div className={miniLabel}>Against</div>
                    <div className="flex items-center gap-2">
                      <Avatar src={d.against?.photo_url} name={d.against?.name}
                        className="w-7 h-7 text-[9px]" />
                      <span className="text-[14px] text-ink">{d.against?.name}</span>
                    </div>
                  </div>
                </div>

                <div className={miniLabel}>Reason</div>
                <p className="text-[14px] text-ink m-0">{d.reason}</p>

                {d.status === "resolved" && d.resolution_notes && (
                  <div className="mt-4">
                    <div className={miniLabel}>Resolution notes</div>
                    <p className="text-[14px] text-ink m-0">{d.resolution_notes}</p>
                  </div>
                )}

                {d.status === "open" && (
                  <div className="mt-4">
                    <label className="block text-[13px] font-medium text-ink mb-2">Resolution notes</label>
                    <textarea
                      value={notes[d.id] ?? ""}
                      onChange={(e) => setNotes((n) => ({ ...n, [d.id]: e.target.value }))}
                      placeholder="Describe how this dispute was resolved…"
                      rows={3}
                      className="w-full px-3 py-2 text-sm text-ink border border-border/50 rounded-lg outline-none resize-none"
                    />
                    <div className="flex gap-3 mt-3">
                      <button onClick={() => resolve(d.id)}
                        className="px-4 py-2 text-[13px] font-medium text-white bg-green rounded-lg border-none cursor-pointer">
                        Mark as resolved
                      </button>
                      <button
                        className="px-4 py-2 text-[13px] font-medium text-ink-muted bg-white border border-border-muted rounded-lg cursor-pointer">
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-[14px] text-ink-muted">No {activeTab} disputes</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
