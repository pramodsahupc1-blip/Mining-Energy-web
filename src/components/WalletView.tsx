import React, { useState, useEffect } from "react";
import { 
  Wallet, RefreshCw, Copy, ArrowDownLeft, ArrowUpRight, 
  Clock, CheckCircle, XCircle, Landmark, CreditCard, Send, ShieldCheck,
  ArrowLeft, X, Loader2
} from "lucide-react";
import { Wallet as WalletType, Transaction } from "../types";
import { api } from "../lib/api";

interface WalletViewProps {
  wallet: WalletType;
  transactions: Transaction[];
  onRecharge: (amount: number, method: string, reference: string) => Promise<void>;
  onInstantRecharge: (amount: number, method: string) => Promise<void>;
  onWithdraw: (body: {
    amount: number;
    bankName?: string;
    accountHolder?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
  }) => Promise<void>;
  loadingAction: boolean;
}

type WalletTab = "recharge" | "withdraw" | "history";

export default function WalletView({
  wallet,
  transactions,
  onRecharge,
  onInstantRecharge,
  onWithdraw,
  loadingAction,
}: WalletViewProps) {
  const [activeTab, setActiveTab] = useState<WalletTab>("recharge");
  const [historyFilter, setHistoryFilter] = useState<string>("ALL");

  // Recharge State
  const [rechargeAmount, setRechargeAmount] = useState<number>(1500);
  const [upiReference, setUpiReference] = useState<string>("");
  const [rechargeMethod, setRechargeMethod] = useState<string>("UPI");

  // Withdrawal State
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [upiId, setUpiId] = useState<string>("");
  const [bankName, setBankName] = useState<string>("");
  const [accountHolder, setAccountHolder] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [ifscCode, setIfscCode] = useState<string>("");
  const [withdrawMethod, setWithdrawMethod] = useState<"UPI" | "BANK">("UPI");

  const [paymentSettings, setPaymentSettings] = useState({
    upiId: "jinwoosung.jg@oksbi",
    upiIdSecondary: "jinwoosung.jg@oksbi",
    upiName: "UPI Payments"
  });

  useEffect(() => {
    api.getPaymentSettings().then((settings) => {
      if (settings) {
        setPaymentSettings(settings);
      }
    });
  }, []);

  const UPI_RECEIVER_ID_YBL = paymentSettings.upiId;
  const UPI_RECEIVER_ID_FAM = paymentSettings.upiIdSecondary;

  // Instant UPI Gateway States
  const [showUpiGateway, setShowUpiGateway] = useState(false);
  const [selectedUpiApp, setSelectedUpiApp] = useState<string | null>(null);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [autoRefNumber, setAutoRefNumber] = useState("");

  const handleInstantPayNow = async (appName: string) => {
    setSelectedUpiApp(appName);
    setIsSimulatingPayment(true);
    setSimulationStep(0);
    setPaymentSuccess(false);

    const stepDelay = (ms: number) => new Promise(r => setTimeout(r, ms));

    setSimulationStep(1);
    await stepDelay(800);
    setSimulationStep(2);
    await stepDelay(800);
    setSimulationStep(3);
    await stepDelay(800);
    setSimulationStep(4);
    await stepDelay(600);

    try {
      await onInstantRecharge(rechargeAmount, appName);
      
      const ref = "AUTO_UPI_" + Math.random().toString(36).substring(2, 11).toUpperCase();
      setAutoRefNumber(ref);
      setPaymentSuccess(true);
    } catch (err: any) {
      alert(err.message || "Simulated gateway timed out. Please try again.");
    } finally {
      setIsSimulatingPayment(false);
    }
  };

  const handleQuickAmount = (val: number) => {
    setRechargeAmount(val);
  };

  const handleRechargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rechargeAmount || rechargeAmount < 100) {
      alert("Minimum recharge amount is ₹100");
      return;
    }
    if (!upiReference.trim()) {
      alert("Please enter the 12-digit UPI Transaction Ref No.");
      return;
    }
    await onRecharge(rechargeAmount, rechargeMethod, upiReference.trim());
    setUpiReference(""); // Clear input
    setActiveTab("history"); // Redirect to history tab
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(withdrawAmount);
    if (!amountNum || amountNum < 200) {
      alert("Minimum withdrawal is ₹200");
      return;
    }

    const withdrawable = wallet.available + wallet.earnings;
    if (withdrawable < amountNum) {
      alert("Insufficient total withdrawable balance.");
      return;
    }

    if (withdrawMethod === "UPI" && !upiId.trim()) {
      alert("Please enter a valid UPI ID.");
      return;
    }

    if (withdrawMethod === "BANK" && (!bankName.trim() || !accountHolder.trim() || !accountNumber.trim() || !ifscCode.trim())) {
      alert("Please fill in all bank details.");
      return;
    }

    const payload = withdrawMethod === "UPI" 
      ? { amount: amountNum, upiId: upiId.trim() }
      : { amount: amountNum, bankName: bankName.trim(), accountHolder: accountHolder.trim(), accountNumber: accountNumber.trim(), ifscCode: ifscCode.trim() };

    await onWithdraw(payload);
    setWithdrawAmount("");
    setUpiId("");
    setBankName("");
    setAccountHolder("");
    setAccountNumber("");
    setIfscCode("");
    setActiveTab("history");
  };

  // Filter transaction list
  const filteredTransactions = transactions.filter((t) => {
    if (historyFilter === "ALL") return true;
    return t.type === historyFilter;
  });

  return (
    <div className="space-y-6">
      {/* 1. Balances Indicator */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="p-4.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <ArrowDownLeft size={18} />
          </div>
          <div>
            <span className="text-slate-500 text-xxs block">Recharge Funds</span>
            <span className="text-base font-extrabold text-slate-100 font-sans">₹{wallet.available.toFixed(2)}</span>
          </div>
        </div>

        <div className="p-4.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
            <ArrowUpRight size={18} />
          </div>
          <div>
            <span className="text-slate-500 text-xxs block">Withdrawable profits</span>
            <span className="text-base font-extrabold text-slate-100 font-sans">₹{wallet.earnings.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 2. Mode Tabs */}
      <div className="grid grid-cols-3 bg-slate-950 p-1 rounded-2xl border border-slate-800/80">
        <button
          onClick={() => setActiveTab("recharge")}
          className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "recharge" ? "bg-slate-900 text-white shadow-sm border border-slate-850" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          Recharge
        </button>
        <button
          onClick={() => setActiveTab("withdraw")}
          className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "withdraw" ? "bg-slate-900 text-white shadow-sm border border-slate-850" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          Withdraw
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "history" ? "bg-slate-900 text-white shadow-sm border border-slate-850" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          History Logs
        </button>
      </div>

      {/* 3. Recharge Gateway Module */}
      {activeTab === "recharge" && (
        <form onSubmit={handleRechargeSubmit} className="space-y-5">
          {/* Amount input and quick selections */}
          <div className="space-y-3">
            <label className="text-xxs font-bold text-slate-400 uppercase tracking-wider block">Recharge Amount (₹)</label>
            <input
              type="number"
              placeholder="Enter custom deposit amount"
              value={rechargeAmount || ""}
              onChange={(e) => setRechargeAmount(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 px-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors font-mono font-bold text-lg"
              min="100"
            />
            
            {/* Quick chips selection */}
            <div className="flex gap-2 flex-wrap">
              {[300, 700, 1500, 3000, 5000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    rechargeAmount === val
                      ? "bg-orange-600 text-white shadow-sm"
                      : "bg-slate-900 text-slate-400 border border-slate-800/80 hover:border-slate-700"
                  }`}
                >
                  ₹{val.toLocaleString()}
                </button>
              ))}
            </div>

            {/* Instant App Select Trigger */}
            <div className="p-4.5 bg-gradient-to-r from-orange-600/15 via-amber-500/5 to-slate-900/40 border border-orange-500/20 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 mt-2 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-orange-400 font-bold text-xs uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>⚡ Instant Pay (Automatic Credit)</span>
                </div>
                <p className="text-slate-300 text-xs font-medium leading-relaxed">
                  Select your UPI app directly to deposit instantly. No need to upload screenshots or wait for manual approvals.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!rechargeAmount || rechargeAmount < 100) {
                    alert("Minimum recharge amount is ₹100");
                    return;
                  }
                  setShowUpiGateway(true);
                }}
                className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap self-stretch sm:self-auto"
              >
                Pay via UPI App Now
              </button>
            </div>
          </div>

          {/* Payment Method instructions */}
          <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-[22px] space-y-4">
            <div className="flex items-center gap-2 text-slate-300 text-xs font-bold uppercase tracking-wider">
              <Landmark size={16} className="text-orange-500" />
              <span>Step 1: Send Money to Platform UPI</span>
            </div>

            {/* Dynamic QR Code Card */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden">
              {/* Decorative subtle ambient light */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-2 z-10">
                <span className="bg-orange-500/10 text-orange-400 p-1.5 rounded-lg">
                  <Landmark size={14} />
                </span>
                <div className="text-left">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">{paymentSettings.upiName || "NSDL PAYMENTS BANK"}</span>
                  <span className="text-xs text-slate-200 font-bold">Official Payment QR</span>
                </div>
              </div>

              {/* QR Code Frame */}
              <div className="relative p-3 bg-white rounded-2xl shadow-xl shadow-black/40 border border-slate-100 flex flex-col items-center">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=${UPI_RECEIVER_ID_YBL}&pn=${encodeURIComponent(paymentSettings.upiName || "Official Receiver")}&cu=INR&am=${rechargeAmount}`)}`}
                  alt="UPI Payment QR Code"
                  className="w-40 h-40 object-contain"
                  referrerPolicy="no-referrer"
                />
                <div className="mt-2.5 flex items-center justify-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full text-[10px] font-bold text-slate-800">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  <span>Pay Amount: ₹{rechargeAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1 z-10">
                <p className="font-mono text-xs font-bold text-slate-300">{UPI_RECEIVER_ID_YBL}</p>
                <p className="text-[10px] text-slate-500 max-w-[200px] leading-relaxed mx-auto">
                  Scan QR with PhonePe, Google Pay, Paytm, or BHIM for instant automatic crediting.
                </p>
              </div>
            </div>
            
            <p className="text-xxs text-slate-500 leading-normal">
              Note: Open your preferred financial app, scan the QR code above, and input the 12-digit transaction index / ref number.
            </p>
          </div>

          {/* Step 2: Input reference ID */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">
              <CreditCard size={16} className="text-orange-500" />
              <span>Step 2: Enter UPI Transaction ID</span>
            </div>
            <input
              type="text"
              placeholder="e.g. 12-digit Ref No. / Txn ID"
              value={upiReference}
              onChange={(e) => setUpiReference(e.target.value.replace(/\s/g, ""))}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 px-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors font-mono font-semibold"
            />
          </div>

          <button
            type="submit"
            disabled={loadingAction}
            className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-orange-950/20 hover:shadow-orange-600/10 transition-all flex items-center justify-center gap-2"
          >
            {loadingAction ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <>
                <Send size={14} />
                <span>Submit Recharge Request</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* 4. Withdrawal Gateway Module */}
      {activeTab === "withdraw" && (
        <form onSubmit={handleWithdrawSubmit} className="space-y-4">
          <div className="space-y-1">
            <span className="text-xxs font-bold text-slate-500 block uppercase tracking-wider">Total withdrawable Balance</span>
            <p className="text-2xl font-extrabold text-white">₹{(wallet.available + wallet.earnings).toFixed(2)}</p>
          </div>

          {/* Amount field */}
          <div className="space-y-1.5">
            <label className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Withdrawal Amount (₹)</label>
            <input
              type="number"
              placeholder="Min. withdrawal amount ₹200"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 px-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors font-mono font-bold"
              min="200"
            />
          </div>

          {/* Method Selector */}
          <div className="space-y-2">
            <label className="text-xxs font-bold text-slate-400 uppercase tracking-wider block">Transfer Channel</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-850">
              <button
                type="button"
                onClick={() => setWithdrawMethod("UPI")}
                className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                  withdrawMethod === "UPI" ? "bg-slate-900 text-white border border-slate-800" : "text-slate-500"
                }`}
              >
                UPI Account
              </button>
              <button
                type="button"
                onClick={() => setWithdrawMethod("BANK")}
                className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                  withdrawMethod === "BANK" ? "bg-slate-900 text-white border border-slate-800" : "text-slate-500"
                }`}
              >
                Bank Transfer
              </button>
            </div>
          </div>

          {/* Form details based on selection */}
          {withdrawMethod === "UPI" ? (
            <div className="space-y-1.5">
              <label className="text-xxs font-bold text-slate-400 uppercase tracking-wider">UPI ID Address</label>
              <input
                type="text"
                placeholder="e.g. mobile@ybl or account@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 px-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          ) : (
            <div className="space-y-3 p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. State Bank of India"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 rounded-xl py-2 px-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Holder Name</label>
                <input
                  type="text"
                  placeholder="Beneficiary Full Name"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 rounded-xl py-2 px-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Number</label>
                  <input
                    type="text"
                    placeholder="Account Number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded-xl py-2 px-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">IFSC Code</label>
                  <input
                    type="text"
                    placeholder="11-digit IFSC"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-900 border border-slate-850 rounded-xl py-2 px-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500 font-mono uppercase"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Secure gateway confirmation */}
          <div className="flex gap-2 p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-500 text-xxs leading-normal">
            <ShieldCheck size={14} className="text-slate-400 shrink-0 mt-0.5" />
            <p>
              Withdrawals are queued and processed. Payments are dispatched within 24 operational hours. Ensure correct accounts to prevent asset failures.
            </p>
          </div>

          <button
            type="submit"
            disabled={loadingAction || !withdrawAmount}
            className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-orange-950/20 hover:shadow-orange-600/10 transition-all flex items-center justify-center gap-2"
          >
            {loadingAction ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <>
                <Send size={14} />
                <span>Confirm &amp; Withdraw Funds</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* 5. Transaction History List */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {["ALL", "RECHARGE", "WITHDRAWAL", "YIELD", "CHECKIN", "REFERRAL_COMMISSION"].map((cat) => (
              <button
                key={cat}
                onClick={() => setHistoryFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-xxs font-bold whitespace-nowrap transition-colors ${
                  historyFilter === cat
                    ? "bg-slate-200 text-slate-950 font-extrabold"
                    : "bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700"
                }`}
              >
                {cat.replace("_", " ")}
              </button>
            ))}
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/30 border border-slate-800/80 rounded-2xl">
              <p className="text-slate-500 text-xs">No transactions found under this category.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredTransactions.map((tx) => {
                const date = new Date(tx.createdAt).toLocaleDateString();
                const time = new Date(tx.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

                const isCredit = tx.type === "RECHARGE" || tx.type === "YIELD" || tx.type === "CHECKIN" || tx.type === "REFERRAL_COMMISSION";

                return (
                  <div
                    key={tx.id}
                    className="p-3.5 bg-slate-900 border border-slate-800/80 rounded-2xl flex justify-between items-center text-xs"
                  >
                    <div className="space-y-1 max-w-[65%]">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          tx.status === "PENDING" ? "bg-amber-400" :
                          tx.status === "SUCCESS" ? "bg-emerald-400" :
                          "bg-rose-400"
                        }`} />
                        <h4 className="font-bold text-slate-200 truncate">{tx.description}</h4>
                      </div>
                      <p className="text-slate-500 text-xxs font-mono flex items-center gap-1">
                        <span>{date} {time}</span>
                        <span>•</span>
                        <span>Ref: {tx.reference ? tx.reference.substring(0, 10) : "N/A"}</span>
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <span className={`font-mono font-bold text-sm ${isCredit ? "text-emerald-400" : "text-rose-400"}`}>
                        {isCredit ? "+" : "-"}₹{tx.amount.toFixed(2)}
                      </span>
                      
                      <div className="flex items-center gap-1 justify-end">
                        {tx.status === "PENDING" && (
                          <span className="text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded-md text-[10px] font-semibold border border-amber-500/10 flex items-center gap-0.5">
                            <Clock size={10} /> Pending
                          </span>
                        )}
                        {tx.status === "SUCCESS" && (
                          <span className="text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded-md text-[10px] font-semibold border border-emerald-500/10 flex items-center gap-0.5">
                            <CheckCircle size={10} /> Success
                          </span>
                        )}
                        {tx.status === "FAILED" && (
                          <span className="text-rose-400 bg-rose-500/5 px-2 py-0.5 rounded-md text-[10px] font-semibold border border-rose-500/10 flex items-center gap-0.5">
                            <XCircle size={10} /> Failed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SIMULATED PHONE GATEWAY OVERLAY */}
      {showUpiGateway && (
        <div className="fixed inset-0 z-50 bg-[#060a12]/95 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
          {/* Phone Mockup Body */}
          <div className="w-full max-w-md bg-[#0a0f1d] text-slate-100 rounded-none sm:rounded-[40px] border-0 sm:border-8 sm:border-slate-800 shadow-2xl relative overflow-hidden flex flex-col min-h-[100dvh] sm:min-h-[750px] max-h-[100dvh] sm:max-h-[850px] font-sans">
            
            {/* Status Bar */}
            <div className="flex justify-between items-center px-6 pt-3 pb-2 text-[11px] font-semibold text-slate-400 font-mono tracking-wider select-none">
              <span>
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] bg-slate-800 text-slate-300 px-1 py-0.2 rounded font-sans">5G</span>
                <div className="flex gap-0.5 items-end h-2.5">
                  <span className="w-0.5 h-1 bg-slate-400 rounded-full" />
                  <span className="w-0.5 h-1.5 bg-slate-400 rounded-full" />
                  <span className="w-0.5 h-2 bg-slate-400 rounded-full" />
                  <span className="w-0.5 h-2.5 bg-slate-400 rounded-full" />
                </div>
                <span className="text-[10px]">82%</span>
                <div className="w-5 h-2.5 border border-slate-500 rounded-sm p-0.5 flex items-center">
                  <div className="w-full h-full bg-slate-400 rounded-2xs" />
                </div>
              </div>
            </div>

            {/* Back and Close Header */}
            <div className="flex justify-between items-center px-4 py-2 border-b border-slate-900">
              <button 
                type="button"
                onClick={() => {
                  if (!isSimulatingPayment && !paymentSuccess) {
                    setShowUpiGateway(false);
                  }
                }}
                disabled={isSimulatingPayment}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
              >
                <ArrowLeft size={16} />
                <span>Back to details</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  if (!isSimulatingPayment) {
                    setShowUpiGateway(false);
                    setPaymentSuccess(false);
                  }
                }}
                disabled={isSimulatingPayment}
                className="p-1.5 hover:bg-slate-900 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col justify-between">
              
              {!paymentSuccess ? (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  
                  {/* Paying Merchant Details */}
                  <div className="space-y-1.5 text-center my-auto py-4">
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Paying Merchant</span>
                    <h3 className="text-xl font-extrabold text-white tracking-tight">
                      Airtel Payments Bank Limited
                    </h3>
                    <div className="text-4xl font-extrabold text-white font-sans py-2">
                      ₹{rechargeAmount.toFixed(2)}
                    </div>
                    <span className="text-xs italic text-slate-400 font-medium block">
                      "Instant UPI Scan"
                    </span>
                  </div>

                  {/* UPI Apps selection section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        SELECT UPI PAYMENT APP
                      </span>
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    </div>

                    <div className="space-y-3">
                      {/* PhonePe */}
                      <div className="bg-[#12192c] border border-slate-800/60 rounded-2xl p-4 flex items-center justify-between hover:border-purple-500/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-600/20 text-purple-400 rounded-full flex items-center justify-center font-bold text-lg border border-purple-500/20">
                            P
                          </div>
                          <div className="text-left">
                            <span className="text-xs text-slate-200 font-bold block uppercase tracking-wider">PhonePe</span>
                            <span className="text-[10px] text-slate-400">Pay securely with @ybl handler</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleInstantPayNow("PhonePe")}
                          className="text-xs font-extrabold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer py-1 px-3 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg"
                        >
                          Pay Now
                        </button>
                      </div>

                      {/* Google Pay */}
                      <div className="bg-[#12192c] border border-slate-800/60 rounded-2xl p-4 flex items-center justify-between hover:border-blue-500/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center font-bold text-lg border border-blue-500/20">
                            G
                          </div>
                          <div className="text-left">
                            <span className="text-xs text-slate-200 font-bold block uppercase tracking-wider">Google Pay</span>
                            <span className="text-[10px] text-slate-400">Pay directly with GPay engine</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleInstantPayNow("Google Pay")}
                          className="text-xs font-extrabold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer py-1 px-3 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg"
                        >
                          Pay Now
                        </button>
                      </div>

                      {/* Paytm */}
                      <div className="bg-[#12192c] border border-slate-800/60 rounded-2xl p-4 flex items-center justify-between hover:border-teal-500/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-teal-600/20 text-teal-400 rounded-full flex items-center justify-center font-bold text-lg border border-teal-500/20">
                            Py
                          </div>
                          <div className="text-left">
                            <span className="text-xs text-slate-200 font-bold block uppercase tracking-wider">Paytm UPI</span>
                            <span className="text-[10px] text-slate-400">Instant Paytm Wallet/Bank pay</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleInstantPayNow("Paytm UPI")}
                          className="text-xs font-extrabold text-teal-400 hover:text-teal-300 transition-colors cursor-pointer py-1 px-3 bg-teal-500/10 hover:bg-teal-500/20 rounded-lg"
                        >
                          Pay Now
                        </button>
                      </div>

                      {/* BHIM UPI */}
                      <div className="bg-[#12192c] border border-slate-800/60 rounded-2xl p-4 flex items-center justify-between hover:border-orange-500/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-600/20 text-orange-400 rounded-full flex items-center justify-center font-bold text-lg border border-orange-500/20">
                            B
                          </div>
                          <div className="text-left">
                            <span className="text-xs text-slate-200 font-bold block uppercase tracking-wider">BHIM UPI</span>
                            <span className="text-[10px] text-slate-400">Government Interoperable Core</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleInstantPayNow("BHIM UPI")}
                          className="text-xs font-extrabold text-orange-400 hover:text-orange-300 transition-colors cursor-pointer py-1 px-3 bg-orange-500/10 hover:bg-orange-500/20 rounded-lg"
                        >
                          Pay Now
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Interoperable UPI Core Footer */}
                  <div className="flex items-center justify-center gap-1.5 py-4 text-slate-500 select-none">
                    <span className="text-[10px] text-amber-500">⚡</span>
                    <span className="text-[10px] font-medium tracking-wide">
                      Interoperable UPI Core • Powered by NPCI
                    </span>
                  </div>

                </div>
              ) : (
                /* SUCCESS CONFIRMATION STATE */
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 my-auto">
                  {/* Success Checkmark Ring */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl scale-125 animate-pulse" />
                    <div className="w-20 h-20 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-full flex items-center justify-center shadow-lg relative z-10">
                      <CheckCircle size={44} className="text-white" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Payment Received</span>
                    <h3 className="text-2xl font-black text-white tracking-tight">₹{rechargeAmount.toLocaleString()}</h3>
                    <p className="text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                      The funds were verified and credited to your wallet instantly using the automated secure core gateway!
                    </p>
                  </div>

                  {/* Meta Details Receipt */}
                  <div className="w-full bg-slate-900/80 border border-slate-800/60 rounded-2xl p-4.5 space-y-3 text-left">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Payment App</span>
                      <span className="text-slate-300 font-bold">{selectedUpiApp}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">To Merchant</span>
                      <span className="text-slate-300 font-semibold text-[11px]">Airtel Payments Bank Ltd</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Reference ID</span>
                      <span className="text-slate-300 font-mono text-[11px] tracking-tight">{autoRefNumber}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Timestamp</span>
                      <span className="text-slate-300 text-[11px]">Just now</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowUpiGateway(false);
                      setPaymentSuccess(false);
                      setActiveTab("history"); // Take user straight to History so they see their balance is fully credited!
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-900/10 hover:shadow-emerald-500/10 transition-all cursor-pointer animate-pulse"
                  >
                    Done & View History
                  </button>
                </div>
              )}

            </div>

            {/* SIMULATED GATEWAY LOADER COVER */}
            {isSimulatingPayment && (
              <div className="absolute inset-0 bg-[#0a0f1d]/98 z-50 flex flex-col items-center justify-center p-6 space-y-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-slate-800 flex items-center justify-center font-black text-xl text-orange-400 select-none animate-pulse">
                    {selectedUpiApp === "PhonePe" ? "P" : selectedUpiApp === "Google Pay" ? "G" : selectedUpiApp === "Paytm UPI" ? "Py" : "B"}
                  </div>
                  <Loader2 className="absolute -inset-1.5 w-[76px] h-[76px] animate-spin text-orange-500" />
                </div>

                <div className="space-y-2 text-center">
                  <p className="text-sm font-bold text-slate-100 uppercase tracking-wider animate-pulse">
                    {selectedUpiApp} Gateway
                  </p>
                  
                  {/* Stepper message details */}
                  <p className="text-xs text-slate-400 min-h-[1.5rem] leading-relaxed">
                    {simulationStep === 1 && "Securing connection with Airtel Payments Bank..."}
                    {simulationStep === 2 && `Authorizing ₹${rechargeAmount} with UPI network...`}
                    {simulationStep === 3 && "Requesting secure PIN verification..."}
                    {simulationStep === 4 && "Handshake complete! Crediting wallet balance..."}
                  </p>
                </div>

                <div className="flex gap-1 justify-center">
                  {[0, 1, 2].map((idx) => (
                    <span 
                      key={idx} 
                      className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" 
                    />
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
