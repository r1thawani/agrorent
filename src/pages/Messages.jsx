import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Avatar from "../components/Avatar";
import { messageService } from "../services/messageService";
import { useAuth } from "../hooks/useAuth";

export default function Messages() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!user) return;
    messageService.getConversations(user.id)
      .then(setConversations)
      .catch(() => setLoadError("Could not load messages."))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = conversations.filter(
    (m) =>
      m.person.toLowerCase().includes(query.toLowerCase()) ||
      m.equipment.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="bg-page min-h-screen pt-14">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-8 pb-8 flex flex-col lg:flex-row gap-6">
        <Sidebar />

        <div className="flex-1 min-w-0">
          <h1 className="text-[26px] font-medium text-ink mb-5">Messages</h1>

          <div className="bg-white border border-border/50 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search size={16} color="#555555" className="absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full h-9 pl-[34px] pr-3 text-sm text-ink border border-border rounded-lg outline-none"
                />
              </div>
            </div>

            {loading && <div className="py-12 text-center text-sm text-ink-muted">Loading…</div>}
            {loadError && <div className="py-12 text-center text-sm text-red">{loadError}</div>}

            {!loading && !loadError && filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-ink-muted">No conversations found.</div>
            )}

            {!loading && !loadError && filtered.map((conv) => (
              <Link
                key={conv.id}
                to={`/messages/${conv.id}`}
                className={`flex items-start gap-3 px-4 py-4 border-b border-border no-underline last:border-b-0 ${
                  conv.unread ? "bg-page-warm" : "bg-white"
                }`}
              >
                <Avatar src={conv.photo || null} name={conv.person} className="w-11 h-11 text-[13px] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-medium text-ink">{conv.person}</span>
                    <span className="text-[11px] text-ink-muted shrink-0 ml-2">{conv.time}</span>
                  </div>
                  <div className="text-xs text-ink-muted mt-0.5">Re: {conv.equipment}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[13px] truncate flex-1 ${conv.unread ? "font-medium text-ink" : "text-ink-muted"}`}>
                      {conv.lastMessage}
                    </span>
                    {conv.unread && (
                      <span className="w-2 h-2 rounded-full bg-orange shrink-0" />
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
