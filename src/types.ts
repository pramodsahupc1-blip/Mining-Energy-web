export interface User {
  id: string;
  fullName: string;
  mobile: string;
  referralCode: string;
  referredBy: string | null;
  role: "user" | "admin";
  createdAt: string;
}

export interface Wallet {
  available: number;
  investment: number;
  earnings: number;
  lastCheckIn: string | null;
}

export interface MiningPlan {
  id: string;
  name: string;
  category: "Normal" | "VIP" | "Premium" | "Exclusive";
  price: number;
  dailyIncome: number;
  durationDays: number;
  hashrate: string;
  imageUrl: string;
  status: boolean;
}

export interface Investment {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  amount: number;
  dailyIncome: number;
  startedAt: string;
  expiresAt: string;
  lastYieldClaimedAt: string;
  status: "ACTIVE" | "COMPLETED";
}

export interface Transaction {
  id: string;
  userId: string;
  type: "RECHARGE" | "WITHDRAWAL" | "INVESTMENT" | "YIELD" | "CHECKIN" | "REFERRAL_COMMISSION" | "BONUS" | "ADJUSTMENT";
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED";
  reference: string;
  description: string;
  createdAt: string;
}

export interface RechargeRequest {
  id: string;
  userId: string;
  amount: number;
  method: string;
  reference: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export interface TicketMessage {
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  messages: TicketMessage[];
  createdAt: string;
  userFullName?: string;
  userMobile?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
