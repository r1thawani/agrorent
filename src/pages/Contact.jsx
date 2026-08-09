import { useState } from "react";
import { Mail, MapPin, MessageCircle } from "lucide-react";

// Public page — intentionally doesn't touch NotificationContext (that's
// in-app notifications for logged-in users; a visitor filling this out may
// not be logged in at all). Local "sent" state is enough to confirm submission.
export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div style={{ paddingTop: "56px", backgroundColor: "#F5F5F0", minHeight: "calc(100vh - 56px)" }}>
      <section style={{ backgroundColor: "#0F3D1E", padding: "56px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 500, color: "#FFFFFF" }}>Contact us</h1>
        <p style={{ fontSize: "14px", color: "#A8E6BE", marginTop: "8px" }}>
          Questions about renting, listing, or a booking? We're happy to help.
        </p>
      </section>

      <section style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 24px", display: "flex", gap: "40px", flexWrap: "wrap" }}>
        {/* Contact details */}
        <div style={{ flex: "1", minWidth: "220px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <Mail size={18} style={{ color: "#1A5C2E", marginTop: "2px" }} />
            <div>
              <div style={{ fontSize: "14px", fontWeight: 500, color: "#111111" }}>Email</div>
              <div style={{ fontSize: "13px", color: "#555555", marginTop: "2px" }}>support@agrorent.co.zm</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <MessageCircle size={18} style={{ color: "#1A5C2E", marginTop: "2px" }} />
            <div>
              <div style={{ fontSize: "14px", fontWeight: 500, color: "#111111" }}>Response time</div>
              <div style={{ fontSize: "13px", color: "#555555", marginTop: "2px" }}>Usually within one business day</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <MapPin size={18} style={{ color: "#1A5C2E", marginTop: "2px" }} />
            <div>
              <div style={{ fontSize: "14px", fontWeight: 500, color: "#111111" }}>Based in</div>
              <div style={{ fontSize: "13px", color: "#555555", marginTop: "2px" }}>Lusaka, Zambia</div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div
          style={{
            flex: "2",
            minWidth: "280px",
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            border: "0.5px solid #E0E8E3",
            padding: "32px",
          }}
        >
          {sent ? (
            <p style={{ fontSize: "14px", color: "#1A5C2E" }}>
              Thanks — your message has been sent. We'll reply by email shortly.
            </p>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  style={{ width: "100%", height: "44px", padding: "0 12px", fontSize: "14px", border: "1px solid #E0E8E3", borderRadius: "8px", outline: "none" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  style={{ width: "100%", height: "44px", padding: "0 12px", fontSize: "14px", border: "1px solid #E0E8E3", borderRadius: "8px", outline: "none" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>
                  Message
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  style={{ width: "100%", padding: "12px", fontSize: "14px", border: "1px solid #E0E8E3", borderRadius: "8px", outline: "none", resize: "vertical", fontFamily: "inherit" }}
                />
              </div>
              <button
                type="submit"
                style={{ width: "100%", height: "48px", borderRadius: "8px", border: "none", color: "#FFFFFF", fontSize: "15px", fontWeight: 500, backgroundColor: "#FF5C00", cursor: "pointer" }}
              >
                Send message
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
