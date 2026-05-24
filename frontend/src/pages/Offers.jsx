import React, { useState, useEffect } from "react";
import { getOffers, getOfferCategories } from "../api";
import { Search, MapPin, Clock, Info, ShoppingBag, Coffee, CupSoda, Apple, Carrot, Milk, Zap, X, Ticket, ChevronRight } from "lucide-react";
import { differenceInMilliseconds, differenceInHours, format } from "date-fns";
import toast from "react-hot-toast";

// Helper for category gradients & icons
const getCategoryStyles = (category) => {
  const styles = {
    "Groceries": { bg: "from-emerald-400 to-green-500", icon: Apple },
    "Dairy": { bg: "from-blue-400 to-cyan-500", icon: Milk },
    "Bakery": { bg: "from-amber-400 to-orange-500", icon: Coffee },
    "Beverages": { bg: "from-purple-400 to-indigo-500", icon: CupSoda },
    "Vegetables": { bg: "from-green-400 to-emerald-600", icon: Carrot },
    "Default": { bg: "from-[#782B90] to-[#4A1A5C]", icon: ShoppingBag }
  };
  return styles[category] || styles["Default"];
};

// Live countdown component
const CountdownTimer = ({ targetDate, compact = false }) => {
  const [timeLeft, setTimeLeft] = useState("");
  
  useEffect(() => {
    const timer = setInterval(() => {
      const ms = differenceInMilliseconds(new Date(targetDate), new Date());
      if (ms <= 0) {
        setTimeLeft("Expired");
        clearInterval(timer);
        return;
      }
      
      const hours = Math.floor(ms / (1000 * 60 * 60));
      const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((ms % (1000 * 60)) / 1000);
      
      if (compact) {
        setTimeLeft(`${hours}h ${mins}m`);
      } else {
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [targetDate, compact]);

  return <span>{timeLeft}</span>;
};

export const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isNearMe, setIsNearMe] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState(null);

  useEffect(() => {
    const fetchOffersData = async () => {
      setIsLoading(true);
      try {
        const [offersData, categoriesData] = await Promise.all([
          getOffers(isNearMe ? "nearest_store_id" : null, selectedCategory), // Mocking nearest store ID
          getOfferCategories()
        ]);
        const offersArr = Array.isArray(offersData) ? offersData : (offersData?.offers || []);
        setOffers(offersArr);
        const catsArr = Array.isArray(categoriesData) ? categoriesData : [];
        setCategories(catsArr.map(c => c.name));
      } catch (err) {
        console.error("Error fetching offers", err);
        toast.error("Failed to load offers");
      } finally {
        setIsLoading(false);
      }
    };
    fetchOffersData();
  }, [selectedCategory, isNearMe]);

  const now = new Date();
  const endingSoonOffers = offers.filter(o => differenceInHours(new Date(o.valid_until), now) < 24);
  const regularOffers = offers.filter(o => differenceInHours(new Date(o.valid_until), now) >= 24);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 pb-24 md:py-8 space-y-6 animate-fade-in font-sans">
      
      {/* Header */}
      <div className="flex flex-col space-y-1">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Offers & Deals</h1>
        <p className="text-slate-500 font-medium text-sm">Save more every time you shop with SAVOmart</p>
      </div>

      {/* Filter Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex overflow-x-auto hide-scrollbar space-x-2 pb-2">
          {["All", ...categories].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-bold border transition-all duration-200 ${
                selectedCategory === cat 
                ? "bg-[#782B90] text-white border-[#782B90] shadow-sm" 
                : "bg-white text-[#782B90] border-[#782B90] hover:bg-purple-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        {/* Near Me Toggle */}
        <button 
          onClick={() => setIsNearMe(!isNearMe)}
          className={`shrink-0 flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
            isNearMe ? "bg-[#FFF200] text-[#782B90] border-[#FFF200] shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Near Me</span>
        </button>
      </div>

      {isLoading ? (
        /* Shimmer Loading Skeleton */
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 h-64 overflow-hidden animate-pulse">
              <div className="h-24 bg-slate-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-full" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : offers.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 flex flex-col items-center justify-center min-h-[40vh]">
          <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center mb-4">
            <Search className="w-10 h-10 text-purple-200" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No offers in this category</h3>
          <p className="text-sm text-slate-500 mt-1">Check back later or browse other categories for amazing deals.</p>
        </div>
      ) : (
        <div className="space-y-8 mt-4">
          
          {/* Ending Soon Section */}
          {endingSoonOffers.length > 0 && (
            <section className="bg-red-50/50 p-4 rounded-3xl border border-red-100">
              <div className="flex items-center space-x-2 mb-4 px-2">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </div>
                <h2 className="text-lg font-extrabold text-red-600">Ending Soon</h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {endingSoonOffers.map(offer => <OfferCard key={offer.id} offer={offer} onClick={() => setSelectedOffer(offer)} />)}
              </div>
            </section>
          )}

          {/* Regular Offers Grid */}
          {regularOffers.length > 0 && (
            <section>
              <h2 className="text-lg font-extrabold text-slate-800 mb-4 px-2">All Active Offers</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {regularOffers.map(offer => <OfferCard key={offer.id} offer={offer} onClick={() => setSelectedOffer(offer)} />)}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Offer Detail Modal */}
      {selectedOffer && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:px-4"
          onClick={() => setSelectedOffer(null)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden animate-slide-up sm:animate-scale-up shadow-2xl relative max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            
            {/* Colored Banner Header */}
            <div className={`relative h-40 bg-gradient-to-r ${getCategoryStyles(selectedOffer.category).bg} flex items-center justify-center p-6 text-white`}>
              <button 
                onClick={() => setSelectedOffer(null)}
                className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              
              <div className="absolute -bottom-6 right-6 w-16 h-16 bg-[#FFF200] rounded-full border-4 border-white shadow-lg flex items-center justify-center rotate-12">
                <span className="text-[#782B90] font-extrabold text-sm text-center leading-tight">
                  {selectedOffer.discount_type === 'percentage' ? `${Math.round(selectedOffer.discount_value)}%\nOFF` : `₹${Math.round(selectedOffer.discount_value)}\nOFF`}
                </span>
              </div>
              
              {selectedOffer.image_url ? (
                <img src={selectedOffer.image_url} alt={selectedOffer.title} className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay" />
              ) : (
                <Zap className="w-16 h-16 opacity-30" />
              )}
            </div>
            
            {/* Content Body */}
            <div className="p-6 overflow-y-auto pb-24 sm:pb-6">
              <div className="inline-block px-2 py-1 bg-purple-50 text-[#782B90] text-xs font-bold rounded mb-3 uppercase tracking-wider">
                {selectedOffer.category}
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 leading-tight mb-2">
                {selectedOffer.title}
              </h2>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                {selectedOffer.description}
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3 text-sm font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <span>Valid until {format(new Date(selectedOffer.valid_until), "MMM dd, yyyy")}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <MapPin className="w-5 h-5 text-emerald-500" />
                  <span>{selectedOffer.store_name || "Available at all locations"}</span>
                </div>
                {selectedOffer.min_purchase > 0 && (
                  <div className="flex items-center space-x-3 text-sm font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <ShoppingBag className="w-5 h-5 text-[#782B90]" />
                    <span>Min. purchase ₹{selectedOffer.min_purchase} required</span>
                  </div>
                )}
              </div>

              {/* QR Code Placeholder */}
              <div className="border border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50">
                <div className="w-32 h-32 bg-white border border-slate-200 shadow-sm rounded-xl flex items-center justify-center p-2 mb-3">
                  <div className="w-full h-full bg-slate-900 rounded opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)' }}></div>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Scan at Cashier<br/>(Coming Soon)</p>
              </div>
            </div>

            {/* Fixed Bottom Action Area */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100">
              <button 
                onClick={() => {
                  toast.success("Added to your coupons!");
                  setSelectedOffer(null);
                }}
                className="w-full bg-[#FFF200] hover:bg-yellow-400 text-[#4A1A5C] font-extrabold py-3.5 rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2"
              >
                <Ticket className="w-5 h-5" />
                <span>Add to My Coupons</span>
              </button>
            </div>
          </div>
        </div>
      )}
      <style>
        {`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
          @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        `}
      </style>
    </div>
  );
};

// Subcomponent: Offer Card
const OfferCard = ({ offer, onClick }) => {
  const { bg, icon: Icon } = getCategoryStyles(offer.category);
  const isExpiringSoon = differenceInHours(new Date(offer.valid_until), new Date()) < 48;

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col cursor-pointer hover:border-[#782B90] hover:shadow-md transition-all group"
    >
      {/* Banner */}
      <div className={`h-20 sm:h-24 bg-gradient-to-br ${bg} relative p-3 sm:p-4 flex items-start justify-between`}>
        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#FFF200] border-2 border-white shadow-sm flex items-center justify-center rotate-12 group-hover:rotate-0 transition-transform">
          <span className="text-[#4A1A5C] font-extrabold text-[10px] sm:text-xs text-center leading-none">
            {offer.discount_type === 'percentage' ? `${Math.round(offer.discount_value)}%\nOFF` : `₹${Math.round(offer.discount_value)}\nOFF`}
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-tight mb-1 line-clamp-2">
          {offer.title}
        </h3>
        <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
          {offer.description}
        </p>
        
        <div className="mt-auto space-y-2">
          <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded inline-flex">
            <MapPin className="w-3 h-3" />
            <span className="truncate max-w-[100px] sm:max-w-[150px]">{offer.store_name || "All Stores"}</span>
          </div>
          
          <div className={`flex items-center justify-between text-[10px] sm:text-[11px] font-bold border-t border-slate-100 pt-2 ${isExpiringSoon ? 'text-red-500' : 'text-slate-500'}`}>
            <div className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              {isExpiringSoon ? (
                <span>Ends in <CountdownTimer targetDate={offer.valid_until} compact={true} /></span>
              ) : (
                <span>Valid till {format(new Date(offer.valid_until), "dd MMM")}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Offers;
