import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  List,
  CalendarCheck,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import Avatar from "./Avatar";

const ADMIN_LINKS = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Users", path: "/admin/users", icon: Users },
  { label: "Listings", path: "/admin/listings", icon: List },
  { label: "Bookings", path: "/admin/bookings", icon: CalendarCheck },
  { label: "Disputes", path: "/admin/disputes", icon: AlertTriangle },
];

export default function AdminTopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <nav className="bg-green-dark sticky top-0 z-50 h-14">
      <div className="max-w-[1280px] mx-auto h-full px-6 flex items-center gap-6">

        <Link to="/admin" className="flex items-center gap-2.5 no-underline shrink-0">
          <span className="text-white font-medium text-lg tracking-[-0.3px]">AgroRent</span>
          <span className="text-[11px] font-semibold text-green-dark bg-orange px-[9px] py-[2px] rounded-full tracking-[0.02em]">
            Admin
          </span>
        </Link>

        <div className="flex items-center gap-1 flex-1 justify-center overflow-x-auto">
          {ADMIN_LINKS.map((link) => {
            const Icon = link.icon;
            const active = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-[7px] px-3.5 py-2 rounded-lg text-[13px] no-underline whitespace-nowrap transition-colors duration-150 ${
                  active
                    ? "font-medium text-orange bg-orange/14"
                    : "font-normal text-green-tint-2 hover:bg-white/8"
                }`}
              >
                <Icon size={15} />
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3.5 shrink-0">
          <div className="flex items-center gap-2">
            <Avatar
              src={user?.photo_url || null}
              name={user?.name}
              className="w-7 h-7 text-[9px]"
            />
            <span className="text-white text-[13px]">{user?.name || "Admin"}</span>
          </div>
          <button
            onClick={handleLogout}
            className="bg-transparent text-green-tint-2 text-[13px] font-medium px-3.5 py-[7px] rounded-lg border border-green-tint-2/40 cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </div>
    </nav>
  );
}
