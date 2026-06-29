import React, { useState } from "react";
import { Share2, Copy, Check, Users, Users2, ShieldAlert, Award, Grid, QrCode } from "lucide-react";

interface TeamViewProps {
  referralCode: string;
  referralLink: string;
  stats: {
    level1Count: number;
    level2Count: number;
    level3Count: number;
    directMiners: number;
    totalTeamMiners: number;
    totalCommissionEarned: number;
  };
  team: {
    level1: Array<{ id: string; fullName: string; mobile: string; dateJoined: string }>;
    level2: Array<{ id: string; fullName: string; mobile: string; dateJoined: string }>;
    level3: Array<{ id: string; fullName: string; mobile: string; dateJoined: string }>;
  };
}

type LevelTab = "l1" | "l2" | "l3";

export default function TeamView({
  referralCode,
  referralLink,
  stats,
  team,
}: TeamViewProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<LevelTab>("l1");
  const [showQRModal, setShowQRModal] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentLevelTeam = 
    activeTab === "l1" ? team.level1 : 
    activeTab === "l2" ? team.level2 : 
    team.level3;

  return (
    <div className="space-y-6">
      {/* 1. Share Invitation Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-[28px] p-6 space-y-5 shadow-md">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-xxs font-extrabold text-orange-500 uppercase tracking-wider flex items-center gap-1.5">
              <Award size={12} /> Invite Upline Partners
            </span>
            <h3 className="text-base font-bold text-white tracking-tight">Expand Your Mining Network</h3>
            <p className="text-slate-400 text-xs">Unlock 3-tiers of passive miner commission bonuses</p>
          </div>
          
          <button
            onClick={() => setShowQRModal(true)}
            className="p-3 bg-slate-900 hover:bg-slate-800 text-orange-400 rounded-2xl border border-slate-800/80 transition-colors"
            title="Show Referral QR Code"
          >
            <QrCode size={18} />
          </button>
        </div>

        <div className="space-y-3.5">
          {/* Referral Code Field */}
          <div className="space-y-1.5">
            <label className="text-xxs font-bold text-slate-500 uppercase tracking-wider">Your Unique Code</label>
            <div className="flex bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 justify-between items-center">
              <span className="font-mono text-base font-extrabold text-slate-200 tracking-wider uppercase">{referralCode}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(referralCode);
                  alert("Referral code copied!");
                }}
                className="text-xs text-orange-500 hover:underline font-semibold flex items-center gap-1"
              >
                <Copy size={14} /> Copy Code
              </button>
            </div>
          </div>

          {/* Referral Link Field */}
          <div className="space-y-1.5">
            <label className="text-xxs font-bold text-slate-500 uppercase tracking-wider">Invitation URL Link</label>
            <div className="flex bg-slate-950 border border-slate-800/80 rounded-2xl p-3 justify-between items-center gap-4">
              <span className="font-mono text-xs text-slate-400 truncate flex-1 select-all">{referralLink}</span>
              <button
                onClick={handleCopy}
                className="p-2.5 bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 rounded-xl transition-colors shrink-0"
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Referral Rewards Matrix */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-1">
          <span className="text-slate-500 text-xxs block">Direct Partners (L1)</span>
          <span className="text-base font-extrabold text-slate-100 font-mono">{stats.level1Count}</span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-1">
          <span className="text-slate-500 text-xxs block">Total Team Net</span>
          <span className="text-base font-extrabold text-slate-100 font-mono">
            {stats.level1Count + stats.level2Count + stats.level3Count}
          </span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-1">
          <span className="text-slate-500 text-xxs block">Commission Paid</span>
          <span className="text-base font-extrabold text-emerald-400 font-sans">₹{stats.totalCommissionEarned.toFixed(2)}</span>
        </div>
      </div>

      {/* 3. Team Tree Tabs */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Users size={14} className="text-orange-500" />
            <span>Referral Tree Directory</span>
          </h3>

          <span className="text-slate-500 text-xxs">Total Active: {stats.totalTeamMiners} Nodes</span>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-3 bg-slate-950 p-1 rounded-2xl border border-slate-800/80">
          <button
            onClick={() => setActiveTab("l1")}
            className={`py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "l1" ? "bg-slate-900 text-white shadow-sm border border-slate-850" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Level 1 (10%)
          </button>
          <button
            onClick={() => setActiveTab("l2")}
            className={`py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "l2" ? "bg-slate-900 text-white shadow-sm border border-slate-850" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Level 2 (5%)
          </button>
          <button
            onClick={() => setActiveTab("l3")}
            className={`py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "l3" ? "bg-slate-900 text-white shadow-sm border border-slate-850" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Level 3 (2%)
          </button>
        </div>

        {/* List Grid */}
        {currentLevelTeam.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/30 border border-slate-800/60 rounded-3xl space-y-3">
            <Users2 size={24} className="text-slate-600 mx-auto" />
            <p className="text-slate-500 text-xs">No team partners registered on this level yet.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {currentLevelTeam.map((member) => (
              <div
                key={member.id}
                className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex justify-between items-center text-xs"
              >
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-200">{member.fullName}</h4>
                  <p className="text-slate-500 font-mono text-xxs">
                    Mobile: {member.mobile.substring(0, 3)}****{member.mobile.substring(7)}
                  </p>
                </div>
                <div className="text-right space-y-0.5 text-slate-500 text-xxs">
                  <span>Joined Date</span>
                  <p className="font-mono text-slate-400">{new Date(member.dateJoined).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Commission Splits Guide */}
      <div className="p-4 bg-orange-600/5 border border-orange-500/10 rounded-2xl flex gap-3 text-slate-400 text-xxs items-start">
        <ShieldAlert size={16} className="text-orange-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-slate-300 uppercase tracking-wider block">Affiliate Bonus Policy:</span>
          <p className="leading-relaxed">
            Commissions are credited instantly to your Earnings wallet when direct or upline team members activate virtual mining rigs. Level 1 pays 10% cash, Level 2 pays 5% cash, and Level 3 pays 2% cash of the machine activation cost. Multi-accounts are audited and subject to suspension.
          </p>
        </div>
      </div>

      {/* 5. Styled QR Scanner Target Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-[28px] max-w-xs w-full p-6 text-center space-y-4 relative shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 p-1"
            >
              Close
            </button>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Scan to Register</h3>
              <p className="text-xxs text-slate-500">Your network partner scan target</p>
            </div>

            {/* Simulated High-contrast QR Graphic */}
            <div className="p-4 bg-white rounded-2xl w-fit mx-auto border-4 border-orange-500/10 flex flex-col items-center gap-1.5 shadow-inner">
              <div className="relative p-1.5 bg-slate-950 rounded-xl">
                {/* Visual Representation of QR Code using Tailwind Boxes */}
                <div className="grid grid-cols-5 gap-1.5 w-36 h-36">
                  {Array.from({ length: 25 }).map((_, i) => {
                    const isSolid = (i % 2 === 0 && i % 3 !== 0) || i === 0 || i === 4 || i === 20 || i === 24 || i === 12;
                    return (
                      <div
                        key={i}
                        className={`rounded-xs ${isSolid ? "bg-orange-500" : "bg-slate-900"}`}
                      />
                    );
                  })}
                </div>
              </div>
              <span className="text-slate-950 font-mono text-[10px] font-bold tracking-widest uppercase">{referralCode}</span>
            </div>

            <p className="text-xxs text-slate-400">
              Share this code or QR directly to credit registrations under your networking team.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
