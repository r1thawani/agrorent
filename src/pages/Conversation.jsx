import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { MESSAGES } from "../data/mockData";

export default function Conversation() {
  const { id } = useParams();
  const original = MESSAGES.find((m) => m.id === id);
  const [thread, setThread] = useState(original ? [...original.messages] : []);
  const [input, setInput] = useState("");

  if (!original) {
    return (
      <div style={{ backgroundColor: "#F5F5F0", minHeight: "100vh", paddingTop: "56px" }}>
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "32px 24px",
            display: "flex",
            gap: "24px",
          }}
        >
          <Sidebar role="renter" />
          <div style={{ flex: 1, minWidth: 0, textAlign: "center", padding: "64px 0" }}>
            <div style={{ fontSize: "16px", color: "#111111", marginBottom: "8px" }}>
              Conversation not found
            </div>
            <Link to="/messages" style={{ fontSize: "14px", color: "#FF5C00" }}>
              Back to Messages
            </Link>
          </div>
        </div>
      </div>
    );
  }

  function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setThread((prev) => [...prev, { id: Date.now(), from: "me", text, time: "Now" }]);
    setInput("");
  }

  return (
    <div style={{ backgroundColor: "#F5F5F0", minHeight: "100vh", paddingTop: "56px" }}>
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "32px 24px",
          display: "flex",
          gap: "24px",
        }}
      >
        <Sidebar role="renter" />

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <Link
            to="/messages"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              color: "#555555",
              textDecoration: "none",
              marginBottom: "16px",
              width: "fit-content",
            }}
          >
            <ArrowLeft size={14} />
            Back to Messages
          </Link>

          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "0.5px solid #E0E8E3",
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              flex: 1,
            }}
          >
            <div
              style={{
                height: "64px",
                borderBottom: "1px solid #E0E8E3",
                padding: "0 20px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexShrink: 0,
              }}
            >
              <img
                src={original.photo}
                alt={original.person}
                style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }}
              />
              <div>
                <div style={{ fontSize: "15px", fontWeight: 500, color: "#111111" }}>
                  {original.person}
                </div>
                <div style={{ fontSize: "12px", color: "#555555" }}>Re: {original.equipment}</div>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                minHeight: "360px",
                backgroundColor: "#F5F5F0",
              }}
            >
              {thread.map((msg) => {
                const isMe = msg.from === "me";
                return (
                  <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
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
                        {msg.text}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#555555",
                          marginTop: "3px",
                          textAlign: isMe ? "right" : "left",
                        }}
                      >
                        {msg.time}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <form
              onSubmit={sendMessage}
              style={{
                height: "64px",
                borderTop: "1px solid #E0E8E3",
                padding: "0 16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexShrink: 0,
                backgroundColor: "#FFFFFF",
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                style={{
                  flex: 1,
                  height: "40px",
                  padding: "0 12px",
                  fontSize: "14px",
                  color: "#111111",
                  border: "1px solid #E0E8E3",
                  borderRadius: "8px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="submit"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: "#FF5C00",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <Send size={16} color="#FFFFFF" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
