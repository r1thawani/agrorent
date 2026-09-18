import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Avatar from "../components/Avatar";
import MessageBubble from "../components/MessageBubble";
import { messageService } from "../services/messageService";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";

export default function Conversation() {
  const { id } = useParams();
  const { user } = useAuth();
  const [conv, setConv] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    messageService.getConversation(id, user.id)
      .then((data) => {
        setConv(data);
        messageService.markMessagesRead(id, user.id).catch(() => {});
      })
      .catch(() => setLoadError("Conversation not found."));
  }, [id, user]);

  // Real-time: append messages sent by the other person
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`conversation:${id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${id}`,
      }, (payload) => {
        const msg = payload.new;
        if (msg.sender_id === user.id) return;
        setConv((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...prev.messages, {
              id: msg.id,
              from: "them",
              text: msg.text,
              time: new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            }],
          };
        });
        messageService.markMessagesRead(id, user.id).catch(() => {});
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [id, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conv?.messages]);

  if (loadError) {
    return (
      <div className="bg-page min-h-screen pt-14">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-8 flex flex-col lg:flex-row gap-6">
          <Sidebar />
          <div className="flex-1 min-w-0 text-center py-16">
            <div className="text-base text-ink mb-2">{loadError}</div>
            <Link to="/messages" className="text-sm text-orange">Back to Messages</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!conv) {
    return (
      <div className="bg-page min-h-screen pt-14">
        <div className="max-w-[1280px] mx-auto px-6 pt-[88px] text-center text-ink-muted">Loading…</div>
      </div>
    );
  }

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    const optimisticMsg = { id: `temp-${Date.now()}`, from: "me", text, time: "Now" };
    setConv((prev) => ({ ...prev, messages: [...prev.messages, optimisticMsg] }));
    setInput("");
    try {
      await messageService.sendMessage(id, user.id, text);
    } catch {
      setConv((prev) => ({ ...prev, messages: prev.messages.filter((m) => m.id !== optimisticMsg.id) }));
    }
  }

  return (
    <div className="bg-page min-h-screen pt-14">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-8 pb-8 flex flex-col lg:flex-row gap-6">
        <Sidebar />

        <div className="flex-1 min-w-0 flex flex-col">
          <Link to="/messages" className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted no-underline mb-4 w-fit">
            <ArrowLeft size={14} /> Back to Messages
          </Link>

          <div className="bg-white border border-border/50 rounded-xl flex flex-col overflow-hidden flex-1">
            <div className="h-16 border-b border-border px-5 flex items-center gap-3 shrink-0">
              <Avatar src={conv.photo || null} name={conv.person} className="w-9 h-9 text-[11px]" />
              <div>
                <div className="text-[15px] font-medium text-ink">{conv.person}</div>
                <div className="text-xs text-ink-muted">Re: {conv.equipment}</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3 min-h-[360px] bg-page">
              {conv.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={sendMessage}
              className="h-16 border-t border-border px-4 flex items-center gap-3 shrink-0 bg-white">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 h-10 px-3 text-sm text-ink border border-border rounded-lg outline-none"
              />
              <button type="submit"
                className="w-10 h-10 rounded-full border-none bg-orange flex items-center justify-center cursor-pointer shrink-0">
                <Send size={16} color="#FFFFFF" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
