import React, { useState } from "react";
import { Search, SlidersHorizontal, Cpu, TrendingUp, HelpCircle, Shield, X } from "lucide-react";
import { MiningPlan } from "../types";

interface ShopViewProps {
  plans: MiningPlan[];
  userBalance: number;
  onBuyPlan: (planId: string) => Promise<void>;
  loadingPlanId: string | null;
}

type CategoryType = "All" | "Normal" | "VIP" | "Premium" | "Exclusive";

export default function ShopView({
  plans,
  userBalance,
  onBuyPlan,
  loadingPlanId,
}: ShopViewProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryType>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "income-desc">("price-asc");
  
  // Selection state for purchase modal
  const [selectedPlan, setSelectedPlan] = useState<MiningPlan | null>(null);

  // Filter plans
  const filteredPlans = plans.filter((plan) => {
    const matchesCategory = activeCategory === "All" || plan.category === activeCategory;
    const matchesSearch = plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          plan.hashrate.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort plans
  const sortedPlans = [...filteredPlans].sort((a, b) => {
    if (sortBy === "price-asc") return a.price - b.price;
    if (sortBy === "price-desc") return b.price - a.price;
    if (sortBy === "income-desc") return b.dailyIncome - a.dailyIncome;
    return 0;
  });

  const handleOpenPurchase = (plan: MiningPlan) => {
    setSelectedPlan(plan);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedPlan) return;
    const planId = selectedPlan.id;
    setSelectedPlan(null); // Close modal
    await onBuyPlan(planId);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with search and filters */}
      <div className="space-y-3">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search miners (e.g. Antminer, hashrate)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <SlidersHorizontal size={14} />
            <span>Sort by:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
          >
            <option value="price-asc">Lowest Price</option>
            <option value="price-desc">Highest Price</option>
            <option value="income-desc">Highest Daily Yield</option>
          </select>
        </div>
      </div>

      {/* 2. Category Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {(["All", "Normal", "VIP", "Premium", "Exclusive"] as CategoryType[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4.5 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              activeCategory === cat
                ? "bg-orange-600 text-white shadow-md shadow-orange-950/25"
                : "bg-slate-900 text-slate-400 border border-slate-800/85 hover:border-slate-700"
            }`}
          >
            {cat} Pools
          </button>
        ))}
      </div>

      {/* 3. Product Cards Grid */}
      {sortedPlans.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-3xl space-y-3">
          <p className="text-slate-400 text-sm">No mining machines found matching filters.</p>
          <button
            onClick={() => {
              setActiveCategory("All");
              setSearchQuery("");
            }}
            className="text-xs text-orange-500 hover:underline font-semibold"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedPlans.map((plan) => {
            const totalEarnings = plan.dailyIncome * plan.durationDays;
            const roiPercent = ((totalEarnings / plan.price) * 100).toFixed(0);

            return (
              <div
                key={plan.id}
                className="bg-slate-900 border border-slate-800 rounded-[24px] overflow-hidden flex flex-col hover:border-orange-500/30 transition-colors shadow-md relative"
              >
                {/* Image & Hashrate Badge */}
                <div className="h-44 relative w-full overflow-hidden">
                  <img src={plan.imageUrl} alt={plan.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                  
                  {/* Category Pill */}
                  <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-xxs font-extrabold uppercase tracking-wide border ${
                    plan.category === "Exclusive" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                    plan.category === "Premium" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                    plan.category === "VIP" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                    "bg-orange-500/10 text-orange-400 border-orange-500/20"
                  }`}>
                    {plan.category}
                  </span>

                  {/* Hashrate Badge */}
                  <span className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-mono font-bold text-orange-400 flex items-center gap-1">
                    <Cpu size={12} /> {plan.hashrate}
                  </span>
                </div>

                {/* Body Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-100 tracking-tight leading-snug">{plan.name}</h3>
                    <p className="text-slate-500 text-xs">Virtual ASIC Cloud Miner Pool Contract</p>
                  </div>

                  {/* Pricing Matrix */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/60 rounded-2xl border border-slate-800/50">
                    <div>
                      <span className="text-slate-500 text-xxs uppercase block mb-0.5">Daily Return</span>
                      <p className="text-sm font-bold text-emerald-400 font-sans">₹{plan.dailyIncome.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xxs uppercase block mb-0.5">Contract Term</span>
                      <p className="text-sm font-bold text-slate-300 font-mono">{plan.durationDays} Days</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xxs uppercase block mb-0.5">Total Return</span>
                      <p className="text-sm font-bold text-slate-300">₹{totalEarnings.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xxs uppercase block mb-0.5">Total ROI</span>
                      <p className="text-sm font-bold text-amber-400 flex items-center gap-0.5">
                        <TrendingUp size={12} /> {roiPercent}%
                      </p>
                    </div>
                  </div>

                  {/* Buy Button */}
                  <div className="flex justify-between items-center pt-2">
                    <div className="space-y-0.5">
                      <span className="text-slate-500 text-xxs uppercase block">Machine Price</span>
                      <p className="text-lg font-bold text-white font-sans">₹{plan.price.toLocaleString()}</p>
                    </div>

                    <button
                      onClick={() => handleOpenPurchase(plan)}
                      className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition-all active:scale-95 shadow-md shadow-orange-950/20 flex items-center gap-1.5"
                    >
                      <span>Buy Now</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Legal Disclosures Banner */}
      <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl flex gap-3 text-slate-500 text-xs items-start leading-relaxed">
        <HelpCircle size={18} className="text-slate-400 shrink-0 mt-0.5" />
        <p>
          <span className="font-semibold text-slate-400">Compliance &amp; Risk Notice:</span> This mining portal simulates virtual ASIC mining node operations. Returns are driven by platform parameters. Please read our full terms of service before allocating wallet funds.
        </p>
      </div>

      {/* 5. Purchase Confirmation Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-[28px] max-w-sm w-full p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedPlan(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 p-1"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-5 space-y-1.5">
              <div className="w-12 h-12 bg-orange-500/15 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-orange-500/20 animate-pulse">
                <Cpu size={24} />
              </div>
              <h3 className="text-base font-bold text-white">Activate Miner Contract</h3>
              <p className="text-xs text-slate-400">Confirm purchase details below</p>
            </div>

            <div className="space-y-3.5 bg-slate-950/60 border border-slate-800/60 p-4.5 rounded-2xl mb-5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Miner Name:</span>
                <span className="font-semibold text-slate-200">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hash Power:</span>
                <span className="font-mono text-orange-400 font-semibold">{selectedPlan.hashrate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Daily ROI Yield:</span>
                <span className="text-emerald-400 font-semibold">₹{selectedPlan.dailyIncome.toFixed(2)} / Day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contract Term:</span>
                <span className="text-slate-300 font-mono font-semibold">{selectedPlan.durationDays} Days</span>
              </div>
              <div className="border-t border-slate-800/80 pt-3 flex justify-between text-sm">
                <span className="text-slate-400 font-medium">Activation Fee:</span>
                <span className="font-bold text-white">₹{selectedPlan.price.toLocaleString()}</span>
              </div>
            </div>

            {/* Account Balance Guard */}
            {userBalance < selectedPlan.price ? (
              <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs rounded-xl mb-5 leading-normal">
                Insufficient available balance (₹{userBalance.toFixed(2)}). Please recharge first to complete this contract purchase!
              </div>
            ) : (
              <div className="flex items-start gap-2 p-3 bg-orange-500/5 border border-orange-500/10 text-slate-400 text-xxs rounded-xl mb-5 leading-normal">
                <Shield size={14} className="text-orange-500 shrink-0 mt-0.5" />
                <p>
                  By clicking buy, you authorize the allocation of ₹{selectedPlan.price.toLocaleString()} available credits for virtual miner operation. Commissions are split among upline referrals automatically.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedPlan(null)}
                className="flex-1 py-3 bg-slate-950 hover:bg-slate-950/50 text-slate-400 font-semibold text-xs rounded-2xl border border-slate-800 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmPurchase}
                disabled={userBalance < selectedPlan.price || loadingPlanId === selectedPlan.id}
                className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold text-xs rounded-2xl shadow-lg shadow-orange-950/10 transition-all flex items-center justify-center gap-1.5"
              >
                {loadingPlanId === selectedPlan.id ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Confirm & Buy"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
