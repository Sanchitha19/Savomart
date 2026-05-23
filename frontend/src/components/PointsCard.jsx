import React from "react";
import { Award, Zap, ShieldCheck, Sparkles } from "lucide-react";

export const PointsCard = ({ user }) => {
  if (!user) return null;

  const { name, phone_number, points_balance, tier } = user;

  // Determine tier specifics
  const tierConfig = {
    Silver: {
      gradient: "from-[#606c88] to-[#3f4c6b]",
      textColor: "text-slate-100",
      accentBg: "bg-slate-500/20",
      badgeColor: "text-slate-300",
      icon: ShieldCheck,
      nextTier: "Gold",
      nextTierThreshold: 1000,
    },
    Gold: {
      gradient: "from-savomart-purple-dark via-savomart-purple to-[#8a3ea8]",
      textColor: "text-amber-100",
      accentBg: "bg-savomart-yellow/10",
      badgeColor: "text-savomart-yellow",
      icon: Award,
      nextTier: "Platinum",
      nextTierThreshold: 5000,
    },
    Platinum: {
      gradient: "from-[#1A1A1A] via-savomart-purple-dark to-[#2D1B4E]",
      textColor: "text-purple-100",
      accentBg: "bg-purple-400/20",
      badgeColor: "text-[#E5E4E2] drop-shadow-[0_1px_3px_rgba(255,255,255,0.2)]",
      icon: Sparkles,
      nextTier: "Top Tier",
      nextTierThreshold: null,
    },
  };

  const currentTier = tierConfig[tier] || tierConfig.Silver;
  const TierIcon = currentTier.icon;

  // Calculate tier progress
  let progressPercentage = 100;
  let pointsNeeded = 0;
  
  if (tier === "Silver") {
    const maxVal = 1000;
    progressPercentage = Math.min((points_balance / maxVal) * 100, 100);
    pointsNeeded = Math.max(maxVal - points_balance, 0);
  } else if (tier === "Gold") {
    const minVal = 1000;
    const maxVal = 5000;
    const range = maxVal - minVal;
    progressPercentage = Math.min(((points_balance - minVal) / range) * 100, 100);
    pointsNeeded = Math.max(maxVal - points_balance, 0);
  }

  // Generate mock barcode lines based on phone number
  const renderBarcode = () => {
    const numberStr = phone_number || "9999999999";
    const lineClasses = [
      "w-[1px] bg-black h-12",
      "w-[2px] bg-black h-12",
      "w-[3px] bg-black h-12",
      "w-[4px] bg-black h-12",
      "w-[1px] bg-transparent h-12"
    ];
    
    // Seeded deterministically from characters
    return (
      <div className="flex items-center justify-center bg-white px-4 py-2.5 rounded-lg border border-savomart-purple/10 shadow-inner">
        <div className="flex items-center space-x-[2px] overflow-hidden">
          {numberStr.split("").map((char, index) => {
            const val = parseInt(char) || 0;
            return (
              <React.Fragment key={index}>
                <div className={lineClasses[val % 4]} />
                <div className="w-[1px] bg-transparent h-12" />
                <div className={lineClasses[(val + index) % 4]} />
                <div className="w-[2px] bg-transparent h-12" />
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Premium Gradient Loyalty Card */}
      <div
        className={`relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br ${currentTier.gradient} text-white shadow-[0_12px_32px_rgba(74,26,92,0.25)] border border-white/10 transition-transform duration-300 hover:scale-[1.02]`}
      >
        {/* Sparkles / Hologram effect */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-savomart-yellow/5 blur-3xl pointer-events-none" />

        {/* Top Section */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-xs font-semibold tracking-wider text-white/70 uppercase">
              Loyalty Card
            </p>
            <h3 className="text-lg font-bold tracking-tight">Savomart Club</h3>
          </div>
          {/* Chip & Tier Badge */}
          <div className="flex items-center space-x-3">
            {/* Gold chip mockup */}
            <div className="w-9 h-7 rounded bg-gradient-to-br from-amber-300 to-amber-500 border border-amber-600 opacity-85 flex flex-col justify-around p-1">
              <div className="h-px bg-amber-800/30" />
              <div className="h-px bg-amber-800/30" />
              <div className="h-px bg-amber-800/30" />
            </div>
            
            <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full ${currentTier.accentBg} backdrop-blur-sm border border-white/10`}>
              <TierIcon className={`w-4 h-4 ${currentTier.badgeColor}`} />
              <span className="text-xs font-bold uppercase tracking-wider">
                {tier}
              </span>
            </div>
          </div>
        </div>

        {/* Balance Display */}
        <div className="mb-6">
          <p className="text-xs text-white/70 uppercase tracking-widest mb-1">
            Points Balance
          </p>
          <div className="flex items-baseline space-x-1">
            <span className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
              {points_balance.toLocaleString()}
            </span>
            <span className="text-sm font-semibold text-savomart-yellow">
              pts
            </span>
          </div>
        </div>

        {/* Card Holder Details */}
        <div className="flex justify-between items-end mt-4">
          <div>
            <p className="text-[10px] text-white/50 uppercase tracking-widest leading-none">
              Card Holder
            </p>
            <p className="text-sm font-semibold tracking-wide truncate max-w-[200px]">
              {name}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/50 uppercase tracking-widest leading-none">
              Member ID
            </p>
            <p className="text-sm font-mono tracking-wider">
              SVM-{phone_number.substring(0, 4)}-{phone_number.substring(6)}
            </p>
          </div>
        </div>
      </div>

      {/* Tier Up progress */}
      <div className="mt-4 bg-white rounded-xl p-4 border border-savomart-purple/10 shadow-sm">
        <div className="flex justify-between items-center mb-2 text-xs font-semibold text-savomart-purple-dark">
          <span className="flex items-center space-x-1">
            <Zap className="w-3.5 h-3.5 text-savomart-purple" />
            <span>Tier Status</span>
          </span>
          {currentTier.nextTierThreshold ? (
            <span>
              {pointsNeeded.toLocaleString()} pts to {currentTier.nextTier}
            </span>
          ) : (
            <span className="text-emerald-600 flex items-center space-x-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Highest Rank Reached!</span>
            </span>
          )}
        </div>
        
        {currentTier.nextTierThreshold && (
          <div className="w-full bg-savomart-purple-light rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-savomart-purple to-savomart-purple-dark h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}
      </div>

      {/* Loyalty Barcode for cashier scanning */}
      <div className="mt-4 flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-savomart-purple/10 shadow-sm text-center">
        <p className="text-xs font-bold text-savomart-purple-dark mb-2 tracking-wide">
          Scan at Cashier Checkout
        </p>
        {renderBarcode()}
        <p className="text-[10px] font-mono text-slate-400 mt-1">
          {phone_number}
        </p>
      </div>
    </div>
  );
};

export default PointsCard;
