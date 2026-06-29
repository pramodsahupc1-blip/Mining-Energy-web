import React, { useState, useEffect } from "react";
import { 
  Home, Cpu, Users, Wallet, HelpCircle, LogOut, Bell, Settings, ShieldAlert, X
} from "lucide-react";

import { 
  User, Wallet as WalletType, MiningPlan, Investment, Transaction, 
  SupportTicket, Announcement, NotificationItem 
} from "./types";

import AuthView from "./components/AuthView";
import HomeView from "./components/HomeView";
import ShopView from "./components/ShopView";
import MyInvestmentsView from "./components/MyInvestmentsView";
import TeamView from "./components/TeamView";
import WalletView from "./components/WalletView";
import SupportView from "./components/SupportView";
import AdminView from "./components/AdminView";
import { api } from "./lib/api";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("mining_token"));
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<WalletType | null>(null);
  
  // Navigation
  const [activeTab, setActiveTab] = useState<string>("home");

  // Notifications Drawer
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // App General Data
  const [plans, setPlans] = useState<MiningPlan[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState({
    activeInvestmentsCount: 0,
    totalMembers: 12040,
    totalInvestments: 2845000,
    totalWithdrawals: 492000,
  });

  // Admin Specific Data
  const [adminStats, setAdminStats] = useState<any>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminRecharges, setAdminRecharges] = useState<any[]>([]);
  const [adminWithdrawals, setAdminWithdrawals] = useState<any[]>([]);
  const [adminTickets, setAdminTickets] = useState<any[]>([]);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [loadingCollect, setLoadingCollect] = useState(false);
  const [loadingCheckIn, setLoadingCheckIn] = useState(false);
  const [loadingTicket, setLoadingTicket] = useState(false);

  // Initial Bootup
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        localStorage.setItem("mining_token", authUser.uid);
        setToken(authUser.uid);
        fetchUserData();
      } else {
        localStorage.removeItem("mining_token");
        setToken(null);
        setLoading(false);
      }
    });
    // Fetch global available plans
    fetchPlans();
    return () => unsub();
  }, []);

  // Real-time Balance and Stat Polling every 4 seconds
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      silentFetchUserData();
    }, 4000);
    return () => clearInterval(interval);
  }, [token]);

  // Fetch core user data
  const fetchUserData = async () => {
    try {
      const data = await api.getMe();
      setUser(data.user as any);
      setWallet(data.wallet as any);
      
      // Fetch user personal arrays
      await refreshUserArrays();

      if ((data.user as any).role === "admin") {
        await fetchAdminData();
      }
    } catch (err) {
      console.error("Error booting user session", err);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  // Silent update for smooth real-time earnings ticking
  const silentFetchUserData = async () => {
    if (!token) return;
    try {
      const data = await api.getMe();
      setWallet(data.wallet as any);
    } catch (err) {
      console.error("Silent polling failed", err);
    }
  };

  const refreshUserArrays = async () => {
    if (!token) return;
    try {
      const invData = await api.getInvestments();
      setInvestments(invData as any);

      const txData = await api.getTransactions();
      setTransactions(txData as any);

      const notData = await api.getNotifications();
      setNotifications(notData as any);

      const tData = await api.getTickets();
      setTickets(tData as any);
    } catch (err) {
      console.error("Error refreshing active datasets", err);
    }
  };

  const fetchPlans = async () => {
    try {
      const plansData = await api.getPlans();
      setPlans(plansData as any);
    } catch (err) {
      console.error("Error fetching market pools", err);
    }
  };

  const fetchAdminData = async () => {
    if (!token) return;
    try {
      const stats = await api.adminGetStats();
      setAdminStats(stats);
      setAdminUsers(await api.adminGetUsers());
      setAdminRecharges(await api.adminGetRecharges());
      setAdminWithdrawals(await api.adminGetWithdrawals());
      setAdminTickets(await api.adminGetTickets());
    } catch (err) {
      console.error("Admin data hydration failure", err);
    }
  };

  // User Interactive Actions
  const handleLoginSuccess = (newToken: string, loggedInUser: any) => {
    // we use token as uid now since we use firebase auth state directly
    localStorage.setItem("mining_token", newToken);
    setToken(newToken);
    setUser(loggedInUser);
    setActiveTab("home");
  };

  const handleLogout = async () => {
    await api.logout();
    localStorage.removeItem("mining_token");
    setToken(null);
    setUser(null);
    setWallet(null);
    setAdminStats(null);
    setActiveTab("home");
  };

  const handleCheckIn = async () => {
    setLoadingCheckIn(true);
    try {
      const result = await api.checkIn();
      if (result.success) {
        alert(result.message);
        await silentFetchUserData();
        await refreshUserArrays();
      }
    } catch (err: any) {
      alert(err.message || "Error reaching verification server");
    } finally {
      setLoadingCheckIn(false);
    }
  };

  const handleBuyPlan = async (planId: string) => {
    setLoadingPlanId(planId);
    try {
      const result = await api.buyPlan(planId);
      alert(result.message);
      if (result.success) {
        await silentFetchUserData();
        await refreshUserArrays();
        setActiveTab("investments");
      }
    } catch (err: any) {
      alert(err.message || "Error processing machine activation");
    } finally {
      setLoadingPlanId(null);
    }
  };

  const handleCollectYield = async () => {
    setLoadingCollect(true);
    try {
      const result = await api.collectYield();
      if (result.success) {
        alert(result.message);
        await silentFetchUserData();
        await refreshUserArrays();
      }
    } catch (err: any) {
      alert(err.message || "Collector connection failed");
    } finally {
      setLoadingCollect(false);
    }
  };

  const handleRecharge = async (amount: number, method: string, reference: string) => {
    setLoadingAction(true);
    try {
      const result = await api.recharge(amount, method, reference);
      alert(result.message);
      if (result.success) {
        await refreshUserArrays();
      }
    } catch (err: any) {
      alert(err.message || "Deposit queue failed");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleWithdraw = async (payload: any) => {
    setLoadingAction(true);
    try {
      const result = await api.withdraw(payload);
      alert(result.message);
      if (result.success) {
        await silentFetchUserData();
        await refreshUserArrays();
      }
    } catch (err: any) {
      alert(err.message || "Withdraw gateway exception");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCreateTicket = async (subject: string, message: string) => {
    setLoadingTicket(true);
    try {
      const result = await api.createTicket(subject, message);
      if (result.success) {
        alert("Ticket created");
        await refreshUserArrays();
      }
    } catch (err: any) {
      alert(err.message || "Ticketing failed");
    } finally {
      setLoadingTicket(false);
    }
  };

  const handleSendReply = async (ticketId: string, message: string) => {
    setLoadingTicket(true);
    try {
      const result = await api.replyTicket(ticketId, message);
      if (result.success) {
        await refreshUserArrays();
        if (user?.role === "admin") {
          await fetchAdminData();
        }
      }
    } catch (err: any) {
      alert(err.message || "Reply transmitter failed");
    } finally {
      setLoadingTicket(false);
    }
  };

  // Administrative Operations
  const handleVerifyRecharge = async (id: string, status: "SUCCESS" | "FAILED") => {
    try {
      await api.adminVerifyRecharge(id, status);
      await fetchAdminData();
    } catch (err) {
      alert("Error executing recharge verification");
    }
  };

  const handleVerifyWithdrawal = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      await api.adminVerifyWithdrawal(id, status);
      await fetchAdminData();
    } catch (err) {
      alert("Error executing withdrawal verification");
    }
  };

  const handleAdjustBalance = async (userId: string, amount: number, type: "available" | "earnings") => {
    try {
      await api.adminAdjustBalance(userId, amount, type);
      await fetchAdminData();
    } catch (err) {
      alert("Error transmitting manual adjustment");
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    try {
      await api.adminUpdateTicketStatus(ticketId, status);
      await fetchAdminData();
      await refreshUserArrays();
    } catch (err) {
      alert("Status update failed");
    }
  };

  const handleCreatePlan = async (plan: any) => {
    try {
      await api.adminCreatePlan(plan);
      await fetchPlans();
      await fetchAdminData();
    } catch (err) {
      alert("Model publication exception");
    }
  };

  const handleMarkNotificationsRead = async () => {
    setIsNotifOpen(true);
    try {
      await api.markNotifsRead();
      const notData = await api.getNotifications();
      setNotifications(notData as any);
    } catch (err) {
      console.error(err);
    }
  };

  // --- Rendering States ---
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-xs font-semibold tracking-widest uppercase animate-pulse">
          Initializing Mining Energy Grid
        </p>
      </div>
    );
  }

  if (!token || !user || !wallet) {
    return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col pb-24 max-w-lg mx-auto border-x border-slate-900 shadow-2xl relative">
      {/* 1. Header Top App Bar */}
      <header className="sticky top-0 bg-slate-950/90 backdrop-blur-md border-b border-slate-900 px-5 py-4 flex justify-between items-center z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-extrabold text-sm">
            ME
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xs font-bold text-white tracking-wide uppercase">MINING ENERGY</h1>
            <p className="text-slate-500 text-xxs font-mono truncate max-w-[150px]">
              {user.fullName} ({user.role === "admin" ? "Admin" : "Miner"})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Admin shortcut button */}
          {user.role === "admin" && (
            <button
              onClick={() => setActiveTab(activeTab === "admin" ? "home" : "admin")}
              className={`p-2 rounded-xl border transition-all flex items-center gap-1 ${
                activeTab === "admin" 
                  ? "bg-orange-500/15 text-orange-400 border-orange-500/20" 
                  : "bg-slate-900 text-slate-400 border-slate-800"
              }`}
              title="Toggle master console"
            >
              <Settings size={16} />
              <span className="text-[10px] font-bold">Console</span>
            </button>
          )}

          {/* Notifications button */}
          <button
            onClick={handleMarkNotificationsRead}
            className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl relative transition-colors"
            title="Read alerts"
          >
            <Bell size={16} />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full animate-ping" />
            )}
          </button>
        </div>
      </header>

      {/* 2. Central Main Content Screen Area */}
      <main className="flex-1 p-5 overflow-y-auto">
        {activeTab === "home" && (
          <HomeView
            wallet={wallet}
            stats={stats}
            banners={[
              { id: "b1", title: "Quantum Computing ASIC Grid", text: "Rent Super Nodes to earn +25% daily yields.", imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80" },
              { id: "b2", title: "Daily Loyalty Checking", text: "Click Daily Check-In to claim your free ₹20.", imageUrl: "https://images.unsplash.com/photo-1605792657660-596af9009e82?auto=format&fit=crop&w=800&q=80" }
            ]}
            announcements={announcements}
            onCheckIn={handleCheckIn}
            onNavigate={setActiveTab}
            loadingCheckIn={loadingCheckIn}
          />
        )}

        {activeTab === "shop" && (
          <ShopView
            plans={plans}
            userBalance={wallet.available}
            onBuyPlan={handleBuyPlan}
            loadingPlanId={loadingPlanId}
          />
        )}

        {activeTab === "investments" && (
          <MyInvestmentsView
            investments={investments}
            onCollectYield={handleCollectYield}
            loadingCollect={loadingCollect}
          />
        )}

        {activeTab === "team" && (
          <TeamView
            referralCode={user.referralCode}
            referralLink={`${window.location.origin}/?ref=${user.referralCode}`}
            stats={{
              level1Count: stats.activeInvestmentsCount > 0 ? 3 : 0, // Mock direct team for high-fidelity aesthetics
              level2Count: stats.activeInvestmentsCount > 0 ? 5 : 0,
              level3Count: stats.activeInvestmentsCount > 0 ? 12 : 0,
              directMiners: stats.activeInvestmentsCount > 0 ? 2 : 0,
              totalTeamMiners: stats.activeInvestmentsCount > 0 ? 8 : 0,
              totalCommissionEarned: transactions.filter(t => t.type === "REFERRAL_COMMISSION").reduce((sum, t) => sum + t.amount, 0),
            }}
            team={{
              level1: stats.activeInvestmentsCount > 0 ? [
                { id: "m1", fullName: "Rahul Sharma", mobile: "9876543210", dateJoined: new Date(Date.now() - 48 * 3600 * 1000).toISOString() },
                { id: "m2", fullName: "Priya Patel", mobile: "8765432109", dateJoined: new Date(Date.now() - 24 * 3600 * 1000).toISOString() },
                { id: "m3", fullName: "Amit Verma", mobile: "7654321098", dateJoined: new Date().toISOString() },
              ] : [],
              level2: stats.activeInvestmentsCount > 0 ? [
                { id: "m4", fullName: "Sneha Reddy", mobile: "9555121212", dateJoined: new Date(Date.now() - 72 * 3600 * 1000).toISOString() }
              ] : [],
              level3: []
            }}
          />
        )}

        {activeTab === "wallet" && (
          <WalletView
            wallet={wallet}
            transactions={transactions}
            onRecharge={handleRecharge}
            onWithdraw={handleWithdraw}
            loadingAction={loadingAction}
          />
        )}

        {activeTab === "support" && (
          <SupportView
            tickets={tickets}
            onCreateTicket={handleCreateTicket}
            onSendReply={handleSendReply}
            loadingTicket={loadingTicket}
          />
        )}

        {activeTab === "admin" && user.role === "admin" && (
          <AdminView
            adminStats={adminStats}
            usersList={adminUsers}
            rechargesList={adminRecharges}
            withdrawalsList={adminWithdrawals}
            ticketsList={adminTickets}
            plansList={plans}
            onVerifyRecharge={handleVerifyRecharge}
            onVerifyWithdrawal={handleVerifyWithdrawal}
            onAdjustBalance={handleAdjustBalance}
            onReplyTicket={handleSendReply}
            onUpdateTicketStatus={handleUpdateTicketStatus}
            onCreatePlan={handleCreatePlan}
            onRefreshAdminData={fetchAdminData}
          />
        )}
      </main>

      {/* 3. Bottom Screen Navigation Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-900 py-3.5 px-2 flex justify-around max-w-lg mx-auto z-40">
        <button
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center gap-1.5 text-slate-500 transition-all ${
            activeTab === "home" ? "text-orange-500 scale-105" : "hover:text-slate-300"
          }`}
        >
          <Home size={18} />
          <span className="text-[10px] font-bold">Home</span>
        </button>

        <button
          onClick={() => setActiveTab("shop")}
          className={`flex flex-col items-center gap-1.5 text-slate-500 transition-all ${
            activeTab === "shop" ? "text-orange-500 scale-105" : "hover:text-slate-300"
          }`}
        >
          <Cpu size={18} />
          <span className="text-[10px] font-bold">Shop</span>
        </button>

        <button
          onClick={() => setActiveTab("investments")}
          className={`flex flex-col items-center gap-1.5 text-slate-500 transition-all ${
            activeTab === "investments" ? "text-orange-500 scale-105" : "hover:text-slate-300"
          }`}
        >
          <Settings size={18} />
          <span className="text-[10px] font-bold">My Rigs</span>
        </button>

        <button
          onClick={() => setActiveTab("team")}
          className={`flex flex-col items-center gap-1.5 text-slate-500 transition-all ${
            activeTab === "team" ? "text-orange-500 scale-105" : "hover:text-slate-300"
          }`}
        >
          <Users size={18} />
          <span className="text-[10px] font-bold">Network</span>
        </button>

        <button
          onClick={() => setActiveTab("wallet")}
          className={`flex flex-col items-center gap-1.5 text-slate-500 transition-all ${
            activeTab === "wallet" ? "text-orange-500 scale-105" : "hover:text-slate-300"
          }`}
        >
          <Wallet size={18} />
          <span className="text-[10px] font-bold">Wallet</span>
        </button>

        <button
          onClick={() => setActiveTab("support")}
          className={`flex flex-col items-center gap-1.5 text-slate-500 transition-all ${
            activeTab === "support" ? "text-orange-500 scale-105" : "hover:text-slate-300"
          }`}
        >
          <HelpCircle size={18} />
          <span className="text-[10px] font-bold">Support</span>
        </button>

        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1.5 text-slate-500 hover:text-rose-400 transition-colors"
          title="Sign out of your session"
        >
          <LogOut size={18} />
          <span className="text-[10px] font-bold">Logout</span>
        </button>
      </nav>

      {/* 4. Notifications Fullscreen Overlay Modal */}
      {isNotifOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-[28px] max-w-sm w-full p-6 relative max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsNotifOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 p-1"
            >
              <X size={20} />
            </button>

            <div className="space-y-1 pb-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">System Alerts &amp; Notifications</h3>
              <p className="text-xxs text-slate-500">Inbox transactions logs</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3.5 py-4 pr-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Your inbox notification is currently empty.
                </div>
              ) : (
                notifications.map((not) => (
                  <div
                    key={not.id}
                    className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1.5 text-xs"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-200">{not.title}</h4>
                      <span className="text-slate-600 text-xxs font-mono">
                        {new Date(not.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xxs leading-relaxed font-sans">{not.message}</p>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setIsNotifOpen(false)}
              className="w-full py-3 bg-slate-950 hover:bg-slate-950/50 text-slate-400 font-semibold text-xs rounded-xl border border-slate-800 transition-colors"
            >
              Close Inbox
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
