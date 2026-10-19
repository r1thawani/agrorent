import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, HelpCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import Avatar from "./Avatar";
import { useNotifications } from "../context/NotificationContext";

function AttentionDot({ count }) {
  if (!count) return null;
  return (
    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-orange border-2 border-green-dark"
      title={`${count} thing${count === 1 ? "" : "s"} need your attention`} />
  );
}

// Logged-out buttons, so Log In reads as a button next to Sign Up.
const LOGIN_BTN =
  "inline-flex items-center justify-center bg-transparent hover:bg-white/10 transition-colors text-white font-medium rounded-lg border border-white/50 no-underline";
const SIGNUP_BTN =
  "inline-flex items-center justify-center bg-orange hover:bg-orange-dark transition-colors text-white font-medium rounded-lg border border-orange no-underline";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { badges } = useNotifications();
  // Things waiting on this user: requests to answer, deposits to pay, unread messages/notifications.
  const pending = isAuthenticated
    ? badges.booking_requests + badges.my_bookings + badges.messages + badges.notifications
    : 0;
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    setMobileOpen(false);
    navigate("/");
  }

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  return (
    <nav className="bg-green-dark fixed top-0 left-0 right-0 z-50">
      <div className="max-w-[1280px] mx-auto h-14 px-4 md:px-6 flex items-center justify-between">
        {/* Left — Logo */}
        <Link to="/" className="text-white font-medium text-lg tracking-[-0.3px] no-underline">
          AgroRent
        </Link>

        {/* Centre — Nav links (desktop only; the mobile menu below covers phones) */}
        <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          <Link to="/listings" className="text-green-tint-2 text-sm no-underline">
            Browse
          </Link>
          <Link to="/#how-it-works" className="text-green-tint-2 text-sm no-underline">
            How it works
          </Link>
        </div>

        {/* Right — auth-aware, desktop only */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/contact"
            title="Get help"
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 transition-colors text-white text-[13px] font-medium px-3 py-2 rounded-lg border border-white/30 no-underline"
          >
            <HelpCircle size={16} /> Need help?
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to={user.role === "admin" ? "/admin" : "/dashboard"}
                className="flex items-center gap-2 text-white text-sm no-underline"
              >
                <span className="relative">
                  <Avatar src={user.photo_url} name={user.name} className="w-7 h-7 text-[10px]" />
                  <AttentionDot count={pending} />
                </span>
                {user.name}
              </Link>
              <button
                onClick={handleLogout}
                className="bg-transparent text-green-tint-2 text-[13px] font-medium px-4 py-2 rounded-lg border border-[rgba(168,230,190,0.4)] cursor-pointer"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={`${LOGIN_BTN} h-9 px-4 text-[13px]`}>
                Log In
              </Link>
              <Link to="/signup" className={`${SIGNUP_BTN} h-9 px-4 text-[13px]`}>
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile — Log In / Sign Up stay visible without opening the menu */}
        <div className="md:hidden flex items-center gap-2">
          {!isAuthenticated && (
            <>
              <Link to="/login" onClick={closeMobileMenu} className={`${LOGIN_BTN} h-8 px-3 text-[13px]`}>
                Log In
              </Link>
              <Link to="/signup" onClick={closeMobileMenu} className={`${SIGNUP_BTN} h-8 px-3 text-[13px]`}>
                Sign Up
              </Link>
            </>
          )}

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="md:hidden relative text-white p-1 bg-transparent border-none cursor-pointer"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            {!mobileOpen && <AttentionDot count={pending} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown panel */}
      {mobileOpen && (
        <div className="md:hidden bg-green-dark border-t border-white/10 px-4 py-4 flex flex-col gap-4">
          <Link to="/listings" onClick={closeMobileMenu} className="text-green-tint-2 text-sm no-underline">
            Browse
          </Link>
          <Link to="/#how-it-works" onClick={closeMobileMenu} className="text-green-tint-2 text-sm no-underline">
            How it works
          </Link>
          <Link
            to="/contact"
            onClick={closeMobileMenu}
            className="flex items-center gap-1.5 self-start bg-white/10 text-white text-[13px] font-medium px-3 py-2 rounded-lg border border-white/30 no-underline"
          >
            <HelpCircle size={16} /> Need help?
          </Link>

          {isAuthenticated && (
            <>
              <div className="border-t border-white/10" />
              <Link
                to={user.role === "admin" ? "/admin" : "/dashboard"}
                onClick={closeMobileMenu}
                className="flex items-center gap-2 text-white text-sm no-underline"
              >
                <span className="relative">
                  <Avatar src={user.photo_url} name={user.name} className="w-7 h-7 text-[10px]" />
                  <AttentionDot count={pending} />
                </span>
                {user.name}
              </Link>
              <button
                onClick={handleLogout}
                className="bg-transparent text-green-tint-2 text-[13px] font-medium px-4 py-2 rounded-lg border border-[rgba(168,230,190,0.4)] cursor-pointer self-start"
              >
                Log Out
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
