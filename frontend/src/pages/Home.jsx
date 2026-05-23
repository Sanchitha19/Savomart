import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getStats, getCoupons, getPointsHistory, getOffers } from "../api";
import { Award, Ticket, Calendar, Clock, Plus, Minus, Tag, ChevronRight, Copy, Loader2, Star, Zap, Gift, RefreshCw } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import toast from "react-hot-toast";

// Simple animated counter component
const AnimatedCounter = ({ value, duration = 1500 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const stepTime = Math.abs(Math.floor(duration / value));
    
    // Safety check for 0
    if (value === 0) return;

    const timer = setInterval(() => {
      start += Math.ceil(value / (duration / 50));
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 50);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count.toLocaleString()}</span>;
};

// Time-aware greeting
const getGreeting = (name) => {
  const hour = new Date().getHours();
  const firstName = name ? name.split(" ")[0] : "";
  if (hour >= 5 && hour < 12) return `Good morning, ${firstName}! ☀️`;
  if (hour >= 12 && hour < 17) return `Good afternoon, ${firstName}! 👋`;
  if (hour >= 17 && hour < 21) return `Good evening, ${firstName}! 🌅`;
  return `Good night, ${firstName}! 🌙`;
};

// Confetti Effect
const triggerConfetti = () => {
  const colors = ['#FFF200', '#782B90', '#F3E8F7', '#4A1A5C'];
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.classList.add('confetti');
    confetti.style.left = `${Math.random() * 100}vw`;
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDuration = `${Math.random() * 2 + 1}s`;
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 3000);
  }
};

export const Home = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [stats, setStats] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [offers, setOffers] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [copiedCoupon, setCopiedCoupon] = useState(null); // Track copied code
  const [calcAmount, setCalcAmount] = useState("");
  const [showCalculator, setShowCalculator] = useState(false);
  
  const pullStartY = useRef(0);
  const scrollBoxRef = useRef(null);

  const fetchData = async () => {
    try {
      const [statsData, couponsData, pointsData, offersData] = await Promise.all([
        getStats(),
        getCoupons(),
        getPointsHistory(5),
        getOffers()
      ]);
      setStats(statsData);
      setCoupons(couponsData.filter(c => !c.is_used));
      setTransactions(pointsData);
      setOffers(offersData.slice(0, 4)); // Show 4 offers max
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      toast.error("Error loading dashboard data.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setPullProgress(0);
    }
  };

  useEffect(() => {
    fetchData();
    // Check for confetti URL param
    if (searchParams.get("earned") === "true") {
      triggerConfetti();
      searchParams.delete("earned");
      setSearchParams(searchParams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pull to refresh logic
  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      pullStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (window.scrollY === 0 && pullStartY.current > 0) {
      const pullDistance = e.touches[0].clientY - pullStartY.current;
      if (pullDistance > 0) {
        const progress = Math.min(pullDistance / 100, 1);
        setPullProgress(progress);
        if (progress > 0.8 && !isRefreshing) {
          setIsRefreshing(true);
          fetchData();
        }
      }
    }
  };

  const handleTouchEnd = () => {
    pullStartY.current = 0;
    if (!isRefreshing) {
      setPullProgress(0);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-savomart-purple" />
      </div>
    );
  }

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied!");
    setCopiedCoupon(code);
    setTimeout(() => {
      setCopiedCoupon(null);
    }, 2000);
  };

  return (
    <div 
      className="max-w-md mx-auto md:max-w-3xl pb-24 min-h-screen relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <style>
        {`
          .confetti {
            position: fixed;
            top: -10px;
            width: 8px;
            height: 16px;
            border-radius: 4px;
            z-index: 9999;
            animation: fall linear forwards;
          }
          @keyframes fall {
            to { transform: translateY(100vh) rotate(720deg); }
          }
          .hide-scrollbar::-webkit-scrollbar { display: none; }
        `}
      </style>

      {/* Pull to refresh indicator */}
      <div 
        className="fixed top-16 left-0 right-0 flex justify-center z-50 transition-transform duration-200"
        style={{ transform: `translateY(${isRefreshing ? '20px' : pullProgress * 40 - 40}px)`, opacity: isRefreshing || pullProgress > 0 ? 1 : 0 }}
      >
        <div className="bg-white rounded-full p-2 shadow-lg border border-slate-100">
          <RefreshCw className={`w-5 h-5 text-savomart-purple ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullProgress * 180}deg)` }} />
        </div>
      </div>

      <div className="px-4 pt-6 space-y-8">
        {/* SECTION 1 — HERO POINTS CARD */}
        <section>
          <div className="w-full rounded-3xl bg-gradient-to-br from-[#782B90] to-[#4A1A5C] p-6 text-white shadow-xl relative overflow-hidden">
            {/* Texture overlay */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] bg-[length:16px_16px]"></div>
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <span className="text-white/80 text-sm font-semibold mb-1">
                {getGreeting(user?.name)}
              </span>
              <div className="text-5xl font-extrabold text-[#FFF200] tracking-tight drop-shadow-md my-2 flex items-baseline justify-center">
                <AnimatedCounter value={stats?.points_balance || 0} />
              </div>
              <span className="text-white/90 text-xs font-bold uppercase tracking-wider mb-6">
                SAVOmart Points
              </span>

              <div className="w-full bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-1.5 bg-white/20 px-2 py-1 rounded-lg">
                    <Star className="w-3.5 h-3.5 text-[#FFF200]" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wide">{stats?.tier} Tier</span>
                  </div>
                  <span className="text-xs text-white/80 font-medium">
                    {stats?.points_to_next_tier > 0 ? `${stats?.points_to_next_tier} points to ${stats?.next_tier}` : 'Max Tier Reached!'}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden relative">
                  <div 
                    className="absolute top-0 left-0 h-full bg-[#FFF200] rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${stats?.tier_progress || 0}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2 — QUICK STATS ROW */}
        <section className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm border-l-4 border-l-[#782B90] flex flex-col items-center text-center">
            <Ticket className="w-5 h-5 text-[#782B90] mb-1" />
            <span className="text-lg font-extrabold text-slate-800">{stats?.coupons_count || 0}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Active<br/>Coupons</span>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm border-l-4 border-l-[#782B90] flex flex-col items-center text-center">
            <Calendar className="w-5 h-5 text-[#782B90] mb-1" />
            <span className="text-lg font-extrabold text-slate-800">{stats?.member_since_days || 0}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Days<br/>With Us</span>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm border-l-4 border-l-[#782B90] flex flex-col items-center text-center">
            <Award className="w-5 h-5 text-[#782B90] mb-1" />
            <span className="text-lg font-extrabold text-slate-800">
              {(stats?.total_points_earned || 0) > 999 
                ? `${((stats?.total_points_earned || 0) / 1000).toFixed(1)}k` 
                : stats?.total_points_earned || 0}
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">All Time<br/>Earned</span>
          </div>
        </section>

        {/* SECTION 3 — ACTIVE COUPONS PREVIEW */}
        <section>
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="font-extrabold text-slate-800 text-lg">Your Coupons</h3>
            <Link to="/profile" className="text-sm font-bold text-[#782B90] flex items-center hover:underline">
              See All <ChevronRight className="w-4 h-4 ml-0.5" />
            </Link>
          </div>
          
          <div className="flex overflow-x-auto hide-scrollbar space-x-4 pb-2 -mx-4 px-4 snap-x">
            {coupons.length === 0 ? (
              <div className="min-w-[280px] bg-white p-6 rounded-2xl border border-slate-100 text-center shadow-sm w-full">
                <p className="text-sm font-semibold text-slate-500">No active coupons right now.</p>
              </div>
            ) : (
              coupons.map((coupon) => {
                const daysLeft = differenceInDays(new Date(coupon.expiry_date), new Date());
                const isExpiringSoon = daysLeft <= 3;
                
                return (
                  <div key={coupon.id} className="min-w-[280px] snap-center shrink-0 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col relative">
                    <div className="absolute top-0 bottom-0 left-0 w-2 bg-[#782B90]"></div>
                    <div className="p-4 pl-6 border-b border-dashed border-slate-200 relative">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-mono text-sm font-bold bg-[#FFF200] text-[#4A1A5C] px-2 py-1 rounded">
                          {coupon.code}
                        </span>
                        <button 
                          onClick={() => handleCopyCode(coupon.code)}
                          className={`p-1.5 rounded-lg transition-all active-scale ${copiedCoupon === coupon.code ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400 hover:text-[#782B90] bg-slate-50'}`}
                        >
                          {copiedCoupon === coupon.code ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <h4 className="font-bold text-slate-800 leading-tight mb-1">{coupon.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1">{coupon.description}</p>
                    </div>
                    <div className="px-4 py-3 bg-slate-50 flex items-center justify-between">
                      <div className={`flex items-center space-x-1.5 text-[11px] font-bold ${isExpiringSoon ? 'text-red-500' : 'text-slate-500'}`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>Expires {format(new Date(coupon.expiry_date), "MMM dd")}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Tap to copy</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* SECTION 4 — FEATURED OFFERS */}
        <section>
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="font-extrabold text-slate-800 text-lg">Today's Offers</h3>
            <Link to="/offers" className="text-sm font-bold text-[#782B90] flex items-center hover:underline">
              See All <ChevronRight className="w-4 h-4 ml-0.5" />
            </Link>
          </div>
          
          <div className="flex overflow-x-auto hide-scrollbar space-x-4 pb-4 -mx-4 px-4 snap-x">
            {offers.length === 0 ? (
              <div className="min-w-[200px] bg-white p-6 rounded-2xl border border-slate-100 text-center shadow-sm">
                <p className="text-sm font-semibold text-slate-500">More offers coming soon!</p>
              </div>
            ) : (
              offers.map((offer) => (
                <div key={offer.id} className="min-w-[220px] snap-center shrink-0 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                  {offer.image_url ? (
                    <div className="h-28 w-full bg-slate-200 relative overflow-hidden">
                      <img src={offer.image_url} alt={offer.title} className="object-cover w-full h-full" />
                      <div className="absolute top-2 left-2 bg-[#782B90] text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-sm">
                        {offer.category}
                      </div>
                    </div>
                  ) : (
                    <div className="h-28 w-full bg-gradient-to-br from-indigo-100 to-purple-100 relative overflow-hidden flex items-center justify-center">
                      <Gift className="w-10 h-10 text-purple-300 opacity-50" />
                      <div className="absolute top-2 left-2 bg-[#782B90] text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-sm">
                        {offer.category}
                      </div>
                    </div>
                  )}
                  <div className="p-3">
                    <h4 className="font-bold text-slate-800 text-sm leading-tight mb-1 line-clamp-1">{offer.title}</h4>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[#782B90] font-extrabold text-sm">
                        {offer.discount_type === 'percentage' ? `${offer.discount_value}% OFF` : `₹${offer.discount_value} OFF`}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        Until {format(new Date(offer.valid_until), "dd/MM")}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* SECTION 5 — POINTS HISTORY */}
        <section className="pb-4">
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="font-extrabold text-slate-800 text-lg">Recent Activity</h3>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {transactions.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm font-semibold text-slate-500">No activity yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {transactions.map((tx) => {
                  const isEarned = tx.points >= 0;
                  return (
                    <div key={tx.id} className="p-4 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          isEarned ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        }`}>
                          {isEarned ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm leading-tight mb-0.5">
                            {tx.description}
                          </p>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {format(new Date(tx.created_at), "dd MMM, hh:mm a")}
                          </span>
                        </div>
                      </div>
                      <div className={`font-extrabold text-sm ${isEarned ? "text-emerald-600" : "text-rose-600"}`}>
                        {isEarned ? "+" : ""}{tx.points} pts
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <Link to="/profile" className="text-xs font-bold text-[#782B90] hover:underline">
                View all activity
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Floating Points Calculator */}
      <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end pointer-events-none">
        {showCalculator && (
          <div className="bg-white rounded-2xl shadow-xl border border-savomart-purple/10 p-4 mb-3 w-64 animate-fade-in pointer-events-auto">
            <h4 className="font-bold text-sm text-slate-800 mb-2">How many points will I earn?</h4>
            <div className="flex gap-2 mb-3">
              <span className="bg-slate-100 text-slate-500 px-3 py-2 rounded-xl text-sm font-bold border border-slate-200 flex items-center">₹</span>
              <input 
                type="number" 
                placeholder="Enter amount"
                value={calcAmount}
                onChange={(e) => setCalcAmount(e.target.value)}
                className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-savomart-purple focus:ring-1 focus:ring-savomart-purple/20"
              />
            </div>
            <div className="bg-savomart-purple-light/20 p-2.5 rounded-xl border border-savomart-purple/10 text-center">
              <span className="text-xs text-slate-500 font-bold block mb-1">Estimated Points</span>
              <span className="text-lg font-extrabold text-savomart-purple">
                +{calcAmount ? Math.floor(Number(calcAmount) / 10) : 0} <span className="text-xs">pts</span>
              </span>
            </div>
          </div>
        )}
        <button 
          onClick={() => setShowCalculator(!showCalculator)}
          className="pointer-events-auto bg-savomart-yellow text-savomart-purple shadow-lg rounded-full w-12 h-12 flex items-center justify-center hover:bg-savomart-yellow-dark transition-all active-scale border border-savomart-yellow-dark/50"
        >
          <Award className="w-6 h-6 fill-current" />
        </button>
      </div>
    </div>
  );
};

export default Home;
