import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getStats, getCoupons, getPointsHistory, updateProfile } from "../api";
import { User, Phone, CheckCircle, Award, Ticket, Clock, Plus, Minus, Settings, Bell, Mail, ShieldAlert, LogOut, ChevronRight, Copy, Loader2, Star, Edit3, X, Share2, Info } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import toast from "react-hot-toast";

// Helper Confetti function
const triggerConfetti = () => {
  const colors = ['#FFF200', '#782B90', '#F3E8F7'];
  for (let i = 0; i < 60; i++) {
    const confetti = document.createElement('div');
    confetti.classList.add('confetti-profile');
    confetti.style.left = `${Math.random() * 100}vw`;
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDuration = `${Math.random() * 2 + 1}s`;
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 3000);
  }
};

export const Profile = () => {
  const { user, logout, login } = useAuth(); // Assume login updates local state
  
  const [stats, setStats] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Tab states
  const [couponTab, setCouponTab] = useState("Active"); // Active, Used, Expired
  const [txFilter, setTxFilter] = useState("All"); // All, Earned, Redeemed
  
  // Pagination
  const [txPage, setTxPage] = useState(1);
  const txPerPage = 10;
  
  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "" });
  
  // Notification State
  const [notifications, setNotifications] = useState({
    offers_alerts: true,
    points_updates: true,
    coupon_expiry: true,
    store_updates: false
  });
  
  // Logout Modal
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [statsData, couponsData, pointsData] = await Promise.all([
          getStats(),
          getCoupons(),
          getPointsHistory(100) // fetch more for pagination
        ]);
        setStats(statsData);
        setCoupons(couponsData);
        setAllTransactions(pointsData);
        
        // Populate edit form
        if (user) {
          setEditForm({ name: user.name || "", email: user.email || "" });
          if (user.notification_preferences) {
            setNotifications(user.notification_preferences);
          }
        }

        // Check for tier upgrade animation
        const prevTier = localStorage.getItem("savomart_last_tier");
        if (prevTier && prevTier !== statsData.tier) {
          // Simple check: if changed, throw confetti!
          triggerConfetti();
          toast.success(`Congratulations! You've reached ${statsData.tier} tier!`, { icon: '🎉' });
        }
        localStorage.setItem("savomart_last_tier", statsData.tier);

      } catch (err) {
        console.error(err);
        toast.error("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfileData();
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const updatedUser = await updateProfile({ ...editForm, notification_preferences: notifications });
      login(localStorage.getItem("savomart_token"), updatedUser); // Update local context
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNotification = async (key) => {
    const newPrefs = { ...notifications, [key]: !notifications[key] };
    setNotifications(newPrefs);
    try {
      // Save instantly
      const updatedUser = await updateProfile({ notification_preferences: newPrefs });
      login(localStorage.getItem("savomart_token"), updatedUser);
    } catch (e) {
      toast.error("Failed to save preference");
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success("Coupon code copied!");
  };

  const handleReferral = () => {
    const refCode = `SAVO-${user?.name?.substring(0,3).toUpperCase()}${user?.id}`;
    navigator.clipboard.writeText(`Join Savomart and get 500 bonus points! Use my code: ${refCode}`);
    toast.success("Referral text copied to clipboard!");
  };

  if (isLoading && !stats) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#782B90]" />
      </div>
    );
  }

  // Derived Data
  const now = new Date();
  const activeCoupons = coupons.filter(c => !c.is_used && new Date(c.expiry_date) > now);
  const usedCoupons = coupons.filter(c => c.is_used);
  const expiredCoupons = coupons.filter(c => !c.is_used && new Date(c.expiry_date) <= now);
  
  const displayCoupons = couponTab === "Active" ? activeCoupons : couponTab === "Used" ? usedCoupons : expiredCoupons;

  const filteredTx = allTransactions.filter(tx => {
    if (txFilter === "Earned") return tx.points > 0;
    if (txFilter === "Redeemed") return tx.points < 0;
    return true;
  });
  
  const txTotalPages = Math.ceil(filteredTx.length / txPerPage);
  const currentTxList = filteredTx.slice((txPage - 1) * txPerPage, txPage * txPerPage);

  const getTierBenefits = (tier) => {
    if (tier === "Platinum") return ["2x Points on all purchases", "Free home delivery", "Exclusive early access to sales"];
    if (tier === "Gold") return ["1.5x Points on purchases", "Free delivery over ₹500", "Birthday bonus points"];
    return ["1x Points on purchases", "Standard delivery rates", "Members-only offers"];
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 pb-24 md:py-8 space-y-8 animate-fade-in font-sans">
      <style>
        {`
          .confetti-profile { position: fixed; top: -10px; width: 8px; height: 16px; border-radius: 4px; z-index: 9999; animation: fall linear forwards; }
          @keyframes fall { to { transform: translateY(100vh) rotate(720deg); } }
          
          /* Perforated edge for coupons */
          .coupon-perforated {
            position: relative;
            background: #fff;
            border: 2px dashed #e2e8f0;
          }
          .coupon-perforated::before, .coupon-perforated::after {
            content: '';
            position: absolute;
            top: 50%;
            width: 20px;
            height: 20px;
            background-color: #F8F4FA;
            border-radius: 50%;
            transform: translateY(-50%);
            border: 2px solid #e2e8f0;
          }
          .coupon-perforated::before { left: -11px; border-right-color: transparent; border-top-color: transparent; border-bottom-color: transparent; }
          .coupon-perforated::after { right: -11px; border-left-color: transparent; border-top-color: transparent; border-bottom-color: transparent; }
          
          /* Hide scrollbar */
          .hide-scrollbar::-webkit-scrollbar { display: none; }
        `}
      </style>

      {/* SECTION 1 — PROFILE HEADER */}
      <section className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-[#782B90] to-[#4A1A5C]"></div>
        
        <div className="relative z-10 flex flex-col items-center mt-8">
          <div className="w-24 h-24 rounded-full bg-[#FFF200] border-4 border-white shadow-md flex items-center justify-center text-[#782B90] text-3xl font-extrabold relative">
            {user?.name?.charAt(0).toUpperCase()}
            <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-sm">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          
          <h1 className="mt-4 text-2xl font-extrabold text-slate-800">{user?.name}</h1>
          
          <div className="flex items-center space-x-2 text-slate-500 font-medium text-sm mt-1">
            <Phone className="w-3.5 h-3.5" />
            <span>+91 {user?.phone_number.substring(0,5)} {user?.phone_number.substring(5)}</span>
          </div>
          
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <div className="flex items-center space-x-1.5 bg-purple-50 text-[#782B90] px-3 py-1.5 rounded-full font-bold text-sm">
              <Star className="w-4 h-4 fill-current text-[#FFF200]" />
              <span className="uppercase">{stats?.tier} Member</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-50 text-slate-600 px-3 py-1.5 rounded-full font-semibold text-sm">
              <Calendar className="w-4 h-4" />
              <span>Joined {format(new Date(user?.member_since || new Date()), "MMM yyyy")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — TIER PROGRESS CARD */}
      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-[#4A1A5C] p-6 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] bg-[length:16px_16px]"></div>
          
          <h2 className="text-xl font-extrabold mb-8 relative z-10">Your Loyalty Journey</h2>
          
          {/* Visual tier journey */}
          <div className="relative z-10 max-w-lg mx-auto">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2 text-white/80">
              <span className={stats?.tier === "Silver" ? "text-[#FFF200]" : ""}>Silver</span>
              <span className={stats?.tier === "Gold" ? "text-[#FFF200]" : ""}>Gold</span>
              <span className={stats?.tier === "Platinum" ? "text-[#FFF200]" : ""}>Platinum</span>
            </div>
            
            <div className="relative h-2 bg-white/20 rounded-full mb-3">
              {/* Progress bar fill */}
              <div 
                className="absolute top-0 left-0 h-full bg-[#FFF200] rounded-full transition-all duration-1000"
                style={{ 
                  width: stats?.tier === "Silver" ? `${(stats?.tier_progress || 0) * 0.5}%` 
                       : stats?.tier === "Gold" ? `${50 + (stats?.tier_progress || 0) * 0.5}%` 
                       : "100%" 
                }}
              />
              {/* Markers */}
              <div className={`absolute top-1/2 left-0 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-[#4A1A5C] ${stats?.tier === "Silver" || stats?.tier === "Gold" || stats?.tier === "Platinum" ? "bg-[#FFF200]" : "bg-white/20"}`} />
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-[#4A1A5C] ${stats?.tier === "Gold" || stats?.tier === "Platinum" ? "bg-[#FFF200]" : "bg-white/20"}`} />
              <div className={`absolute top-1/2 right-0 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-[#4A1A5C] ${stats?.tier === "Platinum" ? "bg-[#FFF200]" : "bg-white/20"}`} />
            </div>
            
            {stats?.points_to_next_tier > 0 ? (
              <p className="text-sm font-semibold">You need <span className="text-[#FFF200] font-bold">{stats?.points_to_next_tier} more points</span> to reach {stats?.next_tier}</p>
            ) : (
              <p className="text-sm font-semibold text-[#FFF200]">You've reached the highest tier!</p>
            )}
          </div>
        </div>
        
        <div className="p-6 bg-purple-50/50">
          <h3 className="text-sm font-extrabold text-[#782B90] mb-3 uppercase tracking-wider">Current {stats?.tier} Benefits</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {getTierBenefits(stats?.tier).map((benefit, i) => (
              <li key={i} className="flex items-center space-x-2 text-sm font-medium text-slate-700">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* SECTION 3 — MY COUPONS */}
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xl font-extrabold text-slate-800">My Coupons</h2>
          
          <div className="flex bg-white border border-slate-200 rounded-lg p-1">
            {["Active", "Used", "Expired"].map(tab => (
              <button
                key={tab}
                onClick={() => setCouponTab(tab)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  couponTab === tab ? "bg-[#782B90] text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {displayCoupons.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-sm">
            <Ticket className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="font-bold text-slate-600">No {couponTab.toLowerCase()} coupons found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayCoupons.map(coupon => {
              const isInactive = coupon.is_used || new Date(coupon.expiry_date) <= now;
              return (
                <div key={coupon.id} className={`coupon-perforated rounded-2xl p-5 flex flex-col justify-between transition-all ${isInactive ? "grayscale opacity-60" : "hover:border-[#782B90] hover:shadow-md"}`}>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`font-mono text-base font-extrabold px-3 py-1.5 rounded-lg border ${isInactive ? "bg-slate-100 text-slate-500 border-slate-200" : "bg-[#FFF200] text-[#4A1A5C] border-yellow-300"}`}>
                      {coupon.code}
                    </span>
                    {!isInactive && (
                      <button onClick={() => handleCopyCode(coupon.code)} className="text-slate-400 hover:text-[#782B90] transition-colors p-1 bg-slate-50 rounded-lg">
                        <Copy className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  
                  <h4 className={`font-bold text-lg mb-1 ${isInactive ? "line-through text-slate-500" : "text-slate-800"}`}>{coupon.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">{coupon.description}</p>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-[11px] font-semibold">
                    <span className="text-slate-400">{coupon.applicable_stores || "All Stores"}</span>
                    <span className={`${isInactive ? "text-slate-400" : differenceInDays(new Date(coupon.expiry_date), now) <= 3 ? "text-red-500" : "text-emerald-600"}`}>
                      {coupon.is_used ? "Used" : new Date(coupon.expiry_date) <= now ? "Expired" : `Expires in ${differenceInDays(new Date(coupon.expiry_date), now)} days`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 4 — POINTS HISTORY */}
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xl font-extrabold text-slate-800">Points History</h2>
          
          <select 
            value={txFilter} 
            onChange={(e) => { setTxFilter(e.target.value); setTxPage(1); }}
            className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#782B90]"
          >
            <option value="All">All</option>
            <option value="Earned">Earned</option>
            <option value="Redeemed">Redeemed</option>
          </select>
        </div>

        {/* Expiring Soon Warning Feature */}
        {stats?.points_balance > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center space-x-3">
            <Info className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-xs font-semibold text-amber-800">
              Heads up! Some points may expire within 30 days if there is no account activity. Keep shopping to extend validity!
            </p>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {currentTxList.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-semibold text-slate-500 text-sm">No transactions found.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {currentTxList.map(tx => {
                const isEarned = tx.points >= 0;
                return (
                  <div key={tx.id} className="p-4 sm:p-5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isEarned ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                        {isEarned ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{tx.description}</p>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {format(new Date(tx.created_at), "dd MMM yyyy, hh:mm a")}
                        </span>
                      </div>
                    </div>
                    <div className={`font-extrabold text-sm sm:text-base ${isEarned ? "text-emerald-600" : "text-rose-600"}`}>
                      {isEarned ? "+" : ""}{tx.points}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Pagination Controls */}
          {txTotalPages > 1 && (
            <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button 
                onClick={() => setTxPage(p => Math.max(1, p - 1))}
                disabled={txPage === 1}
                className="text-xs font-bold text-[#782B90] disabled:text-slate-300 px-3 py-1"
              >
                Previous
              </button>
              <span className="text-xs font-semibold text-slate-500">Page {txPage} of {txTotalPages}</span>
              <button 
                onClick={() => setTxPage(p => Math.min(txTotalPages, p + 1))}
                disabled={txPage === txTotalPages}
                className="text-xs font-bold text-[#782B90] disabled:text-slate-300 px-3 py-1"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 5 — ACCOUNT SETTINGS */}
      <section>
        <h2 className="text-xl font-extrabold text-slate-800 mb-4 px-1">Account Settings</h2>
        
        <div className="space-y-4">
          
          {/* Edit Profile Block */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-[#782B90]" />
                <h3 className="font-bold text-slate-800">Personal Info</h3>
              </div>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="text-[#782B90] hover:bg-purple-50 p-1.5 rounded-lg transition-colors"
              >
                {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleProfileUpdate} className="space-y-4 mt-4 animate-fade-in">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Full Name</label>
                  <input 
                    type="text" 
                    value={editForm.name} 
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#782B90]"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Email Address</label>
                  <input 
                    type="email" 
                    value={editForm.email} 
                    onChange={e => setEditForm({...editForm, email: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#782B90]"
                  />
                </div>
                <div className="pt-2">
                  <button type="submit" disabled={isLoading} className="bg-[#782B90] text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-sm hover:bg-[#4A1A5C] transition-colors w-full sm:w-auto">
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 mt-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</p>
                  <p className="font-semibold text-slate-800">{user?.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                  <p className="font-semibold text-slate-800">{user?.email || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</p>
                  <p className="font-semibold text-slate-500 cursor-not-allowed">+91 {user?.phone_number}</p>
                </div>
              </div>
            )}
          </div>

          {/* Notifications Block */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Bell className="w-5 h-5 text-[#782B90]" />
              <h3 className="font-bold text-slate-800">Notification Preferences</h3>
            </div>
            
            <div className="space-y-5">
              {[
                { key: 'offers_alerts', label: 'Offers & Deals', desc: 'Get notified about new discounts' },
                { key: 'points_updates', label: 'Points Updates', desc: 'Alerts when you earn or redeem points' },
                { key: 'coupon_expiry', label: 'Coupon Expiry', desc: 'Reminders before your coupons expire' },
                { key: 'store_updates', label: 'Store Updates', desc: 'News about nearby store hours or events' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-slate-800">{item.label}</p>
                    <p className="text-[10px] sm:text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <button 
                    onClick={() => toggleNotification(item.key)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${notifications[item.key] ? 'bg-[#782B90]' : 'bg-slate-200'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifications[item.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <button 
              onClick={handleReferral}
              className="flex items-center justify-center space-x-2 bg-purple-50 text-[#782B90] font-extrabold text-sm py-3.5 rounded-2xl transition-colors hover:bg-purple-100 border border-purple-100"
            >
              <Share2 className="w-4 h-4" />
              <span>Share My Referral</span>
            </button>
            
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center justify-center space-x-2 bg-white text-red-500 font-extrabold text-sm py-3.5 rounded-2xl transition-colors hover:bg-red-50 border border-red-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>

        </div>
      </section>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl animate-scale-up text-center border border-slate-100">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-800 mb-2">Ready to leave?</h3>
            <p className="text-sm text-slate-500 mb-6 px-2">You will be logged out of Savomart. You can easily log back in with your mobile number anytime.</p>
            
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={logout}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
              >
                Yes, Log out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
