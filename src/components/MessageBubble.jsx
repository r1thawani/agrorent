export default function MessageBubble({ message }) {
  const isMe = message.from === "me";

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[65%]">
        <div
          className={`px-3.5 py-2.5 text-sm ${
            isMe
              ? "rounded-xl rounded-br-[4px] bg-orange text-white"
              : "rounded-xl rounded-bl-[4px] bg-white text-ink border border-border/50"
          }`}
        >
          {message.text}
        </div>
        <div className={`text-[11px] text-ink-muted mt-[3px] ${isMe ? "text-right" : "text-left"}`}>
          {message.time}
        </div>
      </div>
    </div>
  );
}
