import React, { useState } from "react";
import { 
  Wallet, ShieldCheck, Zap, ArrowUpRight, ArrowDownLeft, 
  Award, RefreshCw, ChevronRight, Volume2, Users, Cpu, Activity
} from "lucide-react";
import { Wallet as WalletType, Announcement } from "../types";

interface HomeViewProps {
  wallet: WalletType;
  stats: {
    activeInvestmentsCount: number;
    totalMembers: number;
    totalInvestments: number;
    totalWithdrawals: number;
  };
  banners: Array<{ id: string; title: string; text: string; imageUrl: string }>;
  announcements: Announcement[];
  onCheckIn: () => Promise<void>;
  onNavigate: (tab: string) => void;
  loadingCheckIn: boolean;
}

export default function HomeView({
  wallet,
  stats,
  banners,
  announcements,
  onCheckIn,
  onNavigate,
  loadingCheckIn,
}: HomeViewProps) {
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);

  // Rotating banner cycle helper
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBannerIdx((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const hasCheckedInToday = wallet.lastCheckIn === new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* 1. Main Wallet Statistics Card */}
      <div className="bg-gradient-to-br from-orange-600 to-amber-600 rounded-[28px] p-6 text-white shadow-xl shadow-orange-950/20 relative overflow-hidden">
        {/* Background glowing decorations */}
        <div className="absolute top-[-30%] right-[-20%] w-[180px] h-[180px] rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[120px] h-[120px] rounded-full bg-black/10 blur-xl pointer-events-none" />

        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <span className="text-white/75 text-xs uppercase font-semibold tracking-wider flex items-center gap-1.5">
              <Wallet size={12} />
              Total Wallet Balance
            </span>
            <h2 className="text-4.5xl font-bold tracking-tight">
              ₹{(wallet.available + wallet.earnings + wallet.investment).toFixed(2)}
            </h2>
          </div>
          <div className="px-3.5 py-1.5 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 text-xs font-medium flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-amber-200" />
            Verified SEC Safe
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
          <div>
            <span className="text-white/70 text-xxs uppercase font-medium block mb-1">Available</span>
            <p className="text-lg font-bold">₹{wallet.available.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-white/70 text-xxs uppercase font-medium block mb-1">Locked Miner</span>
            <p className="text-lg font-bold flex items-center gap-1">
              ₹{wallet.investment.toFixed(2)}
            </p>
          </div>
          <div>
            <span className="text-white/70 text-xxs uppercase font-medium block mb-1">Yield Profits</span>
            <p className="text-lg font-bold text-amber-100">₹{wallet.earnings.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* 2. Quick Actions Menu */}
      <div className="grid grid-cols-4 gap-3">
        <button
          onClick={() => onNavigate("wallet")}
          className="flex flex-col items-center gap-2 p-3.5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-orange-500/40 transition-all group"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <ArrowDownLeft size={22} />
          </div>
          <span className="text-xs font-semibold text-slate-300">Recharge</span>
        </button>

        <button
          onClick={() => onNavigate("wallet")}
          className="flex flex-col items-center gap-2 p-3.5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-orange-500/40 transition-all group"
        >
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <ArrowUpRight size={22} />
          </div>
          <span className="text-xs font-semibold text-slate-300">Withdraw</span>
        </button>

        <button
          onClick={() => onNavigate("shop")}
          className="flex flex-col items-center gap-2 p-3.5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-orange-500/40 transition-all group"
        >
          <div className="w-11 h-11 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Zap size={22} />
          </div>
          <span className="text-xs font-semibold text-slate-300">Shop</span>
        </button>

        <button
          onClick={() => onNavigate("team")}
          className="flex flex-col items-center gap-2 p-3.5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-orange-500/40 transition-all group"
        >
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Users size={22} />
          </div>
          <span className="text-xs font-semibold text-slate-300">Invite</span>
        </button>
      </div>

      {/* 3. Sliding Banners Carousel */}
      <div className="relative rounded-[24px] overflow-hidden aspect-[2.1/1] border border-slate-800">
        {banners.map((b, idx) => (
          <div
            key={b.id}
            className={`absolute inset-0 transition-opacity duration-700 flex flex-col justify-end p-5 ${
              idx === currentBannerIdx ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            {/* Background Image with Dark Overlay */}
            <div className="absolute inset-0 z-0">
              <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            </div>

            <div className="relative z-10 space-y-1">
              <span className="px-2 py-0.5 bg-orange-500 text-white rounded-full text-xxs font-bold tracking-wider uppercase inline-block">
                Hot Deal
              </span>
              <h3 className="text-base font-bold text-white tracking-tight">{b.title}</h3>
              <p className="text-xs text-slate-300">{b.text}</p>
            </div>
          </div>
        ))}

        {/* Carousel indicators */}
        <div className="absolute bottom-3 right-4 z-20 flex gap-1.5">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentBannerIdx(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                idx === currentBannerIdx ? "w-4 bg-orange-500" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>

      {/* 4. Daily Check-in Card */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-[24px] flex items-center justify-between shadow-md relative overflow-hidden group">
        <div className="space-y-1 relative z-10">
          <span className="text-xxs font-bold text-orange-500 uppercase tracking-wider flex items-center gap-1">
            <Award size={12} /> Daily Loyalty Check-In
          </span>
          <h3 className="text-sm font-bold text-white">Daily Login Reward</h3>
          <p className="text-xs text-slate-400">Claim ₹20.00 free credits every 24h</p>
        </div>

        <button
          onClick={onCheckIn}
          disabled={hasCheckedInToday || loadingCheckIn}
          className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all relative z-10 flex items-center gap-1.5 ${
            hasCheckedInToday
              ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
              : "bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-950/20 active:scale-95"
          }`}
        >
          {loadingCheckIn ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : hasCheckedInToday ? (
            "Claimed"
          ) : (
            "Claim ₹20"
          )}
        </button>
      </div>

      {/* 5. Live News Broadcast Ticker */}
      {announcements.length > 0 && (
        <div className="p-3.5 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 text-orange-500 rounded-xl">
            <Volume2 size={16} />
          </div>
          <div className="flex-1 overflow-hidden h-5 relative">
            <div className="absolute inset-0 flex items-center">
              <span className="text-xs text-slate-300 truncate font-sans">
                {announcements[announcements.length - 1].content}
              </span>
            </div>
          </div>
          <ChevronRight size={14} className="text-slate-600" />
        </div>
      )}

      {/* 6. Company Live Operational Statistics */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Mining Network Live Indicators
        </h3>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <div className="p-2 bg-orange-500/5 text-orange-400 w-fit rounded-lg">
              <Users size={16} />
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-500 text-xxs font-medium block">Active Farmers</span>
              <span className="text-sm font-bold text-slate-200 font-mono">
                {stats.totalMembers.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <div className="p-2 bg-emerald-500/5 text-emerald-400 w-fit rounded-lg">
              <Cpu size={16} />
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-500 text-xxs font-medium block">Mining Power</span>
              <span className="text-sm font-bold text-slate-200 font-mono">
                {(stats.totalInvestments / 100).toFixed(1)} PH/s
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <div className="p-2 bg-indigo-500/5 text-indigo-400 w-fit rounded-lg">
              <Activity size={16} />
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-500 text-xxs font-medium block">Withdrawn Pool</span>
              <span className="text-sm font-bold text-slate-200 font-mono">
                ₹{stats.totalWithdrawals.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
