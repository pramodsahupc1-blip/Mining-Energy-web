import React, { useState, useEffect } from "react";
import { 
  Users, CheckCircle, XCircle, Clock, Search, 
  Settings, Coins, Cpu, Check, ArrowRightLeft, MessageSquare, Plus, RefreshCw
} from "lucide-react";
import { User, SupportTicket, RechargeRequest, WithdrawalRequest, MiningPlan } from "../types";

interface AdminViewProps {
  adminStats: {
    usersCount: number;
    activeMinersCount: number;
    totalRecharged: number;
    totalWithdrawn: number;
    pendingRechargesCount: number;
    pendingWithdrawalsCount: number;
    openTicketsCount: number;
  } | null;
  usersList: any[];
  rechargesList: any[];
  withdrawalsList: any[];
  ticketsList: any[];
  plansList: MiningPlan[];
  onVerifyRecharge: (id: string, status: "SUCCESS" | "FAILED") => Promise<void>;
  onVerifyWithdrawal: (id: string, status: "APPROVED" | "REJECTED") => Promise<void>;
  onAdjustBalance: (userId: string, amount: number, type: "available" | "earnings") => Promise<void>;
  onReplyTicket: (ticketId: string, message: string) => Promise<void>;
  onUpdateTicketStatus: (ticketId: string, status: string) => Promise<void>;
  onCreatePlan: (plan: { name: string; category: string; price: number; dailyIncome: number; durationDays: number; hashrate: string }) => Promise<void>;
  onRefreshAdminData: () => void;
}

type AdminTab = "dashboard" | "recharges" | "withdrawals" | "users" | "plans" | "tickets";

export default function AdminView({
  adminStats,
  usersList,
  rechargesList,
  withdrawalsList,
  ticketsList,
  plansList,
  onVerifyRecharge,
  onVerifyWithdrawal,
  onAdjustBalance,
  onReplyTicket,
  onUpdateTicketStatus,
  onCreatePlan,
  onRefreshAdminData,
}: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");

  // Adjustment form states
  const [adjustingUserId, setAdjustingUserId] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustType, setAdjustType] = useState<"available" | "earnings">("available");

  // Plan creation states
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planName, setPlanName] = useState("");
  const [planPrice, setPlanPrice] = useState("");
  const [planIncome, setPlanIncome] = useState("");
  const [planDuration, setPlanDuration] = useState("30");
  const [planHashrate, setPlanHashrate] = useState("100 TH/s");
  const [planCategory, setPlanCategory] = useState("Normal");

  // Support thread states
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const activeTicket = ticketsList.find(t => t.id === activeTicketId);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingUserId || !adjustAmount) return;
    await onAdjustBalance(adjustingUserId, Number(adjustAmount), adjustType);
    setAdjustAmount("");
    setAdjustingUserId(null);
  };

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName || !planPrice || !planIncome) return;
    await onCreatePlan({
      name: planName,
      category: planCategory,
      price: Number(planPrice),
      dailyIncome: Number(planIncome),
      durationDays: Number(planDuration),
      hashrate: planHashrate,
    });
    setPlanName("");
    setPlanPrice("");
    setPlanIncome("");
    setShowPlanModal(false);
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicketId || !replyText.trim()) return;
    await onReplyTicket(activeTicketId, replyText.trim());
    setReplyText("");
  };

  // Filter lists based on tab and queries
  const filteredUsers = usersList.filter(u => 
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.mobile.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* 1. Header with Refresh action */}
      <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <Settings className="text-orange-500 animate-spin" size={18} />
          <h2 className="text-sm font-bold tracking-tight text-white uppercase font-sans">
            Platform Master Console
          </h2>
        </div>
        <button
          onClick={onRefreshAdminData}
          className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-700/60 transition-colors"
          title="Refresh statistics logs"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* 2. Mode navigation tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {([
          { id: "dashboard", label: "Stats overview" },
          { id: "recharges", label: `Deposits (${adminStats?.pendingRechargesCount || 0})` },
          { id: "withdrawals", label: `Payouts (${adminStats?.pendingWithdrawalsCount || 0})` },
          { id: "users", label: "Users dir" },
          { id: "plans", label: "Plan creator" },
          { id: "tickets", label: `Support (${adminStats?.openTicketsCount || 0})` }
        ] as { id: AdminTab; label: string }[]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSearchQuery("");
            }}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
              activeTab === tab.id
                ? "bg-orange-600 border-transparent text-white shadow-md shadow-orange-950/20"
                : "bg-slate-900 text-slate-400 border-slate-800/80 hover:border-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Dashboard statistics cards panel */}
      {activeTab === "dashboard" && adminStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-slate-500 text-xxs block uppercase">Registered Members</span>
              <span className="text-lg font-bold text-slate-100 font-mono">{adminStats.usersCount}</span>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-slate-500 text-xxs block uppercase">Active cloud rigs</span>
              <span className="text-lg font-bold text-slate-100 font-mono">{adminStats.activeMinersCount}</span>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-slate-500 text-xxs block uppercase">approved deposits</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">₹{adminStats.totalRecharged.toFixed(0)}</span>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-slate-500 text-xxs block uppercase">approved payouts</span>
              <span className="text-lg font-bold text-rose-400 font-mono">₹{adminStats.totalWithdrawn.toFixed(0)}</span>
            </div>
          </div>

          <div className="p-5 bg-orange-600/5 border border-orange-500/10 rounded-2xl space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Verification Workloads Queue</h4>
            <ul className="text-xs text-slate-400 space-y-2 font-sans">
              <li className="flex justify-between border-b border-slate-800 pb-1.5">
                <span>Pending Recharge Approvals:</span>
                <span className="font-mono text-amber-400 font-bold">{adminStats.pendingRechargesCount}</span>
              </li>
              <li className="flex justify-between border-b border-slate-800 pb-1.5">
                <span>Pending Withdrawal Requests:</span>
                <span className="font-mono text-amber-400 font-bold">{adminStats.pendingWithdrawalsCount}</span>
              </li>
              <li className="flex justify-between">
                <span>Pending Customer Enquiries:</span>
                <span className="font-mono text-amber-400 font-bold">{adminStats.openTicketsCount}</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* 4. Deposits queue validation */}
      {activeTab === "recharges" && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recharge Requests</h3>
          {rechargesList.length === 0 ? (
            <div className="p-6 text-center bg-slate-900/30 border border-slate-800 rounded-2xl text-slate-500 text-xs">
              No recharge requests recorded.
            </div>
          ) : (
            <div className="space-y-3">
              {rechargesList.map((rec) => (
                <div key={rec.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-200">{rec.userFullName}</h4>
                      <p className="text-slate-500 text-xxs font-mono">Mob: {rec.userMobile} • ID: {rec.id}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-100 font-mono">₹{rec.amount}</span>
                  </div>

                  <div className="p-2 bg-slate-950 rounded-xl flex justify-between items-center text-xxs">
                    <span className="text-slate-500 font-mono">UPI Ref No:</span>
                    <span className="font-mono text-slate-300 font-bold select-all">{rec.reference}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xxs">{new Date(rec.createdAt).toLocaleString()}</span>
                    
                    {rec.status === "PENDING" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onVerifyRecharge(rec.id, "FAILED")}
                          className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold rounded-lg hover:bg-rose-500/20 transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => onVerifyRecharge(rec.id, "SUCCESS")}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors"
                        >
                          Approve credit
                        </button>
                      </div>
                    ) : (
                      <span className={`px-2.5 py-0.5 rounded-full text-xxs font-bold uppercase ${
                        rec.status === "SUCCESS" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                      }`}>
                        {rec.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Withdrawals queue validation */}
      {activeTab === "withdrawals" && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Withdrawal Requests</h3>
          {withdrawalsList.length === 0 ? (
            <div className="p-6 text-center bg-slate-900/30 border border-slate-800 rounded-2xl text-slate-500 text-xs">
              No withdrawal requests recorded.
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawalsList.map((wd) => (
                <div key={wd.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-200">{wd.userFullName}</h4>
                      <p className="text-slate-500 text-xxs font-mono">Mob: {wd.userMobile} • ID: {wd.id}</p>
                    </div>
                    <span className="text-sm font-bold text-rose-400 font-mono">-₹{wd.amount}</span>
                  </div>

                  {/* Bank Details form display */}
                  <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-xxs space-y-1.5 leading-normal">
                    {wd.upiId ? (
                      <div className="flex justify-between">
                        <span className="text-slate-500">UPI Destination Account:</span>
                        <span className="font-mono text-slate-300 font-bold">{wd.upiId}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Bank Name:</span>
                          <span className="text-slate-300 font-semibold">{wd.bankName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Holder:</span>
                          <span className="text-slate-300 font-semibold">{wd.accountHolder}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">A/C No:</span>
                          <span className="font-mono text-slate-300 font-bold">{wd.accountNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">IFSC Code:</span>
                          <span className="font-mono text-slate-300 font-bold uppercase">{wd.ifscCode}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xxs">{new Date(wd.createdAt).toLocaleString()}</span>
                    
                    {wd.status === "PENDING" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onVerifyWithdrawal(wd.id, "REJECTED")}
                          className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold rounded-lg hover:bg-rose-500/20 transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => onVerifyWithdrawal(wd.id, "APPROVED")}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors"
                        >
                          Approve payout
                        </button>
                      </div>
                    ) : (
                      <span className={`px-2.5 py-0.5 rounded-full text-xxs font-bold uppercase ${
                        wd.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                      }`}>
                        {wd.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Users manual directory adjustments */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search members by name or mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 pl-10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div className="space-y-3.5">
            {filteredUsers.map((u) => (
              <div key={u.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-200">{u.fullName} {u.id === "admin-id" && "(Admin)"}</h4>
                    <p className="text-slate-500 text-xxs font-mono">Mobile: {u.mobile} • Code: {u.referralCode}</p>
                  </div>
                  
                  <span className="text-slate-500 text-xxs">Joined: {new Date(u.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="grid grid-cols-2 gap-3.5 p-2 bg-slate-950 rounded-xl text-xxs">
                  <div>
                    <span className="text-slate-500">Available:</span>
                    <p className="font-semibold text-slate-300 font-mono">₹{u.wallet.available.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Yield Earnings:</span>
                    <p className="font-semibold text-slate-300 font-mono">₹{u.wallet.earnings.toFixed(2)}</p>
                  </div>
                </div>

                {/* Adjust balances controller */}
                {adjustingUserId === u.id ? (
                  <form onSubmit={handleAdjustSubmit} className="flex gap-2.5 items-center pt-2">
                    <select
                      value={adjustType}
                      onChange={(e: any) => setAdjustType(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-slate-300 py-1.5 px-2 rounded-lg text-xxs focus:outline-none"
                    >
                      <option value="available">Available</option>
                      <option value="earnings">Earnings</option>
                    </select>

                    <input
                      type="number"
                      placeholder="e.g. +500 or -300"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 py-1.5 px-3 rounded-lg text-xxs font-mono"
                    />

                    <button
                      type="submit"
                      className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                    >
                      <Check size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustingUserId(null)}
                      className="p-2 bg-slate-950 border border-slate-800 text-slate-400 rounded-lg"
                    >
                      X
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => {
                      setAdjustingUserId(u.id);
                      setAdjustAmount("");
                    }}
                    className="w-full py-1.5 bg-slate-950 hover:bg-slate-850 text-orange-400 rounded-xl border border-slate-800/80 font-bold transition-colors text-xxs flex items-center justify-center gap-1"
                  >
                    <Coins size={12} /> Adjust Member Balances
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Plan list and creator */}
      {activeTab === "plans" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Miner Models</h3>
            <button
              onClick={() => setShowPlanModal(true)}
              className="text-xs text-orange-500 hover:underline font-bold flex items-center gap-1"
            >
              <Plus size={14} /> New Model
            </button>
          </div>

          <div className="space-y-3.5">
            {plansList.map((p) => (
              <div key={p.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs space-y-2">
                <div className="flex justify-between font-bold">
                  <h4 className="text-slate-200">{p.name} ({p.hashrate})</h4>
                  <span className="text-orange-400">₹{p.price}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-xxs">
                  <span>Daily Profit: ₹{p.dailyIncome}</span>
                  <span>Duration: {p.durationDays} Days</span>
                </div>
              </div>
            ))}
          </div>

          {/* New Plan modal */}
          {showPlanModal && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <form
                onSubmit={handlePlanSubmit}
                className="bg-slate-900 border border-slate-800 rounded-[24px] max-w-sm w-full p-5 relative shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Create Mining Machine</h3>
                  <p className="text-xxs text-slate-500">Insert machine features below</p>
                </div>

                <div className="space-y-2.5 text-xs">
                  <input
                    type="text"
                    placeholder="Machine Name (e.g. Antminer X3)"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 focus:outline-none"
                    required
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Price (₹)"
                      value={planPrice}
                      onChange={(e) => setPlanPrice(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Daily ROI (₹)"
                      value={planIncome}
                      onChange={(e) => setPlanIncome(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Duration (Days)"
                      value={planDuration}
                      onChange={(e) => setPlanDuration(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Hash Power (e.g. 115 TH/s)"
                      value={planHashrate}
                      onChange={(e) => setPlanHashrate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100"
                    />
                  </div>
                  <select
                    value={planCategory}
                    onChange={(e) => setPlanCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-300"
                  >
                    <option value="Normal">Normal Pool</option>
                    <option value="VIP">VIP Pool</option>
                    <option value="Premium">Premium Pool</option>
                    <option value="Exclusive">Exclusive Pool</option>
                  </select>
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPlanModal(false)}
                    className="flex-1 py-2 bg-slate-950 text-slate-400 font-semibold text-xs rounded-lg border border-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-lg shadow-lg"
                  >
                    Publish miner
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 8. Support tickets directory replies */}
      {activeTab === "tickets" && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">User Support Enquiries</h3>
          
          {ticketsList.length === 0 ? (
            <div className="p-6 text-center bg-slate-900/30 border border-slate-800 rounded-2xl text-slate-500 text-xs">
              No tickets open or submitted.
            </div>
          ) : (
            <div className="space-y-3.5">
              {ticketsList.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setActiveTicketId(activeTicketId === t.id ? null : t.id);
                    setReplyText("");
                  }}
                  className={`p-4 bg-slate-900 border rounded-2xl cursor-pointer hover:border-slate-700 transition-all space-y-3 text-xs ${
                    activeTicketId === t.id ? "border-orange-500" : "border-slate-800"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-200">{t.subject}</h4>
                      <p className="text-slate-500 text-xxs font-mono">ID: {t.id} • {t.userFullName} ({t.userMobile})</p>
                    </div>

                    <div className="flex gap-2 items-center">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        t.status === "OPEN" ? "bg-amber-500/10 text-amber-400" :
                        t.status === "IN_PROGRESS" ? "bg-blue-500/10 text-blue-400" :
                        "bg-emerald-500/10 text-emerald-400"
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  </div>

                  {/* Message thread in expanded ticket */}
                  {activeTicketId === t.id && (
                    <div className="space-y-4 pt-3 border-t border-slate-800/80" onClick={(e) => e.stopPropagation()}>
                      <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                        {t.messages.map((m: any, idx: number) => {
                          const isAdmin = m.senderId === "system" || m.senderId === "admin-id";
                          return (
                            <div
                              key={idx}
                              className={`flex flex-col max-w-[85%] space-y-1 ${isAdmin ? "ml-auto items-end" : "mr-auto items-start"}`}
                            >
                              <span className="text-slate-500 text-[10px]">{m.senderName}</span>
                              <div className={`p-2.5 rounded-xl text-xxs leading-normal ${
                                isAdmin ? "bg-orange-600 text-white rounded-tr-none" : "bg-slate-950 text-slate-300 rounded-tl-none"
                              }`}>
                                {m.message}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Reply field and controls */}
                      <div className="flex gap-2 items-center">
                        <select
                          value={t.status}
                          onChange={(e) => onUpdateTicketStatus(t.id, e.target.value)}
                          className="bg-slate-950 border border-slate-850 text-slate-400 py-1.5 px-2 rounded-lg text-xxs"
                        >
                          <option value="OPEN">Open</option>
                          <option value="IN_PROGRESS">Working</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="CLOSED">Closed</option>
                        </select>

                        <form onSubmit={handleReplySubmit} className="flex-1 flex gap-2">
                          <input
                            type="text"
                            placeholder="Type admin reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="flex-1 bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xxs text-slate-100"
                          />
                          <button
                            type="submit"
                            className="p-1.5 bg-orange-600 text-white rounded-lg"
                            disabled={!replyText.trim()}
                          >
                            <Check size={12} />
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
