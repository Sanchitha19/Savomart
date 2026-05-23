import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Home, Percent, MapPin, LifeBuoy, User as UserIcon } from "lucide-react";

export const Navbar = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || location.pathname === "/login") return null;

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: "/", label: "Home", icon: Home },
    { path: "/offers", label: "Offers", icon: Percent },
    { path: "/stores", label: "Stores", icon: MapPin },
    { path: "/support", label: "Support", icon: LifeBuoy },
    { path: "/profile", label: "Profile", icon: UserIcon },
  ];

  return (
    <nav className="hidden md:block sticky top-0 z-40 bg-[#782B90] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2 group">
          <span className="font-extrabold text-2xl tracking-tight text-white">
            SAVO<span className="text-savomart-yellow">mart</span>
          </span>
        </Link>

        {/* Navigation Items */}
        <div className="flex items-center space-x-1">
          {navLinks.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                isActive(path)
                  ? "bg-savomart-yellow text-[#782B90] shadow-sm"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </Link>
          ))}
        </div>

        {/* User Card */}
        <div className="flex items-center">
          {user && (
            <Link to="/profile" className="flex items-center justify-center w-10 h-10 rounded-full bg-savomart-yellow text-[#782B90] font-extrabold text-lg shadow-sm hover:scale-105 transition-transform">
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
