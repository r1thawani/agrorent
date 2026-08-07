import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import AdminTopNav from "../../components/AdminTopNav";
import { DISPUTES } from "../../data/mockData";

export default function AdminDisputes() {
  const [activeTab, setActiveTab] = useState("open");
  const [notes, setNotes] = useState({});
  const [disputes, setDisputes] = useState(DISPUTES);

  function resolve(id) {
    setDisputes((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "resolved" } : d))
    );
  }

  const filtered = disputes.filter((d) => d.status === activeTab);

  const tabStyle = (tab) => ({
    fontSize: "14px",
    fontWeight: activeTab === tab ? 500 : 400,
    paddingBottom: "10px",
    borderBottom: activeTab === tab ? "2px solid #FF5C00" : "2px solid transparent",
    color: activeTab === tab ? "#FF5C00" : "#555555",
    background: "none",
    border: "none",
    borderBottomWidth: "2px",
    cursor: "pointer",
  });

  return (
    <div>
      <AdminTopNav />
      <div style={{ padding: "32px", backgroundColor: "#F5F5F0", minHeight: "100vh" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 500, color: "#111111", marginBottom: "16px" }}>
          Disputes
        </h1>

        <div
          style={{
            display: "flex",
            gap: "24px",
            borderBottom: "1px solid #E0E8E3",
            marginBottom: "20px",
          }}
        >
          <button style={tabStyle("open")} onClick={() => setActiveTab("open")}>
            Open
          </button>
          <button style={tabStyle("resolved")} onClick={() => setActiveTab("resolved")}>
            Resolved
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filtered.map((d) => (
            <div
              key={d.id}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "12px",
                padding: "20px",
                border: "0.5px solid #E0E8E3",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <AlertTriangle size={16} color="#CC4A00" />
                  <span style={{ fontSize: "14px", fontWeight: 500, color: "#111111" }}>
                    Dispute #{d.id}
                  </span>
                </div>
                <span style={{ fontSize: "12px", color: "#555555" }}>{d.date}</span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                      color: "#555555",
                      marginBottom: "8px",
                    }}
                  >
                    Reported by
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <img
                      src={d.reporter.photo}
                      alt={d.reporter.name}
                      style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }}
                    />
                    <span style={{ fontSize: "14px", color: "#111111" }}>{d.reporter.name}</span>
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                      color: "#555555",
                      marginBottom: "8px",
                    }}
                  >
                    Against
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <img
                      src={d.against.photo}
                      alt={d.against.name}
                      style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }}
                    />
                    <span style={{ fontSize: "14px", color: "#111111" }}>{d.against.name}</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                  color: "#555555",
                  marginBottom: "4px",
                }}
              >
                Reason
              </div>
              <p style={{ fontSize: "14px", color: "#111111", margin: 0 }}>{d.reason}</p>

              {d.status === "open" && (
                <div style={{ marginTop: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#111111",
                      marginBottom: "6px",
                    }}
                  >
                    Resolution notes
                  </label>
                  <textarea
                    value={notes[d.id] ?? ""}
                    onChange={(e) =>
                      setNotes((n) => ({ ...n, [d.id]: e.target.value }))
                    }
                    placeholder="Describe how this dispute was resolved…"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      fontSize: "14px",
                      border: "1px solid #E0E8E3",
                      borderRadius: "8px",
                      outline: "none",
                      resize: "none",
                      height: "80px",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                  />
                  <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                    <button
                      onClick={() => resolve(d.id)}
                      style={{
                        padding: "9px 18px",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#FFFFFF",
                        backgroundColor: "#1A5C2E",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    >
                      Mark as resolved
                    </button>
                    <button
                      style={{
                        padding: "9px 18px",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#555555",
                        backgroundColor: "transparent",
                        border: "0.5px solid #CCCCCC",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", fontSize: "14px", color: "#555555" }}>
              No {activeTab} disputes
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
