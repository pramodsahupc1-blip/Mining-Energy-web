import React, { useState, useEffect } from "react";
import { 
  Users, CheckCircle, XCircle, Clock, Search, 
  Settings, Coins, Cpu, Check, ArrowRightLeft, MessageSquare, Plus, RefreshCw,
  Megaphone, Bell, Trash2, Shield, ShieldAlert, Eye, Volume2, Send, CreditCard
} from "lucide-react";
import { User, SupportTicket, RechargeRequest, WithdrawalRequest, MiningPlan } from "../types";
import { api } from "../lib/api";

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
  announcementsList: any[];
  onVerifyRecharge: (id: string, status: "SUCCESS" | "FAILED") => Promise<void>;
  onVerifyWithdrawal: (id: string, status: "APPROVED" | "REJECTED") => Promise<void>;
  onAdjustBalance: (userId: string, amount: number, type: "available" | "earnings") => Promise<void>;
  onReplyTicket: (ticketId: string, message: string) => Promise<void>;
  onUpdateTicketStatus: (ticketId: string, status: string) => Promise<void>;
  onCreatePlan: (plan: { name: string; category: string; price: number; dailyIncome: number; durationDays: number; hashrate: string; imageUrl: string }) => Promise<void>;
  onRefreshAdminData: () => void;
  onDeleteUser: (userId: string) => Promise<void>;
  onToggleUserRole: (userId: string, currentRole: string) => Promise<void>;
  onTogglePlanStatus: (planId: string, currentStatus: boolean) => Promise<void>;
  onDeletePlan: (planId: string) => Promise<void>;
  onUpdatePlan: (planId: string, updates: Partial<MiningPlan>) => Promise<void>;
  onCreateAnnouncement: (title: string, content: string) => Promise<void>;
  onDeleteAnnouncement: (id: string) => Promise<void>;
  onSendNotification: (userId: string, title: string, message: string) => Promise<void>;
  onBroadcastNotification: (title: string, message: string) => Promise<void>;
}

type AdminTab = "dashboard" | "recharges" | "withdrawals" | "users" | "plans" | "tickets" | "announcements" | "notifications";

const PHOTO_PRESETS = [
  { name: "S19 Pro", url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80" },
  { name: "Whatsminer", url: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=600&q=80" },
  { name: "Avalon Pro", url: "https://images.unsplash.com/photo-1591453089816-0fbb971b454c?auto=format&fit=crop&w=600&q=80" },
  { name: "Antminer L7", url: "https://images.unsplash.com/photo-1605792657660-596af9009e82?auto=format&fit=crop&w=600&q=80" },
  { name: "Giga Node", url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80" },
  { name: "Quantum Grid", url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80" }
];

export default function AdminView({
  adminStats,
  usersList,
  rechargesList,
  withdrawalsList,
  ticketsList,
  plansList,
  announcementsList,
  onVerifyRecharge,
  onVerifyWithdrawal,
  onAdjustBalance,
  onReplyTicket,
  onUpdateTicketStatus,
  onCreatePlan,
  onRefreshAdminData,
  onDeleteUser,
  onToggleUserRole,
  onTogglePlanStatus,
  onDeletePlan,
  onUpdatePlan,
  onCreateAnnouncement,
  onDeleteAnnouncement,
  onSendNotification,
  onBroadcastNotification,
}: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");

  // Payment configuration states
  const [upiId, setUpiId] = useState("jinwoosung.jg@oksbi");
  const [upiIdSecondary, setUpiIdSecondary] = useState("jinwoosung.jg@oksbi");
  const [upiName, setUpiName] = useState("NSDL PAYMENTS BANK");
  const [isSavingPayments, setIsSavingPayments] = useState(false);
  const [paymentSaveSuccess, setPaymentSaveSuccess] = useState(false);

  useEffect(() => {
    api.getPaymentSettings().then((settings) => {
      if (settings) {
        setUpiId(settings.upiId || "jinwoosung.jg@oksbi");
        setUpiIdSecondary(settings.upiIdSecondary || "jinwoosung.jg@oksbi");
        setUpiName(settings.upiName || "NSDL PAYMENTS BANK");
      }
    });
  }, []);

  const handleUpdatePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPayments(true);
    setPaymentSaveSuccess(false);
    try {
      await api.updatePaymentSettings({
        upiId,
        upiIdSecondary,
        upiName
      });
      setPaymentSaveSuccess(true);
      setTimeout(() => setPaymentSaveSuccess(false), 3000);
    } catch (err) {
      alert("Failed to update payment configuration: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSavingPayments(false);
    }
  };

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
  const [planImageUrl, setPlanImageUrl] = useState("https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80");

  // Plan editing states
  const [editingPlan, setEditingPlan] = useState<MiningPlan | null>(null);
  const [editPlanName, setEditPlanName] = useState("");
  const [editPlanPrice, setEditPlanPrice] = useState("");
  const [editPlanIncome, setEditPlanIncome] = useState("");
  const [editPlanDuration, setEditPlanDuration] = useState("");
  const [editPlanHashrate, setEditPlanHashrate] = useState("");
  const [editPlanCategory, setEditPlanCategory] = useState("");
  const [editPlanImageUrl, setEditPlanImageUrl] = useState("");

  // Support thread states
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // Announcements form states
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");

  // Direct alert states
  const [showDirectAlertModal, setShowDirectAlertModal] = useState<string | null>(null);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMsg, setAlertMsg] = useState("");

  // Broadcast alert states
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");

  // Referrals downline view state
  const [viewingReferralsUser, setViewingReferralsUser] = useState<any | null>(null);

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
      imageUrl: planImageUrl || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80"
    });
    setPlanName("");
    setPlanPrice("");
    setPlanIncome("");
    setPlanImageUrl("https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80");
    setShowPlanModal(false);
  };

  const handleEditPlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan || !editPlanName || !editPlanPrice || !editPlanIncome) return;
    await onUpdatePlan(editingPlan.id, {
      name: editPlanName,
      category: editPlanCategory as any,
      price: Number(editPlanPrice),
      dailyIncome: Number(editPlanIncome),
      durationDays: Number(editPlanDuration),
      hashrate: editPlanHashrate,
      imageUrl: editPlanImageUrl || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80"
    });
    setEditingPlan(null);
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicketId || !replyText.trim()) return;
    await onReplyTicket(activeTicketId, replyText.trim());
    setReplyText("");
  };

  const handleAnnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    await onCreateAnnouncement(annTitle.trim(), annContent.trim());
    setAnnTitle("");
    setAnnContent("");
    setShowAnnModal(false);
  };

  const handleDirectAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showDirectAlertModal || !alertTitle.trim() || !alertMsg.trim()) return;
    await onSendNotification(showDirectAlertModal, alertTitle.trim(), alertMsg.trim());
    setAlertTitle("");
    setAlertMsg("");
    setShowDirectAlertModal(null);
  };

  const handleBroadcastAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) return;
    await onBroadcastNotification(broadcastTitle.trim(), broadcastMsg.trim());
    setBroadcastTitle("");
    setBroadcastMsg("");
    alert("Alert broadcasted successfully!");
  };

  const filteredUsers = usersList.filter(u => 
    u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.mobile?.includes(searchQuery)
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
          { id: "plans", label: "Miner Shop" },
          { id: "tickets", label: `Support (${adminStats?.openTicketsCount || 0})` },
          { id: "announcements", label: "Announcements" },
          { id: "notifications", label: "Send Alerts" }
        ] as { id: AdminTab; label: string }[]).map((tab) => (
          <button
            key={tab.id}
            id={`admin-tab-${tab.id}`}
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

          {/* Platform Payment Settings Card */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="text-orange-500" size={18} />
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">UPI Payment Gateway Settings</h4>
                <p className="text-[10px] text-slate-500 font-sans">Configure platform receiver UPI IDs shown to users during deposits</p>
              </div>
            </div>

            <form onSubmit={handleUpdatePaymentSettings} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Primary UPI ID (Option A)</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. name@oksbi"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 font-mono text-xs focus:outline-none focus:border-orange-500/50"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Backup UPI ID (Option B)</label>
                  <input
                    type="text"
                    value={upiIdSecondary}
                    onChange={(e) => setUpiIdSecondary(e.target.value)}
                    placeholder="e.g. backup@ybl"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 font-mono text-xs focus:outline-none focus:border-orange-500/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Display Name / Bank Name</label>
                <input
                  type="text"
                  value={upiName}
                  onChange={(e) => setUpiName(e.target.value)}
                  placeholder="e.g. NSDL PAYMENTS BANK"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 text-xs focus:outline-none focus:border-orange-500/50"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div>
                  {paymentSaveSuccess && (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 animate-pulse">
                      ✓ Changes saved instantly to cloud database!
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSavingPayments}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-lg transition-colors shadow-lg disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSavingPayments ? (
                    <>
                      <RefreshCw className="animate-spin" size={12} /> Saving...
                    </>
                  ) : (
                    "Save Gateway Config"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Deposits queue validation */}
      {activeTab === "recharges" && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">User Recharge Receipts</h3>
          {rechargesList.length === 0 ? (
            <div className="p-6 text-center bg-slate-900/30 border border-slate-800 rounded-2xl text-slate-500 text-xs">
              No deposit requests registered.
            </div>
          ) : (
            <div className="space-y-3.5">
              {rechargesList.map((r) => (
                <div key={r.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-slate-500 text-xxs font-mono">ID: {r.id}</span>
                      <p className="font-bold text-slate-200 mt-1">₹{r.amount} recharged</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      r.status === "PENDING" ? "bg-amber-500/10 text-amber-400" :
                      r.status === "SUCCESS" ? "bg-emerald-500/10 text-emerald-400" :
                      "bg-rose-500/10 text-rose-400"
                    }`}>
                      {r.status}
                    </span>
                  </div>

                  <div className="text-slate-400 text-xxs space-y-1 bg-slate-950 p-2.5 rounded-xl">
                    <p><span className="text-slate-500">Method:</span> {r.method}</p>
                    <p className="font-mono"><span className="text-slate-500 font-sans">Reference Ref No:</span> {r.reference}</p>
                    {r.createdAt && <p><span className="text-slate-500">Requested:</span> {new Date(r.createdAt).toLocaleString()}</p>}
                  </div>

                  {r.status === "PENDING" && (
                    <div className="flex gap-2">
                      <button
                        id={`btn-approve-recharge-${r.id}`}
                        onClick={() => onVerifyRecharge(r.id, "SUCCESS")}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xxs rounded-xl flex items-center justify-center gap-1 transition-colors"
                      >
                        <CheckCircle size={12} /> Approve payment
                      </button>
                      <button
                        id={`btn-reject-recharge-${r.id}`}
                        onClick={() => onVerifyRecharge(r.id, "FAILED")}
                        className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xxs rounded-xl flex items-center justify-center gap-1 transition-colors border border-rose-500/30"
                      >
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Withdrawals validation queue */}
      {activeTab === "withdrawals" && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">User Payout Requests</h3>
          {withdrawalsList.length === 0 ? (
            <div className="p-6 text-center bg-slate-900/30 border border-slate-800 rounded-2xl text-slate-500 text-xs">
              No payout requests registered.
            </div>
          ) : (
            <div className="space-y-3.5">
              {withdrawalsList.map((w) => (
                <div key={w.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-slate-500 text-xxs font-mono">ID: {w.id}</span>
                      <p className="font-bold text-slate-200 mt-1">₹{w.amount} cashout</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      w.status === "PENDING" ? "bg-amber-500/10 text-amber-400" :
                      w.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-400" :
                      "bg-rose-500/10 text-rose-400"
                    }`}>
                      {w.status}
                    </span>
                  </div>

                  <div className="text-slate-400 text-xxs space-y-1.5 bg-slate-950 p-2.5 rounded-xl">
                    <p><span className="text-slate-500">Bank Name:</span> {w.bankName}</p>
                    <p className="font-mono"><span className="text-slate-500 font-sans">Account No:</span> {w.accountNumber}</p>
                    <p className="font-mono"><span className="text-slate-500 font-sans">IFSC Code:</span> {w.ifscCode}</p>
                    {w.upiId && <p className="font-mono"><span className="text-slate-500 font-sans">UPI ID:</span> {w.upiId}</p>}
                    {w.createdAt && <p><span className="text-slate-500 font-sans">Requested:</span> {new Date(w.createdAt).toLocaleString()}</p>}
                  </div>

                  {w.status === "PENDING" && (
                    <div className="flex gap-2">
                      <button
                        id={`btn-approve-withdrawal-${w.id}`}
                        onClick={() => onVerifyWithdrawal(w.id, "APPROVED")}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xxs rounded-xl flex items-center justify-center gap-1 transition-colors"
                      >
                        <CheckCircle size={12} /> Approve dispatch
                      </button>
                      <button
                        id={`btn-reject-withdrawal-${w.id}`}
                        onClick={() => onVerifyWithdrawal(w.id, "REJECTED")}
                        className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xxs rounded-xl flex items-center justify-center gap-1 transition-colors border border-rose-500/30"
                      >
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Users manual directory adjustments & deletions */}
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
                    <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                      {u.fullName} 
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${u.role === "admin" ? "bg-orange-600/20 text-orange-400" : "bg-slate-800 text-slate-400"}`}>
                        {u.role === "admin" ? "Admin" : "Miner"}
                      </span>
                    </h4>
                    <p className="text-slate-500 text-xxs font-mono mt-0.5">Mobile: {u.mobile} • Code: {u.referralCode}</p>
                  </div>
                  
                  <span className="text-slate-500 text-xxs">Joined: {new Date(u.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="grid grid-cols-2 gap-3.5 p-2 bg-slate-950 rounded-xl text-xxs">
                  <div>
                    <span className="text-slate-500">Available:</span>
                    <p className="font-semibold text-slate-300 font-mono">₹{u.wallet?.available?.toFixed(2) || "0.00"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Yield Earnings:</span>
                    <p className="font-semibold text-slate-300 font-mono">₹{u.wallet?.earnings?.toFixed(2) || "0.00"}</p>
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
                  <div className="flex flex-col gap-2 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setAdjustingUserId(u.id);
                          setAdjustAmount("");
                        }}
                        className="py-1.5 bg-slate-950 hover:bg-slate-850 text-orange-400 rounded-xl border border-slate-800/80 font-bold transition-colors text-xxs flex items-center justify-center gap-1"
                      >
                        <Coins size={12} /> Adjust balance
                      </button>
                      <button
                        onClick={() => {
                          const directReferrals = usersList.filter(user => user.referredBy === u.id);
                          setViewingReferralsUser({ user: u, referrals: directReferrals });
                        }}
                        className="py-1.5 bg-slate-950 hover:bg-slate-850 text-sky-400 rounded-xl border border-slate-800/80 font-bold transition-colors text-xxs flex items-center justify-center gap-1"
                      >
                        <Users size={12} /> View referrals
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => onToggleUserRole(u.id, u.role)}
                        className="py-1.5 bg-slate-950 hover:bg-slate-850 text-amber-400 rounded-lg border border-slate-800/80 font-bold transition-colors text-[10px] flex items-center justify-center gap-1"
                      >
                        <Shield size={10} /> Toggle Role
                      </button>
                      <button
                        onClick={() => {
                          setShowDirectAlertModal(u.id);
                          setAlertTitle("");
                          setAlertMsg("");
                        }}
                        className="py-1.5 bg-slate-950 hover:bg-slate-850 text-emerald-400 rounded-lg border border-slate-800/80 font-bold transition-colors text-[10px] flex items-center justify-center gap-1"
                      >
                        <Bell size={10} /> Send Alert
                      </button>
                      <button
                        onClick={() => onDeleteUser(u.id)}
                        className="py-1.5 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 rounded-lg border border-rose-900/30 font-bold transition-colors text-[10px] flex items-center justify-center gap-1"
                      >
                        <Trash2 size={10} /> Delete User
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Direct Alert modal */}
          {showDirectAlertModal && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <form
                onSubmit={handleDirectAlertSubmit}
                className="bg-slate-900 border border-slate-800 rounded-[24px] max-w-sm w-full p-5 relative shadow-2xl space-y-3"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Send Direct Alert</h3>
                  <p className="text-xxs text-slate-500">Send an instant private notification to this member</p>
                </div>
                <div className="space-y-2 text-xs">
                  <input
                    type="text"
                    placeholder="Alert Title"
                    value={alertTitle}
                    onChange={(e) => setAlertTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100"
                    required
                  />
                  <textarea
                    placeholder="Compose message..."
                    value={alertMsg}
                    onChange={(e) => setAlertMsg(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100"
                    required
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDirectAlertModal(null)}
                    className="flex-1 py-2 bg-slate-950 text-slate-400 font-semibold text-xs rounded-lg border border-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1"
                  >
                    <Send size={12} /> Send Alert
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Referrals downline modal */}
          {viewingReferralsUser && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-slate-900 border border-slate-800 rounded-[24px] max-w-sm w-full p-5 relative shadow-2xl space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Referrals of {viewingReferralsUser.user.fullName}</h3>
                  <p className="text-xxs text-slate-500">Direct registered members using code: {viewingReferralsUser.user.referralCode}</p>
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {viewingReferralsUser.referrals.length === 0 ? (
                    <div className="p-4 text-center text-xxs text-slate-500 bg-slate-950 rounded-xl">
                      No direct downline referrals found for this member.
                    </div>
                  ) : (
                    viewingReferralsUser.referrals.map((refUser: any) => (
                      <div key={refUser.id} className="p-2.5 bg-slate-950 rounded-xl flex justify-between items-center text-xxs">
                        <div>
                          <p className="font-bold text-slate-300">{refUser.fullName}</p>
                          <p className="text-slate-500 font-mono">{refUser.mobile}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-400">Bal: <span className="text-slate-300 font-mono">₹{refUser.wallet?.available?.toFixed(2) || "0.00"}</span></p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={() => setViewingReferralsUser(null)}
                  className="w-full py-2 bg-slate-950 text-slate-400 font-semibold text-xs rounded-lg border border-slate-800"
                >
                  Close Directory
                </button>
              </div>
            </div>
          )}
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
              <div key={p.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs space-y-3">
                <div className="flex gap-3 items-start">
                  {p.imageUrl && (
                    <img 
                      src={p.imageUrl} 
                      alt={p.name} 
                      className="w-14 h-14 rounded-xl object-cover border border-slate-800 bg-slate-950 flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between font-bold">
                      <h4 className="text-slate-200 truncate pr-2 text-sm">{p.name} ({p.hashrate})</h4>
                      <span className="text-orange-400 font-mono text-sm">₹{p.price}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-xxs mt-1.5 font-sans">
                      <span>Daily Profit: <strong className="text-emerald-500">₹{p.dailyIncome}</strong></span>
                      <span>Duration: <strong>{p.durationDays} Days</strong></span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <span className="text-xxs text-slate-500 font-sans">Status:</span>
                    <button
                      onClick={() => onTogglePlanStatus(p.id, p.status)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-colors ${
                        p.status ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-950 text-slate-500 border border-slate-800"
                      }`}
                    >
                      {p.status ? "Active" : "Disabled"}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingPlan(p);
                        setEditPlanName(p.name);
                        setEditPlanCategory(p.category);
                        setEditPlanPrice(String(p.price));
                        setEditPlanIncome(String(p.dailyIncome));
                        setEditPlanDuration(String(p.durationDays));
                        setEditPlanHashrate(p.hashrate || "100 TH/s");
                        setEditPlanImageUrl(p.imageUrl || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80");
                      }}
                      className="py-1 px-2.5 bg-slate-950 hover:bg-slate-850 text-orange-400 rounded-lg border border-slate-800 font-bold transition-all text-xxs"
                    >
                      Edit Model
                    </button>
                    <button
                      onClick={() => onDeletePlan(p.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-950 rounded-md transition-all"
                      title="Delete miner machine"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* New Plan modal */}
          {showPlanModal && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <form
                onSubmit={handlePlanSubmit}
                className="bg-slate-900 border border-slate-800 rounded-[24px] max-w-sm w-full p-5 relative shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Create Mining Machine</h3>
                  <p className="text-xxs text-slate-500">Insert machine features below</p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase font-mono">Machine Name</label>
                    <input
                      type="text"
                      placeholder="Machine Name (e.g. Antminer X3)"
                      value={planName}
                      onChange={(e) => setPlanName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 focus:outline-none"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase font-mono">Price (₹)</label>
                      <input
                        type="number"
                        placeholder="Price (₹)"
                        value={planPrice}
                        onChange={(e) => setPlanPrice(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase font-mono">Daily ROI (₹)</label>
                      <input
                        type="number"
                        placeholder="Daily ROI (₹)"
                        value={planIncome}
                        onChange={(e) => setPlanIncome(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase font-mono">Duration (Days)</label>
                      <input
                        type="number"
                        placeholder="Duration (Days)"
                        value={planDuration}
                        onChange={(e) => setPlanDuration(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase font-mono">Hashrate</label>
                      <input
                        type="text"
                        placeholder="Hash Power (e.g. 115 TH/s)"
                        value={planHashrate}
                        onChange={(e) => setPlanHashrate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase font-mono">Category Pool</label>
                    <select
                      value={planCategory}
                      onChange={(e) => setPlanCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-300 animate-none"
                    >
                      <option value="Normal">Normal Pool</option>
                      <option value="VIP">VIP Pool</option>
                      <option value="Premium">Premium Pool</option>
                      <option value="Exclusive">Exclusive Pool</option>
                    </select>
                  </div>

                  {/* Image/Photo fields */}
                  <div className="space-y-2 border-t border-slate-800/80 pt-2">
                    <label className="text-[10px] font-bold text-slate-400 block uppercase font-mono">Product Photo URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Paste image URL..."
                        value={planImageUrl}
                        onChange={(e) => setPlanImageUrl(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 text-xxs font-mono"
                      />
                      {planImageUrl && (
                        <img 
                          src={planImageUrl} 
                          alt="Preview" 
                          className="w-9 h-9 rounded object-cover border border-slate-800 bg-slate-950" 
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                    
                    <div className="space-y-1.5">
                      <span className="text-[9px] text-slate-500 block font-sans">Quick-select model preset image:</span>
                      <div className="grid grid-cols-3 gap-1">
                        {PHOTO_PRESETS.map((preset) => (
                          <button
                            key={preset.url}
                            type="button"
                            onClick={() => setPlanImageUrl(preset.url)}
                            className={`px-1 py-1 text-[9px] rounded font-bold border transition-all truncate text-center ${
                              planImageUrl === preset.url 
                                ? "bg-orange-600/20 text-orange-400 border-orange-500" 
                                : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                            }`}
                            title={preset.name}
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2 border-t border-slate-800/80">
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
                    Publish Miner
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Edit Plan Modal */}
          {editingPlan && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-sans">
              <form
                onSubmit={handleEditPlanSubmit}
                className="bg-slate-900 border border-slate-800 rounded-[24px] max-w-sm w-full p-5 relative shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Settings className="text-orange-500" size={16} /> Edit Mining Machine
                  </h3>
                  <p className="text-xxs text-slate-500">Modify properties or product photos below</p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase font-mono">Machine Name</label>
                    <input
                      type="text"
                      placeholder="Machine Name"
                      value={editPlanName}
                      onChange={(e) => setEditPlanName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase font-mono">Price (₹)</label>
                      <input
                        type="number"
                        placeholder="Price"
                        value={editPlanPrice}
                        onChange={(e) => setEditPlanPrice(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase font-mono">Daily ROI (₹)</label>
                      <input
                        type="number"
                        placeholder="Daily ROI"
                        value={editPlanIncome}
                        onChange={(e) => setEditPlanIncome(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase font-mono">Duration (Days)</label>
                      <input
                        type="number"
                        placeholder="Duration"
                        value={editPlanDuration}
                        onChange={(e) => setEditPlanDuration(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase font-mono">Hashrate</label>
                      <input
                        type="text"
                        placeholder="Hash Power"
                        value={editPlanHashrate}
                        onChange={(e) => setEditPlanHashrate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase font-mono">Category Pool</label>
                    <select
                      value={editPlanCategory}
                      onChange={(e) => setEditPlanCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-300 animate-none"
                    >
                      <option value="Normal">Normal Pool</option>
                      <option value="VIP">VIP Pool</option>
                      <option value="Premium">Premium Pool</option>
                      <option value="Exclusive">Exclusive Pool</option>
                    </select>
                  </div>

                  {/* Image/Photo fields for editing */}
                  <div className="space-y-2 border-t border-slate-800/80 pt-2">
                    <label className="text-[10px] font-bold text-slate-400 block uppercase font-mono">Product Photo URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Paste image URL..."
                        value={editPlanImageUrl}
                        onChange={(e) => setEditPlanImageUrl(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 text-xxs font-mono"
                      />
                      {editPlanImageUrl && (
                        <img 
                          src={editPlanImageUrl} 
                          alt="Preview" 
                          className="w-9 h-9 rounded object-cover border border-slate-800 bg-slate-950" 
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[9px] text-slate-500 block font-sans">Quick-select model preset image:</span>
                      <div className="grid grid-cols-3 gap-1">
                        {PHOTO_PRESETS.map((preset) => (
                          <button
                            key={preset.url}
                            type="button"
                            onClick={() => setEditPlanImageUrl(preset.url)}
                            className={`px-1 py-1 text-[9px] rounded font-bold border transition-all truncate text-center ${
                              editPlanImageUrl === preset.url 
                                ? "bg-orange-600/20 text-orange-400 border-orange-500" 
                                : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                            }`}
                            title={preset.name}
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setEditingPlan(null)}
                    className="flex-1 py-2 bg-slate-950 text-slate-400 font-semibold text-xs rounded-lg border border-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-lg shadow-lg"
                  >
                    Save Changes
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
                      <p className="text-slate-500 text-xxs font-mono">ID: {t.id} • {t.userFullName || "Member"} ({t.userMobile || "no mobile"})</p>
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
                        {t.messages?.map((m: any, idx: number) => {
                          const isAdmin = m.senderId === "system" || m.senderId === "admin-id" || m.senderId === "admin" || m.senderName?.toLowerCase().includes("admin");
                          return (
                            <div
                              key={idx}
                              className={`flex flex-col max-w-[85%] space-y-1 ${isAdmin ? "ml-auto items-end" : "mr-auto items-start"}`}
                            >
                              <span className="text-slate-500 text-[10px]">{m.senderName}</span>
                              <div className={`p-2.5 rounded-xl text-xxs leading-normal ${
                                isAdmin ? "bg-orange-600 text-white rounded-tr-none" : "bg-slate-950 text-slate-300 rounded-tl-none"
                              }`}>
                                {m.content || m.message}
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

      {/* 9. Announcements Tab */}
      {activeTab === "announcements" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Broadcast News & Notices</h3>
            <button
              onClick={() => setShowAnnModal(true)}
              className="text-xs text-orange-500 hover:underline font-bold flex items-center gap-1"
            >
              <Plus size={14} /> New Broadcast
            </button>
          </div>

          {announcementsList.length === 0 ? (
            <div className="p-6 text-center bg-slate-900/30 border border-slate-800 rounded-2xl text-slate-500 text-xs">
              No general notices or announcements published.
            </div>
          ) : (
            <div className="space-y-3.5">
              {announcementsList.map((ann) => (
                <div key={ann.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-200">{ann.title}</h4>
                      <p className="text-slate-500 text-[10px] mt-0.5">{new Date(ann.createdAt).toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => onDeleteAnnouncement(ann.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-950 rounded-md transition-all"
                      title="Remove announcement"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-xxs p-2 bg-slate-950 rounded-xl">
                    {ann.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* New Announcement modal */}
          {showAnnModal && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <form
                onSubmit={handleAnnSubmit}
                className="bg-slate-900 border border-slate-800 rounded-[24px] max-w-sm w-full p-5 relative shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Create General Notice</h3>
                  <p className="text-xxs text-slate-500">This will marquee scroll on all member dashboard homescreens</p>
                </div>

                <div className="space-y-2.5 text-xs">
                  <input
                    type="text"
                    placeholder="Notice Title (e.g. Server Maintenance)"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 focus:outline-none"
                    required
                  />
                  <textarea
                    placeholder="Write announcement body message..."
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 focus:outline-none"
                    required
                  />
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAnnModal(false)}
                    className="flex-1 py-2 bg-slate-950 text-slate-400 font-semibold text-xs rounded-lg border border-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-lg shadow-lg flex items-center justify-center gap-1"
                  >
                    <Megaphone size={12} /> Post Broadcast
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 10. Direct / Broadcast Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Broadcaster Centre</h3>
          
          <form onSubmit={handleBroadcastAlertSubmit} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs space-y-3">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                <Volume2 size={14} className="text-orange-500" /> Global Push Broadcast
              </h4>
              <p className="text-xxs text-slate-500">Transmits a personal inbox alert notification to all registered users</p>
            </div>

            <div className="space-y-2 text-xs">
              <input
                type="text"
                placeholder="Broadcast Notification Title"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 focus:outline-none"
                required
              />
              <textarea
                placeholder="Write message to send globally..."
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow-lg shadow-orange-950/25 transition-colors"
            >
              <Send size={12} /> Broadcast to All Users
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
