import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, HelpCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import Avatar from "./Avatar";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
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
          <Link to="/contact" title="Help"
            className="text-green-tint-2 hover:text-white transition-colors no-underline flex items-center">
            <HelpCircle size={18} />
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to={user.role === "admin" ? "/admin" : "/dashboard"}
                className="flex items-center gap-2 text-white text-sm no-underline"
              >
                <Avatar src={user.photo_url} name={user.name} className="w-7 h-7 text-[10px]" />
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
              <Link to="/login" className="text-white text-sm no-underline">
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-orange text-white text-[13px] font-medium px-4 py-2 rounded-lg no-underline"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Hamburger — mobile only */}
        <button
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          className="md:hidden text-white p-1 bg-transparent border-none cursor-pointer"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
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
          <Link to="/contact" onClick={closeMobileMenu} className="text-green-tint-2 text-sm no-underline flex items-center gap-1.5">
            <HelpCircle size={15} /> Help
          </Link>

          <div className="border-t border-white/10" />

          {isAuthenticated ? (
            <>
              <Link
                to={user.role === "admin" ? "/admin" : "/dashboard"}
                onClick={closeMobileMenu}
                className="flex items-center gap-2 text-white text-sm no-underline"
              >
                <Avatar src={user.photo_url} name={user.name} className="w-7 h-7 text-[10px]" />
                {user.name}
              </Link>
              <button
                onClick={handleLogout}
                className="bg-transparent text-green-tint-2 text-[13px] font-medium px-4 py-2 rounded-lg border border-[rgba(168,230,190,0.4)] cursor-pointer self-start"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={closeMobileMenu} className="text-white text-sm no-underline">
                Login
              </Link>
              <Link
                to="/signup"
                onClick={closeMobileMenu}
                className="bg-orange text-white text-[13px] font-medium px-4 py-2 rounded-lg no-underline text-center"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
