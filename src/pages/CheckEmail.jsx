import { useLocation, Link } from "react-router-dom";
import { Mail } from "lucide-react";

export default function CheckEmail() {
  const location = useLocation();
  const email = location.state?.email || "your email";

  return (
    <div className="min-h-[calc(100vh-56px)] bg-page flex items-center justify-center px-4 py-12">
      <div className="bg-white border border-border/50 rounded-xl p-10 w-full max-w-[420px] text-center">
        <Mail size={40} color="#FF5C00" className="mx-auto mb-4" />
        <h1 className="text-xl font-medium text-ink mb-2">Check your email</h1>
        <p className="text-sm text-ink-muted mb-6">
          We've sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come back here to log in.
        </p>
        <a
          href="https://mail.google.com/mail/u/0/#inbox"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-12 leading-[48px] rounded-lg bg-orange text-white text-[15px] font-medium no-underline mb-3"
        >
          Open Gmail
        </a>
        <Link to="/login" className="text-[13px] text-green no-underline">
          Already confirmed? Log in
        </Link>
      </div>
    </div>
  );
}
