// One chat bubble, extracted from Conversation.jsx's inline thread.map().
// Kept intentionally tiny/presentational — Conversation.jsx still owns the
// thread state and the send form.
export default function MessageBubble({ message }) {
  const isMe = message.from === "me";

  return (
    <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
      <div style={{ maxWidth: "65%" }}>
        <div
          style={{
            padding: "10px 14px",
            borderRadius: isMe ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
            fontSize: "14px",
            backgroundColor: isMe ? "#FF5C00" : "#FFFFFF",
            color: isMe ? "#FFFFFF" : "#111111",
            border: isMe ? "none" : "0.5px solid #E0E8E3",
          }}
        >
          {message.text}
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "#555555",
            marginTop: "3px",
            textAlign: isMe ? "right" : "left",
          }}
        >
          {message.time}
        </div>
      </div>
    </div>
  );
}
