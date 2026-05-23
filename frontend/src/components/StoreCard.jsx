import React from "react";
import { MapPin, Phone, Clock, Navigation } from "lucide-react";

function isStoreOpen(openingTime, closingTime) {
  try {
    const now = new Date();
    const parseTime = (timeStr) => {
      const [time, modifier] = timeStr.split(" ");
      let [hours, minutes] = time.split(":").map(Number);
      if (modifier === "PM" && hours !== 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;
      const d = new Date();
      d.setHours(hours, minutes || 0, 0, 0);
      return d;
    };
    const open = parseTime(openingTime);
    const close = parseTime(closingTime);
    return now >= open && now <= close;
  } catch {
    return null; // unknown
  }
}

export const StoreCard = ({ store, onSelect, isActive }) => {
  const { name, address, phone, email, opening_time, closing_time, distance, city } = store;
  const openStatus = isStoreOpen(opening_time, closing_time);

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer group ${
        isActive
          ? "bg-savomart-purple-light/40 border-savomart-purple shadow-md ring-1 ring-savomart-purple/20"
          : "bg-white border-savomart-purple/10 hover:border-savomart-purple/30 hover:shadow-md"
      }`}
    >
      {/* Header row */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-800 text-sm md:text-base tracking-tight leading-tight truncate">
            {name}
          </h4>
          {city && (
            <span className="text-[10px] text-slate-400 font-medium">{city}</span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {distance !== undefined && (
            <span className="bg-savomart-purple text-savomart-yellow text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
              {distance} km
            </span>
          )}
          {openStatus !== null && (
            <span
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                openStatus
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  : "bg-rose-50 text-rose-500 border border-rose-200"
              }`}
            >
              {openStatus ? "● Open Now" : "● Closed"}
            </span>
          )}
        </div>
      </div>

      {/* Address */}
      <p className="text-xs text-slate-500 mt-2 flex items-start space-x-1">
        <MapPin className="w-3.5 h-3.5 text-savomart-purple shrink-0 mt-0.5" />
        <span className="leading-relaxed">{address}</span>
      </p>

      {/* Hours & Phone */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
        <div className="flex items-center space-x-1.5 col-span-2">
          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>{opening_time} – {closing_time}</span>
        </div>
        {phone && (
          <div className="flex items-center space-x-1.5 col-span-2">
            <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <a
              href={`tel:${phone}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:text-savomart-purple hover:underline transition-colors"
            >
              {phone}
            </a>
          </div>
        )}
      </div>

      {/* Action row */}
      <div className="flex items-center justify-between mt-3 pt-2">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center space-x-1 text-[11px] font-bold text-savomart-purple hover:text-savomart-purple-dark bg-savomart-purple-light/60 group-hover:bg-savomart-purple-light px-3 py-1.5 rounded-lg transition-colors active-scale"
        >
          <Navigation className="w-3 h-3" />
          <span>Directions</span>
        </a>
        {phone && (
          <a
            href={`tel:${phone}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center space-x-1 text-[11px] font-bold text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Phone className="w-3 h-3" />
            <span>Call</span>
          </a>
        )}
      </div>
    </div>
  );
};

export default StoreCard;
