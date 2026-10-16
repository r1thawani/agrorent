import { useState } from "react";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { emailService } from "../services/emailService";
import { friendlyError } from "../utils/friendlyError";

const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL;
const MESSAGE_MAX = 2000;

export default function Contact() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    message: "",
    website: "", // hidden spam trap, see the form below
  });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (sending) return;
    if (form.message.trim().length < 10) {
      setError("Please describe what you need help with (at least 10 characters).");
      return;
    }
    setSending(true);
    setError("");
    try {
      await emailService.sendHelpRequest(form);
      setSent(true);
    } catch (err) {
      setError(friendlyError(err, "We couldn't send your message. Please try again."));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="pt-14 bg-page min-h-[calc(100vh-56px)]">
      <section className="bg-green-dark px-6 py-14 text-center">
        <h1 className="text-[26px] font-medium text-white">Contact us</h1>
        <p className="text-sm text-green-tint-2 mt-2">
          Questions about renting, listing, or a booking? We're happy to help.
        </p>
      </section>

      <section className="max-w-[900px] mx-auto px-4 sm:px-6 py-12 flex flex-col sm:flex-row gap-10 flex-wrap">
        <div className="flex-1 min-w-[220px] flex flex-col gap-5">
          {SUPPORT_EMAIL && (
            <div className="flex gap-3 items-start">
              <Mail size={18} className="text-green mt-0.5" />
              <div>
                <div className="text-sm font-medium text-ink">Email</div>
                <div className="text-[13px] text-ink-muted mt-0.5 break-all">{SUPPORT_EMAIL}</div>
              </div>
            </div>
          )}
          <div className="flex gap-3 items-start">
            <MessageCircle size={18} className="text-green mt-0.5" />
            <div>
              <div className="text-sm font-medium text-ink">Response time</div>
              <div className="text-[13px] text-ink-muted mt-0.5">Usually within one business day</div>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <MapPin size={18} className="text-green mt-0.5" />
            <div>
              <div className="text-sm font-medium text-ink">Based in</div>
              <div className="text-[13px] text-ink-muted mt-0.5">Lusaka, Zambia</div>
            </div>
          </div>
        </div>

        <div className="flex-[2] min-w-[280px] bg-white rounded-xl border border-border/50 p-8">
          {sent ? (
            <p className="text-sm text-green">Thanks — your message has been sent. We'll reply to {form.email} shortly.</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div>
                <label className="block text-[13px] font-medium text-ink mb-2">Name</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} required maxLength={80}
                  className="w-full h-11 px-3 text-sm border border-border rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-ink mb-2">Email address</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required maxLength={254}
                  className="w-full h-11 px-3 text-sm border border-border rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-ink mb-2">Message</label>
                <textarea name="message" value={form.message} onChange={handleChange} required rows={5} maxLength={MESSAGE_MAX}
                  className="w-full p-3 text-sm border border-border rounded-lg outline-none resize-y font-[inherit]" />
              </div>
              {/* Spam trap: hidden from people, but bots fill in every field. */}
              <input type="text" name="website" value={form.website} onChange={handleChange}
                tabIndex={-1} autoComplete="off" aria-hidden="true"
                className="absolute -left-[9999px] w-px h-px opacity-0" />
              {error && <p className="text-[13px] text-red -mt-2">{error}</p>}
              <button type="submit" disabled={sending}
                className="w-full h-12 rounded-lg border-none text-white text-[15px] font-medium bg-orange cursor-pointer disabled:opacity-70 disabled:cursor-default">
                {sending ? "Sending…" : "Send message"}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
