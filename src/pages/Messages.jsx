import { useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { MESSAGES } from "../data/mockData";

export default function Messages() {
  const [query, setQuery] = useState("");

  const filtered = MESSAGES.filter(
    (m) =>
      m.person.toLowerCase().includes(query.toLowerCase()) ||
      m.equipment.toLowerCase().includes(query.toLowerCase())
  );

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

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: "26px", fontWeight: 500, color: "#111111", marginBottom: "20px" }}>
            Messages
          </h1>

          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "0.5px solid #E0E8E3",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "16px", borderBottom: "1px solid #E0E8E3" }}>
              <div style={{ position: "relative" }}>
                <Search
                  size={16}
                  color="#555555"
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search conversations..."
                  style={{
                    width: "100%",
                    height: "36px",
                    padding: "0 12px 0 34px",
                    fontSize: "14px",
                    color: "#111111",
                    border: "1px solid #E0E8E3",
                    borderRadius: "8px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div
                style={{
                  padding: "48px 16px",
                  textAlign: "center",
                  color: "#555555",
                  fontSize: "14px",
                }}
              >
                No conversations found.
              </div>
            ) : (
              filtered.map((conv) => (
                <Link
                  key={conv.id}
                  to={`/messages/${conv.id}`}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "16px",
                    borderBottom: "1px solid #E0E8E3",
                    textDecoration: "none",
                    backgroundColor: conv.unread ? "#FFF8F5" : "#FFFFFF",
                  }}
                >
                  <img
                    src={conv.photo}
                    alt={conv.person}
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: "14px", fontWeight: 500, color: "#111111" }}>
                        {conv.person}
                      </span>
                      <span style={{ fontSize: "11px", color: "#555555", flexShrink: 0, marginLeft: "8px" }}>
                        {conv.time}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#555555", marginTop: "2px" }}>
                      Re: {conv.equipment}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                      <span
                        style={{
                          fontSize: "13px",
                          color: conv.unread ? "#111111" : "#555555",
                          fontWeight: conv.unread ? 500 : 400,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          flex: 1,
                        }}
                      >
                        {conv.lastMessage}
                      </span>
                      {conv.unread && (
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: "#FF5C00",
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
