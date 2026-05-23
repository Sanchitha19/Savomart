import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Home, Percent, MapPin, LifeBuoy, User } from "lucide-react";

export const BottomNav = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || location.pathname === "/login") return null;

  const isActive = (path) => location.pathname === path;

  const tabs = [
    { path: "/", label: "Home", icon: Home },
    { path: "/offers", label: "Offers", icon: Percent },
    { path: "/stores", label: "Stores", icon: MapPin },
    { path: "/support", label: "Support", icon: LifeBuoy },
    { path: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map(({ path, label, icon: Icon }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              className="relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-300 group"
            >
              <div className={`relative p-1 rounded-xl transition-all duration-300 ${active ? 'transform -translate-y-1' : ''}`}>
                <Icon 
                  className={`w-6 h-6 transition-colors duration-300 ${
                    active ? "text-[#782B90]" : "text-slate-400 group-hover:text-slate-600"
                  }`} 
                  strokeWidth={active ? 2.5 : 2}
                />
              </div>
              <span 
                className={`text-[10px] font-bold tracking-wide transition-all duration-300 ${
                  active ? "text-[#782B90] opacity-100" : "text-slate-400 opacity-0 group-hover:opacity-100"
                } absolute bottom-1`}
              >
                {label}
              </span>
              
              {/* Yellow Dot Indicator */}
              <div 
                className={`absolute bottom-[-2px] w-1.5 h-1.5 rounded-full bg-savomart-yellow transition-all duration-300 ${
                  active ? "opacity-100 scale-100" : "opacity-0 scale-0"
                }`}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
