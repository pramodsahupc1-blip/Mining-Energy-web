import React, { useState } from "react";
import { 
  MessageSquare, Send, Plus, ChevronRight, HelpCircle, 
  ExternalLink, Mail, Phone, RefreshCw, X, ShieldQuestion
} from "lucide-react";
import { SupportTicket } from "../types";

interface SupportViewProps {
  tickets: SupportTicket[];
  onCreateTicket: (subject: string, message: string) => Promise<void>;
  onSendReply: (ticketId: string, message: string) => Promise<void>;
  loadingTicket: boolean;
}

export default function SupportView({
  tickets,
  onCreateTicket,
  onSendReply,
  loadingTicket,
}: SupportViewProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState("");

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      alert("Please fill in both fields");
      return;
    }
    await onCreateTicket(subject.trim(), message.trim());
    setSubject("");
    setMessage("");
    setShowCreateModal(false);
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;
    const ticketId = activeTicket.id;
    await onSendReply(ticketId, replyText.trim());
    
    // Find the updated ticket from list and update active state
    setReplyText("");
  };

  // Sync active ticket on list changes
  React.useEffect(() => {
    if (activeTicket) {
      const current = tickets.find((t) => t.id === activeTicket.id);
      if (current) {
        setActiveTicket(current);
      }
    }
  }, [tickets, activeTicket?.id]);

  return (
    <div className="space-y-6">
      {/* 1. Quick Support Links Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <a
          href="https://t.me/miningenergy_support"
          target="_blank"
          rel="noopener noreferrer"
          className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center gap-1.5 hover:border-sky-500/30 transition-colors"
        >
          <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl">
            <ExternalLink size={16} />
          </div>
          <span className="text-[10px] font-bold text-slate-300">Telegram Channel</span>
        </a>

        <a
          href="https://wa.me/miningenergy"
          target="_blank"
          rel="noopener noreferrer"
          className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center gap-1.5 hover:border-emerald-500/30 transition-colors"
        >
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Phone size={16} />
          </div>
          <span className="text-[10px] font-bold text-slate-300">WhatsApp Help</span>
        </a>

        <a
          href="mailto:support@miningenergy.net"
          className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center gap-1.5 hover:border-orange-500/30 transition-colors"
        >
          <div className="p-2 bg-orange-500/10 text-orange-400 rounded-xl">
            <Mail size={16} />
          </div>
          <span className="text-[10px] font-bold text-slate-300">Email Portal</span>
        </a>
      </div>

      {/* 2. Tickets list section */}
      <div className="space-y-3.5">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <MessageSquare size={14} className="text-orange-500" />
            <span>Support Tickets ({tickets.length})</span>
          </h3>

          <button
            onClick={() => setShowCreateModal(true)}
            className="text-xs text-orange-500 hover:underline font-bold flex items-center gap-1"
          >
            <Plus size={14} /> New Ticket
          </button>
        </div>

        {tickets.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/30 border border-slate-800 rounded-2xl space-y-3">
            <ShieldQuestion size={24} className="text-slate-600 mx-auto" />
            <p className="text-slate-500 text-xs">No active support tickets. Click New Ticket to get help!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => setActiveTicket(t)}
                className={`p-4 bg-slate-900 border rounded-2xl cursor-pointer hover:border-slate-700 transition-all flex justify-between items-center ${
                  activeTicket?.id === t.id ? "border-orange-500/50" : "border-slate-800"
                }`}
              >
                <div className="space-y-1 max-w-[70%]">
                  <h4 className="font-bold text-xs text-slate-200 truncate">{t.subject}</h4>
                  <p className="text-xxs text-slate-500 font-mono">
                    ID: {t.id} • {new Date(t.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
                    t.status === "OPEN" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                    t.status === "IN_PROGRESS" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  }`}>
                    {t.status.replace("_", " ")}
                  </span>
                  <ChevronRight size={14} className="text-slate-600" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Ticket Chat Thread Window */}
      {activeTicket && (
        <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-[24px] space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <div>
              <span className="text-slate-500 text-xxs font-semibold uppercase tracking-wider block">Currently Viewing Thread</span>
              <h4 className="text-xs font-bold text-white">{activeTicket.subject}</h4>
            </div>
            <button
              onClick={() => setActiveTicket(null)}
              className="text-slate-500 hover:text-slate-300 text-xxs font-semibold"
            >
              Close chat
            </button>
          </div>

          {/* Messages block */}
          <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
            {activeTicket.messages.map((m, idx) => {
              const isMe = m.senderId !== "system" && m.senderId !== "admin-id";
              const time = new Date(m.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

              return (
                <div
                  key={idx}
                  className={`flex flex-col max-w-[85%] space-y-1 ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}
                >
                  <span className="text-slate-500 text-[10px]">{m.senderName}</span>
                  <div className={`p-3 rounded-2xl text-xs leading-normal font-sans ${
                    isMe 
                      ? "bg-orange-600 text-white rounded-tr-none" 
                      : "bg-slate-900 text-slate-200 rounded-tl-none border border-slate-800"
                  }`}>
                    {m.message}
                  </div>
                  <span className="text-[10px] text-slate-600 font-mono">{time}</span>
                </div>
              );
            })}
          </div>

          {/* Reply input field */}
          {activeTicket.status !== "CLOSED" ? (
            <form onSubmit={handleReplySubmit} className="flex gap-2.5 pt-2">
              <input
                type="text"
                placeholder="Type your help reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500"
              />
              <button
                type="submit"
                disabled={loadingTicket || !replyText.trim()}
                className="p-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl transition-colors"
              >
                {loadingTicket ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </form>
          ) : (
            <div className="p-3 bg-slate-900 text-center rounded-xl text-slate-500 text-xs font-semibold">
              This ticket is closed and resolved.
            </div>
          )}
        </div>
      )}

      {/* 4. Support FAQ Section */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <HelpCircle size={14} className="text-slate-500" />
          <span>General FAQ</span>
        </h3>

        <div className="space-y-2 bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl text-xs">
          <details className="group [&_summary::-webkit-details-marker]:hidden border-b border-slate-800/60 pb-2">
            <summary className="flex justify-between items-center font-bold text-slate-300 cursor-pointer">
              <span>What is the minimum recharge and withdraw?</span>
              <span className="text-slate-500 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="text-slate-500 text-xxs mt-1.5 leading-normal">
              Minimum recharge is ₹100. Minimum withdrawal is ₹200. Processing completes securely.
            </p>
          </details>

          <details className="group [&_summary::-webkit-details-marker]:hidden pt-2">
            <summary className="flex justify-between items-center font-bold text-slate-300 cursor-pointer">
              <span>How are 3-tier referral commissions paid?</span>
              <span className="text-slate-500 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="text-slate-500 text-xxs mt-1.5 leading-normal">
              Level 1 pays 10% cash, Level 2 pays 5% cash, and Level 3 pays 2% cash instantly whenever team members buy mining rig contracts.
            </p>
          </details>
        </div>
      </div>

      {/* 5. Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleCreateSubmit}
            className="bg-slate-900 border border-slate-800 rounded-[28px] max-w-sm w-full p-6 relative shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 p-1"
            >
              <X size={20} />
            </button>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Open Support Ticket</h3>
              <p className="text-xxs text-slate-500">Provide ticket particulars below</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Ticket Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Recharge transaction pending"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-slate-100 placeholder-slate-650 focus:outline-none focus:border-orange-500 font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Describe Issue</label>
                <textarea
                  placeholder="Describe your enquiry details..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-slate-100 placeholder-slate-650 focus:outline-none focus:border-orange-500 font-sans resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-950/60 text-slate-400 font-semibold text-xs rounded-xl border border-slate-800 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loadingTicket || !subject.trim() || !message.trim()}
                className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-1"
              >
                {loadingTicket ? <RefreshCw size={14} className="animate-spin" /> : "Submit Ticket"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
