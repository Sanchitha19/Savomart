import React, { useState, useEffect } from "react";
import { Calendar, MapPin, Tag, QrCode, X, Clock } from "lucide-react";
import { format, differenceInSeconds } from "date-fns";

export const OfferCard = ({ offer }) => {
  const [showBarcode, setShowBarcode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);

  const {
    id,
    title,
    description,
    discount_type,
    discount_value,
    category,
    store_name,
    valid_until,
    image_url,
    min_purchase,
    max_discount,
  } = offer;

  // Formatting date safely
  const formattedExpiry = () => {
    try {
      return format(new Date(valid_until), "dd MMM yyyy");
    } catch (e) {
      return "Limited Time";
    }
  };

  useEffect(() => {
    const checkExpiry = () => {
      try {
        const expiryDate = new Date(valid_until);
        const seconds = differenceInSeconds(expiryDate, new Date());
        
        if (seconds > 0 && seconds <= 24 * 60 * 60) {
          setIsExpiringSoon(true);
          const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
          const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
          const s = (seconds % 60).toString().padStart(2, '0');
          setTimeLeft(`${h}:${m}:${s}`);
        } else {
          setIsExpiringSoon(false);
          setTimeLeft(null);
        }
      } catch (e) {
        setIsExpiringSoon(false);
      }
    };

    checkExpiry();
    const timer = setInterval(checkExpiry, 1000);
    return () => clearInterval(timer);
  }, [valid_until]);

  // Determine category color badges
  const categoryStyles = {
    Groceries: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Dairy: "bg-blue-50 text-blue-700 border-blue-200",
    Bakery: "bg-amber-50 text-amber-700 border-amber-200",
    Beverages: "bg-purple-50 text-savomart-purple border-purple-200",
    "Personal Care": "bg-pink-50 text-pink-700 border-pink-200",
    "Frozen Foods": "bg-cyan-50 text-cyan-700 border-cyan-200",
    Bonus: "bg-red-50 text-red-700 border-red-200",
  };

  const currentCategoryStyle =
    categoryStyles[category] || "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <>
      <div className={`group bg-white rounded-2xl overflow-hidden border shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full hover:scale-[1.01] ${isExpiringSoon ? 'border-red-300 shadow-red-100' : 'border-savomart-purple/10'}`}>
        {/* Offer Image Header */}
        <div className="relative h-44 w-full overflow-hidden bg-slate-100">
          <img
            src={image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=60"}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Category Tag */}
          <span className={`absolute top-3 left-3 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${currentCategoryStyle} shadow-sm backdrop-blur-md bg-opacity-90`}>
            {category}
          </span>

          {/* Discount Ribbon */}
          <div className="absolute bottom-3 left-3 flex items-baseline space-x-0.5">
            <span className="text-white text-2xl font-extrabold tracking-tight drop-shadow-md">
              {discount_type === "percentage" ? `${Math.round(discount_value)}%` : `₹${Math.round(discount_value)}`}
            </span>
            <span className="text-savomart-yellow text-xs font-bold uppercase tracking-wider drop-shadow-md">
              Off
            </span>
          </div>
        </div>

        {/* Content body */}
        <div className="p-4 flex flex-col flex-1 justify-between">
          <div>
            <h4 className="font-bold text-slate-800 text-base leading-tight mb-1.5 group-hover:text-savomart-purple transition-colors">
              {title}
            </h4>
            <p className="text-xs text-slate-500 line-clamp-2 mb-3">
              {description}
            </p>
          </div>

          <div className="space-y-2.5 pt-3 border-t border-slate-100">
            {/* Meta terms */}
            <div className="flex flex-wrap gap-y-1.5 justify-between text-[11px] text-slate-500 font-medium">
              <div className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-savomart-purple shrink-0" />
                <span className="truncate max-w-[140px]">{store_name || "All Stores"}</span>
              </div>
              
              {isExpiringSoon && timeLeft ? (
                <div className="flex items-center space-x-1 text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-100">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  <span>Ends in {timeLeft}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Expires {formattedExpiry()}</span>
                </div>
              )}
            </div>

            {/* Min purchase/max discount details */}
            <div className="flex justify-between items-center text-[10px] bg-slate-50 px-2 py-1 rounded-md text-slate-500">
              <span>Min. Order: ₹{min_purchase}</span>
              {max_discount && <span>Max. Savings: ₹{max_discount}</span>}
            </div>

            {/* Action Claim Button */}
            <button
              onClick={() => setShowBarcode(true)}
              className="w-full mt-2 bg-savomart-purple hover:bg-savomart-purple-dark text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <QrCode className="w-4 h-4 text-savomart-yellow" />
              <span>Redeem Coupon Code</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barcode Display Modal */}
      {showBarcode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-savomart-purple/20 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setShowBarcode(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pt-2">
              <div className="inline-flex p-3 rounded-full bg-savomart-purple-light text-savomart-purple mb-4">
                <Tag className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-lg mb-1">{title}</h3>
              <p className="text-xs text-slate-500 px-4 mb-5 leading-relaxed">{description}</p>

              {/* Barcode Mockup */}
              <div className="bg-[#F8F4FA] p-6 rounded-xl border border-savomart-purple/10 flex flex-col items-center">
                <div className="bg-white px-5 py-4 rounded-lg shadow-sm border border-slate-100 flex flex-col items-center">
                  {/* Styled mock barcode lines */}
                  <div className="flex space-x-[2px] items-center h-14 w-48 mb-2">
                    <div className="w-[3px] bg-black h-full" />
                    <div className="w-[1px] bg-black h-full" />
                    <div className="w-[4px] bg-black h-full" />
                    <div className="w-[2px] bg-black h-full" />
                    <div className="w-[1px] bg-black h-full" />
                    <div className="w-[3px] bg-black h-full" />
                    <div className="w-[2px] bg-black h-full" />
                    <div className="w-[1px] bg-black h-full" />
                    <div className="w-[4px] bg-black h-full" />
                    <div className="w-[2px] bg-black h-full" />
                    <div className="w-[3px] bg-black h-full" />
                    <div className="w-[1px] bg-black h-full" />
                    <div className="w-[2px] bg-black h-full" />
                    <div className="w-[4px] bg-black h-full" />
                  </div>
                  <span className="font-mono text-xs tracking-[4px] text-slate-500 font-bold">
                    OFFER-{id}X{Math.round(discount_value)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-3 uppercase tracking-wider font-semibold">
                  Valid at checkout counter
                </p>
              </div>

              <div className="mt-5 text-[11px] text-slate-400">
                Expires on {formattedExpiry()} • Valid for {store_name || "All Stores"}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OfferCard;
