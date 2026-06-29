import React, { useState, useEffect } from "react";
import { Cpu, RefreshCw, Layers, CheckCircle, TrendingUp, AlertTriangle, Coins } from "lucide-react";
import { Investment } from "../types";

interface MyInvestmentsViewProps {
  investments: Investment[];
  onCollectYield: () => Promise<void>;
  loadingCollect: boolean;
}

export default function MyInvestmentsView({
  investments,
  onCollectYield,
  loadingCollect,
}: MyInvestmentsViewProps) {
  const [estimatedUnclaimed, setEstimatedUnclaimed] = useState(0);

  // Filter active vs completed investments
  const activeInvestments = investments.filter((i) => i.status === "ACTIVE");
  const completedInvestments = investments.filter((i) => i.status === "COMPLETED");

  // Real-time micro-yield ticker calculation
  useEffect(() => {
    if (activeInvestments.length === 0) {
      setEstimatedUnclaimed(0);
      return;
    }

    const timer = setInterval(() => {
      const now = new Date();
      let totalUncollected = 0;

      activeInvestments.forEach((inv) => {
        const lastClaim = new Date(inv.lastYieldClaimedAt);
        const expires = new Date(inv.expiresAt);
        const endTime = now > expires ? expires : now;

        const diffMs = endTime.getTime() - lastClaim.getTime();
        if (diffMs > 0) {
          const msPerDay = 24 * 60 * 60 * 1000;
          const yieldPerMs = inv.dailyIncome / msPerDay;
          totalUncollected += diffMs * yieldPerMs;
        }
      });

      setEstimatedUnclaimed(Number(totalUncollected.toFixed(5)));
    }, 100);

    return () => clearInterval(timer);
  }, [activeInvestments, investments]);

  return (
    <div className="space-y-6">
      {/* 1. Dynamic Collecting Summary Card */}
      {activeInvestments.length > 0 && (
        <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-[28px] text-center space-y-4 relative overflow-hidden shadow-lg shadow-black/40">
          <div className="absolute top-[-30%] left-[-30%] w-[60%] h-[60%] bg-orange-600/5 rounded-full blur-[80px]" />
          
          <div className="space-y-1 relative z-10">
            <span className="text-xxs font-bold text-orange-500 uppercase tracking-wider flex items-center justify-center gap-1">
              <Coins size={12} className="animate-bounce" /> Live ASIC Yield Accumulator
            </span>
            <h3 className="text-slate-400 text-xs">Dynamic Unclaimed Mining Earnings</h3>
            <p className="text-3xl font-extrabold text-white font-mono leading-none tracking-tight py-2">
              ₹{estimatedUnclaimed.toFixed(5)}
            </p>
          </div>

          <button
            onClick={onCollectYield}
            disabled={loadingCollect || estimatedUnclaimed < 0.01}
            className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-800/80 disabled:cursor-not-allowed border border-transparent text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 relative z-10"
          >
            {loadingCollect ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <>
                <RefreshCw size={14} className="text-orange-200" />
                <span>Collect Mining Earnings</span>
              </>
            )}
          </button>
          
          <p className="text-xxs text-slate-500 relative z-10">
            Yields are credited to your earnings balance. Collection triggers secure 3-tier commission logs.
          </p>
        </div>
      )}

      {/* 2. Active Machines List */}
      <div className="space-y-3.5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Cpu size={14} className="text-orange-500" />
          <span>Active Mining Contracts ({activeInvestments.length})</span>
        </h3>

        {activeInvestments.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/30 border border-slate-800 border-dashed rounded-3xl space-y-4">
            <div className="w-12 h-12 bg-slate-900 text-slate-500 rounded-full flex items-center justify-center mx-auto">
              <Layers size={22} />
            </div>
            <div className="space-y-1">
              <p className="text-slate-300 font-semibold text-sm">No Active Miners</p>
              <p className="text-slate-500 text-xs max-w-xs mx-auto">
                You do not have any operational contracts currently. Purchase a virtual machine from the shop to start mining!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {activeInvestments.map((inv) => {
              const start = new Date(inv.startedAt).toLocaleDateString();
              const end = new Date(inv.expiresAt).toLocaleDateString();
              
              // Calculate term progression
              const totalTermMs = new Date(inv.expiresAt).getTime() - new Date(inv.startedAt).getTime();
              const elapsedMs = new Date().getTime() - new Date(inv.startedAt).getTime();
              const progress = Math.min(100, Math.max(0, (elapsedMs / totalTermMs) * 100));

              return (
                <div
                  key={inv.id}
                  className="p-5 bg-slate-900 border border-slate-800/90 rounded-[24px] space-y-4 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                        {inv.planName}
                      </h4>
                      <p className="text-slate-500 text-xxs font-mono">Contract ID: {inv.id}</p>
                    </div>
                    <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full text-xxs font-bold tracking-wide uppercase">
                      Mining
                    </span>
                  </div>

                  {/* Progress Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-slate-500 text-xxs">
                      <span>Term Progression</span>
                      <span className="font-mono text-slate-300">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-orange-500 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 text-xxs uppercase block mb-0.5">Yield Performance</span>
                      <p className="font-semibold text-emerald-400 font-sans">₹{inv.dailyIncome.toFixed(2)} / Day</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xxs uppercase block mb-0.5">Activated Term</span>
                      <p className="font-semibold text-slate-300 font-sans">{start} - {end}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Completed Contracts History */}
      {completedInvestments.length > 0 && (
        <div className="space-y-3.5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle size={14} className="text-slate-500" />
            <span>Completed Contracts ({completedInvestments.length})</span>
          </h3>

          <div className="space-y-2.5">
            {completedInvestments.map((inv) => (
              <div
                key={inv.id}
                className="p-4 bg-slate-900/50 border border-slate-800/60 rounded-2xl flex justify-between items-center text-xs"
              >
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-400">{inv.planName}</h4>
                  <p className="text-slate-500 text-xxs font-mono">ID: {inv.id}</p>
                </div>

                <div className="text-right space-y-1">
                  <span className="bg-slate-800 text-slate-500 border border-slate-700/50 px-2 py-0.5 rounded-full text-xxs font-bold uppercase">
                    Completed
                  </span>
                  <p className="text-xxs text-slate-500">Term ended on {new Date(inv.expiresAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
