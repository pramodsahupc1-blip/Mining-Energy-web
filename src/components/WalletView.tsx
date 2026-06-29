import React, { useState } from "react";
import { 
  Wallet, RefreshCw, Copy, ArrowDownLeft, ArrowUpRight, 
  Clock, CheckCircle, XCircle, Landmark, CreditCard, Send, ShieldCheck
} from "lucide-react";
import { Wallet as WalletType, Transaction } from "../types";

interface WalletViewProps {
  wallet: WalletType;
  transactions: Transaction[];
  onRecharge: (amount: number, method: string, reference: string) => Promise<void>;
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

  const UPI_RECEIVER_ID_YBL = "8144553816@ybl";
  const UPI_RECEIVER_ID_FAM = "8144553816@FAM";

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
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">NSDL PAYMENTS BANK</span>
                  <span className="text-xs text-slate-200 font-bold">Official Payment QR</span>
                </div>
              </div>

              {/* QR Code Frame */}
              <div className="relative p-3 bg-white rounded-2xl shadow-xl shadow-black/40 border border-slate-100 flex flex-col items-center">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=8144553816@ybl&pn=NSDL%20Payments%20Bank&cu=INR&am=${rechargeAmount}`)}`}
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
                <p className="font-mono text-xs font-bold text-slate-300">8144553816@ybl</p>
                <p className="text-[10px] text-slate-500 max-w-[200px] leading-relaxed mx-auto">
                  Scan QR with PhonePe, Google Pay, Paytm, or BHIM for instant automatic crediting.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl space-y-3">
              <span className="text-slate-500 text-xxs uppercase font-bold tracking-wider block">Or Copy UPI ID Manually:</span>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40">
                  <div className="space-y-0.5">
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Option A: PhonePe / NSDL Bank</span>
                    <p className="font-mono text-xs font-bold text-slate-200">{UPI_RECEIVER_ID_YBL}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(UPI_RECEIVER_ID_YBL);
                      alert("UPI ID (8144553816@ybl) copied!");
                    }}
                    className="p-2 bg-orange-600/15 hover:bg-orange-600/25 text-orange-400 rounded-lg transition-colors text-xxs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy size={12} /> Copy
                  </button>
                </div>

                <div className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40">
                  <div className="space-y-0.5">
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Option B: FamPay / FamApp</span>
                    <p className="font-mono text-xs font-bold text-slate-200">{UPI_RECEIVER_ID_FAM}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(UPI_RECEIVER_ID_FAM);
                      alert("UPI ID (8144553816@FAM) copied!");
                    }}
                    className="p-2 bg-orange-600/15 hover:bg-orange-600/25 text-orange-400 rounded-lg transition-colors text-xxs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy size={12} /> Copy
                  </button>
                </div>
              </div>
            </div>

            <p className="text-xxs text-slate-500 leading-normal">
              Note: Open your preferred financial app, scan the QR code above or pay to one of the official IDs, and input the 12-digit transaction index / ref number.
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
                        <span>Ref: {tx.reference.substring(0, 10)}</span>
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
    </div>
  );
}
