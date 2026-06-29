import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

app.use(express.json());

// --- Helper types for DB ---
interface User {
  id: string;
  fullName: string;
  mobile: string;
  passwordHash: string;
  referralCode: string;
  referredBy: string | null;
  role: "user" | "admin";
  createdAt: string;
}

interface Wallet {
  available: number;
  investment: number;
  earnings: number;
  lastCheckIn: string | null;
}

interface MiningPlan {
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

interface Investment {
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

interface Transaction {
  id: string;
  userId: string;
  type: "RECHARGE" | "WITHDRAWAL" | "INVESTMENT" | "YIELD" | "CHECKIN" | "REFERRAL_COMMISSION" | "BONUS" | "ADJUSTMENT";
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED";
  reference: string;
  description: string;
  createdAt: string;
}

interface RechargeRequest {
  id: string;
  userId: string;
  amount: number;
  method: string;
  reference: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  createdAt: string;
}

interface WithdrawalRequest {
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

interface TicketMessage {
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  messages: TicketMessage[];
  createdAt: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface DBStructure {
  users: User[];
  wallets: Record<string, Wallet>;
  plans: MiningPlan[];
  investments: Investment[];
  transactions: Transaction[];
  recharges: RechargeRequest[];
  withdrawals: WithdrawalRequest[];
  tickets: SupportTicket[];
  announcements: Announcement[];
  notifications: Notification[];
}

// --- DB Initialize ---
const DEFAULT_PLANS: MiningPlan[] = [
  {
    id: "plan-normal-1",
    name: "Antminer S19 Pro (Basic)",
    category: "Normal",
    price: 500,
    dailyIncome: 25,
    durationDays: 30,
    hashrate: "110 TH/s",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
    status: true,
  },
  {
    id: "plan-normal-2",
    name: "Whatsminer M30S++",
    category: "Normal",
    price: 1500,
    dailyIncome: 80,
    durationDays: 45,
    hashrate: "112 TH/s",
    imageUrl: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=600&q=80",
    status: true,
  },
  {
    id: "plan-vip-1",
    name: "AvalonMiner 1246 Pro",
    category: "VIP",
    price: 3000,
    dailyIncome: 180,
    durationDays: 60,
    hashrate: "90 TH/s",
    imageUrl: "https://images.unsplash.com/photo-1591453089816-0fbb971b454c?auto=format&fit=crop&w=600&q=80",
    status: true,
  },
  {
    id: "plan-vip-2",
    name: "Bitmain Antminer L7 (Scrypt)",
    category: "VIP",
    price: 5000,
    dailyIncome: 320,
    durationDays: 60,
    hashrate: "9.5 GH/s",
    imageUrl: "https://images.unsplash.com/photo-1605792657660-596af9009e82?auto=format&fit=crop&w=600&q=80",
    status: true,
  },
  {
    id: "plan-premium-1",
    name: "Giga Mining Cluster Node v1",
    category: "Premium",
    price: 10000,
    dailyIncome: 700,
    durationDays: 90,
    hashrate: "500 TH/s",
    imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80",
    status: true,
  },
  {
    id: "plan-exclusive-1",
    name: "Super-Energy Quantum Grid",
    category: "Exclusive",
    price: 25000,
    dailyIncome: 2000,
    durationDays: 120,
    hashrate: "2.5 PH/s",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
    status: true,
  },
];

function readDB(): DBStructure {
  if (!fs.existsSync(DB_FILE)) {
    const initialDB: DBStructure = {
      users: [
        {
          id: "admin-id",
          fullName: "System Admin",
          mobile: "8144553816",
          passwordHash: "admin16", // Simple hash for illustration
          referralCode: "ADMIN777",
          referredBy: null,
          role: "admin",
          createdAt: new Date().toISOString(),
        }
      ],
      wallets: {
        "admin-id": { available: 100000, investment: 0, earnings: 0, lastCheckIn: null },
      },
      plans: DEFAULT_PLANS,
      investments: [],
      transactions: [],
      recharges: [],
      withdrawals: [],
      tickets: [
        {
          id: "ticket-1",
          userId: "admin-id",
          subject: "Welcome to Mining Energy!",
          status: "RESOLVED",
          messages: [
            {
              senderId: "system",
              senderName: "Mining Support",
              message: "Hello! Welcome to the premium FinTech Mining Energy platform. This support ticket serves as an example.",
              createdAt: new Date().toISOString(),
            }
          ],
          createdAt: new Date().toISOString(),
        }
      ],
      announcements: [
        {
          id: "ann-1",
          title: "Platform Launch Notice",
          content: "Welcome to Mining Energy! Start investing in cloud mining machines today and yield passive daily mining incomes with 3 levels of referral commissions.",
          createdAt: new Date().toISOString(),
        },
        {
          id: "ann-2",
          title: "UPI Recharge Special Benefit",
          content: "Instant approval for all UPI and Card recharges over ₹1500. Secure processing within minutes.",
          createdAt: new Date().toISOString(),
        }
      ],
      notifications: [
        {
          id: "notif-1",
          userId: "admin-id",
          title: "Account Created",
          message: "Welcome! Your Mining Energy account has been successfully initialized with administrator privileges.",
          isRead: false,
          createdAt: new Date().toISOString(),
        }
      ],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2), "utf8");
    return initialDB;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch (err) {
    console.error("Error reading database file, resetting...", err);
    return {
      users: [],
      wallets: {},
      plans: DEFAULT_PLANS,
      investments: [],
      transactions: [],
      recharges: [],
      withdrawals: [],
      tickets: [],
      announcements: [],
      notifications: [],
    };
  }
}

function writeDB(db: DBStructure) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

// --- Mining Yield Engine ---
// Automatically updates pending/unclaimed yields for all active investments
function processMiningYields(userId: string) {
  const db = readDB();
  const now = new Date();
  let updated = false;

  const userInvestments = db.investments.filter(
    (inv) => inv.userId === userId && inv.status === "ACTIVE"
  );

  userInvestments.forEach((inv) => {
    const lastClaim = new Date(inv.lastYieldClaimedAt);
    const expires = new Date(inv.expiresAt);
    const endTime = now > expires ? expires : now;

    const diffMs = endTime.getTime() - lastClaim.getTime();
    if (diffMs > 1000) {
      // Calculate yield per millisecond based on daily income
      // Daily income / (24 * 60 * 60 * 1000)
      const msPerDay = 24 * 60 * 60 * 1000;
      const yieldPerMs = inv.dailyIncome / msPerDay;
      const earnedAmount = Number((diffMs * yieldPerMs).toFixed(5));

      if (earnedAmount > 0) {
        // Credit to earnings balance of user's wallet
        if (db.wallets[userId]) {
          db.wallets[userId].earnings = Number((db.wallets[userId].earnings + earnedAmount).toFixed(2));
          
          // Log transaction
          db.transactions.push({
            id: `yield-${Math.random().toString(36).substring(2, 9)}`,
            userId,
            type: "YIELD",
            amount: earnedAmount,
            status: "SUCCESS",
            reference: inv.id,
            description: `Mining Yield from ${inv.planName}`,
            createdAt: now.toISOString(),
          });
        }

        inv.lastYieldClaimedAt = endTime.toISOString();
        if (now >= expires) {
          inv.status = "COMPLETED";
          // Reduce locked balance, keep earnings
          if (db.wallets[userId]) {
            db.wallets[userId].investment = Math.max(0, Number((db.wallets[userId].investment - inv.amount).toFixed(2)));
          }
        }
        updated = true;
      }
    }
  });

  if (updated) {
    writeDB(db);
  }
}

// --- Middleware ---
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["x-auth-token"] || req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ success: false, message: "Authorization token missing" });
  }
  const token = String(authHeader).replace("Bearer ", "").trim();
  const db = readDB();
  const user = db.users.find((u) => u.id === token);
  if (!user) {
    return res.status(403).json({ success: false, message: "Invalid or expired session token" });
  }
  // Process yields anytime the user acts
  processMiningYields(user.id);
  req.user = user;
  next();
}

// --- API Endpoints ---

// Registration
app.post("/api/auth/register", (req, res) => {
  const { fullName, mobile, password, referralCode } = req.body;
  if (!fullName || !mobile || !password) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  const db = readDB();
  const existingUser = db.users.find((u) => u.mobile === mobile);
  if (existingUser) {
    return res.status(400).json({ success: false, message: "Mobile number is already registered" });
  }

  const userId = `user-${Math.random().toString(36).substring(2, 11)}`;
  const userReferralCode = "ME" + Math.floor(100000 + Math.random() * 900000);

  // Validate referredBy code
  let referredByUserId: string | null = null;
  if (referralCode) {
    const inviter = db.users.find((u) => u.referralCode === referralCode.trim().toUpperCase());
    if (inviter) {
      referredByUserId = inviter.id;
    }
  }

  const newUser: User = {
    id: userId,
    fullName,
    mobile,
    passwordHash: password, // simple storage for simulator
    referralCode: userReferralCode,
    referredBy: referredByUserId,
    role: "user",
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  db.wallets[userId] = {
    available: 100, // ₹100 Welcome Bonus!
    investment: 0,
    earnings: 0,
    lastCheckIn: null,
  };

  // Welcome notification
  db.notifications.push({
    id: `notif-${Math.random().toString(36).substring(2, 9)}`,
    userId,
    title: "Welcome Bonus!",
    message: "Thank you for registering. We have credited ₹100 registration bonus to your wallet!",
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  // Welcome transaction log
  db.transactions.push({
    id: `tx-${Math.random().toString(36).substring(2, 9)}`,
    userId,
    type: "BONUS",
    amount: 100,
    status: "SUCCESS",
    reference: "WELCOME",
    description: "Welcome Registration Bonus",
    createdAt: new Date().toISOString(),
  });

  // Handle Referral Commision Logging (Level 1, Level 2, Level 3 registration log)
  if (referredByUserId) {
    // Record referral entry
    db.notifications.push({
      id: `notif-${Math.random().toString(36).substring(2, 9)}`,
      userId: referredByUserId,
      title: "New Team Member",
      message: `${fullName} joined your team via your referral code!`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  writeDB(db);
  res.status(201).json({
    success: true,
    message: "Registration successful!",
    data: { token: userId, user: { id: userId, fullName, mobile, referralCode: userReferralCode, role: "user" } },
  });
});

// Login
app.post("/api/auth/login", (req, res) => {
  const { mobile, password } = req.body;
  if (!mobile || !password) {
    return res.status(400).json({ success: false, message: "Missing mobile or password" });
  }

  const db = readDB();
  const user = db.users.find((u) => u.mobile === mobile && u.passwordHash === password);
  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid mobile number or password" });
  }

  processMiningYields(user.id);

  res.json({
    success: true,
    message: "Logged in successfully!",
    data: {
      token: user.id,
      user: {
        id: user.id,
        fullName: user.fullName,
        mobile: user.mobile,
        referralCode: user.referralCode,
        role: user.role,
      },
    },
  });
});

// Current User Info
app.get("/api/auth/me", authenticateToken, (req: any, res) => {
  const db = readDB();
  const wallet = db.wallets[req.user.id] || { available: 0, investment: 0, earnings: 0, lastCheckIn: null };
  res.json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        fullName: req.user.fullName,
        mobile: req.user.mobile,
        referralCode: req.user.referralCode,
        referredBy: req.user.referredBy,
        role: req.user.role,
        createdAt: req.user.createdAt,
      },
      wallet,
    },
  });
});

// Main Dashboard Endpoint
app.get("/api/dashboard", authenticateToken, (req: any, res) => {
  const db = readDB();
  const userId = req.user.id;
  const wallet = db.wallets[userId] || { available: 0, investment: 0, earnings: 0, lastCheckIn: null };
  
  // Fetch active and completed plans
  const activeInvestmentsCount = db.investments.filter(
    (inv) => inv.userId === userId && inv.status === "ACTIVE"
  ).length;

  const totalMembers = db.users.length + 10420; // adding constant offset for aesthetic statistics
  const totalInvestments = db.investments.reduce((sum, inv) => sum + inv.amount, 0) + 1450000;
  const totalWithdrawals = db.withdrawals.filter(w => w.status === "APPROVED").reduce((sum, w) => sum + w.amount, 0) + 382400;

  // Banner slider mock
  const banners = [
    { id: "b1", title: "Mega Yield Mining Giga Cluster", text: "Get +15% daily ROI boost with Bitcoin Miners", imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80" },
    { id: "b2", title: "Daily Login Checking Rewards", text: "Claim ₹20 daily free cash just by opening the applet", imageUrl: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=1200&q=80" }
  ];

  res.json({
    success: true,
    data: {
      wallet,
      stats: {
        activeInvestmentsCount,
        totalMembers,
        totalInvestments,
        totalWithdrawals,
      },
      banners,
      announcements: db.announcements.slice(-3),
    },
  });
});

// Daily Check-In
app.post("/api/checkin", authenticateToken, (req: any, res) => {
  const db = readDB();
  const userId = req.user.id;
  const wallet = db.wallets[userId];

  const todayStr = new Date().toISOString().split("T")[0];
  if (wallet.lastCheckIn === todayStr) {
    return res.status(400).json({ success: false, message: "You have already completed daily check-in today!" });
  }

  wallet.available = Number((wallet.available + 20).toFixed(2));
  wallet.lastCheckIn = todayStr;

  db.transactions.push({
    id: `tx-checkin-${Math.random().toString(36).substring(2, 9)}`,
    userId,
    type: "CHECKIN",
    amount: 20,
    status: "SUCCESS",
    reference: todayStr,
    description: "Daily Check-in Reward",
    createdAt: new Date().toISOString(),
  });

  db.notifications.push({
    id: `notif-${Math.random().toString(36).substring(2, 9)}`,
    userId,
    title: "Check-in Successful",
    message: "You claimed ₹20 Daily Login Checking Reward!",
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  writeDB(db);
  res.json({
    success: true,
    message: "Checked-in successfully! ₹20 added to your available balance.",
    data: { wallet },
  });
});

// Fetch Mining Plans (Shop)
app.get("/api/plans", (req, res) => {
  const db = readDB();
  res.json({
    success: true,
    data: db.plans.filter((p) => p.status),
  });
});

// Buy Mining Plan
app.post("/api/plans/buy", authenticateToken, (req: any, res) => {
  const { planId } = req.body;
  if (!planId) {
    return res.status(400).json({ success: false, message: "Mining machine plan ID is required" });
  }

  const db = readDB();
  const plan = db.plans.find((p) => p.id === planId && p.status);
  if (!plan) {
    return res.status(404).json({ success: false, message: "Plan not found or deactivated" });
  }

  const userId = req.user.id;
  const wallet = db.wallets[userId];

  if (wallet.available < plan.price) {
    return res.status(400).json({
      success: false,
      message: `Insufficient wallet balance. You need ₹${plan.price} to buy this, but only have ₹${wallet.available}. Please recharge first!`,
    });
  }

  // Deduct from available, add to investments
  wallet.available = Number((wallet.available - plan.price).toFixed(2));
  wallet.investment = Number((wallet.investment + plan.price).toFixed(2));

  const now = new Date();
  const expiresAt = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  const newInvestment: Investment = {
    id: `inv-${Math.random().toString(36).substring(2, 11)}`,
    userId,
    planId: plan.id,
    planName: plan.name,
    amount: plan.price,
    dailyIncome: plan.dailyIncome,
    startedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    lastYieldClaimedAt: now.toISOString(),
    status: "ACTIVE",
  };

  db.investments.push(newInvestment);

  // Transaction Log
  db.transactions.push({
    id: `tx-${Math.random().toString(36).substring(2, 9)}`,
    userId,
    type: "INVESTMENT",
    amount: plan.price,
    status: "SUCCESS",
    reference: newInvestment.id,
    description: `Purchased Miner: ${plan.name}`,
    createdAt: now.toISOString(),
  });

  // Notification
  db.notifications.push({
    id: `notif-${Math.random().toString(36).substring(2, 9)}`,
    userId,
    title: "Mining Rig Activated",
    message: `Your ${plan.name} machine is now online and mining has started!`,
    isRead: false,
    createdAt: now.toISOString(),
  });

  // --- 3-tier Affiliate Commissions on Purchase ---
  // If user has a sponsor, reward them (10% Level 1, 5% Level 2, 2% Level 3)
  let currentReferrerId = req.user.referredBy;
  const levels = [
    { level: 1, percent: 0.10, label: "L1 Referral Purchase Reward" },
    { level: 2, percent: 0.05, label: "L2 Referral Purchase Reward" },
    { level: 3, percent: 0.02, label: "L3 Referral Purchase Reward" },
  ];

  for (const lvl of levels) {
    if (!currentReferrerId) break;
    const referrer = db.users.find((u) => u.id === currentReferrerId);
    if (!referrer) break;

    const reward = Number((plan.price * lvl.percent).toFixed(2));
    if (reward > 0 && db.wallets[referrer.id]) {
      db.wallets[referrer.id].earnings = Number((db.wallets[referrer.id].earnings + reward).toFixed(2));
      
      db.transactions.push({
        id: `ref-${Math.random().toString(36).substring(2, 9)}`,
        userId: referrer.id,
        type: "REFERRAL_COMMISSION",
        amount: reward,
        status: "SUCCESS",
        reference: userId,
        description: `${lvl.label} from ${req.user.fullName}`,
        createdAt: now.toISOString(),
      });

      db.notifications.push({
        id: `notif-${Math.random().toString(36).substring(2, 9)}`,
        userId: referrer.id,
        title: "Team Referral Reward!",
        message: `You earned ₹${reward} commission from Level ${lvl.level} partner's miner activation!`,
        isRead: false,
        createdAt: now.toISOString(),
      });
    }

    currentReferrerId = referrer.referredBy; // go to next level
  }

  writeDB(db);
  res.json({
    success: true,
    message: `Mining machine ${plan.name} successfully activated! Daily mining returns will accumulate dynamically.`,
    data: { wallet },
  });
});

// User's Own Investments List
app.get("/api/investments", authenticateToken, (req: any, res) => {
  const db = readDB();
  const list = db.investments.filter((inv) => inv.userId === req.user.id);
  res.json({
    success: true,
    data: list,
  });
});

// Force Yield collection (Frontend trigger)
app.post("/api/investments/collect", authenticateToken, (req: any, res) => {
  processMiningYields(req.user.id);
  const db = readDB();
  const wallet = db.wallets[req.user.id];
  res.json({
    success: true,
    message: "Dynamic mining yields collected and credited to your wallet earnings balance!",
    data: { wallet },
  });
});

// Recharge Wallet Request
app.post("/api/wallet/recharge", authenticateToken, (req: any, res) => {
  const { amount, method, reference } = req.body;
  if (!amount || amount < 100) {
    return res.status(400).json({ success: false, message: "Minimum recharge amount is ₹100" });
  }
  if (!reference) {
    return res.status(400).json({ success: false, message: "UPI Ref No. or payment reference ID is required" });
  }

  const db = readDB();
  const id = `rec-${Math.random().toString(36).substring(2, 9)}`;
  const newRecharge: RechargeRequest = {
    id,
    userId: req.user.id,
    amount: Number(amount),
    method: method || "UPI",
    reference,
    status: "PENDING",
    createdAt: new Date().toISOString(),
  };

  db.recharges.push(newRecharge);

  // Create PENDING transaction entry
  db.transactions.push({
    id: `tx-${id}`,
    userId: req.user.id,
    type: "RECHARGE",
    amount: Number(amount),
    status: "PENDING",
    reference,
    description: `Wallet Recharge via ${method || "UPI"}`,
    createdAt: new Date().toISOString(),
  });

  writeDB(db);
  res.json({
    success: true,
    message: "Recharge request submitted successfully! Your balance will update immediately after admin verification.",
    data: newRecharge,
  });
});

// Withdrawal Request
app.post("/api/wallet/withdraw", authenticateToken, (req: any, res) => {
  const { amount, bankName, accountHolder, accountNumber, ifscCode, upiId } = req.body;
  if (!amount || amount < 200) {
    return res.status(400).json({ success: false, message: "Minimum withdrawal amount is ₹200" });
  }

  const db = readDB();
  const wallet = db.wallets[req.user.id];
  
  // Total withdrawable: available + earnings
  const withdrawable = wallet.available + wallet.earnings;
  if (withdrawable < amount) {
    return res.status(400).json({ success: false, message: "Insufficient total withdrawable balance." });
  }

  // Deduct first from earnings, then from available
  let remainingDeduct = Number(amount);
  const deductEarnings = Math.min(wallet.earnings, remainingDeduct);
  wallet.earnings = Number((wallet.earnings - deductEarnings).toFixed(2));
  remainingDeduct -= deductEarnings;

  if (remainingDeduct > 0) {
    wallet.available = Number((wallet.available - remainingDeduct).toFixed(2));
  }

  const id = `wd-${Math.random().toString(36).substring(2, 9)}`;
  const newWithdrawal: WithdrawalRequest = {
    id,
    userId: req.user.id,
    amount: Number(amount),
    bankName: bankName || "",
    accountHolder: accountHolder || "",
    accountNumber: accountNumber || "",
    ifscCode: ifscCode || "",
    upiId: upiId || "",
    status: "PENDING",
    createdAt: new Date().toISOString(),
  };

  db.withdrawals.push(newWithdrawal);

  db.transactions.push({
    id: `tx-${id}`,
    userId: req.user.id,
    type: "WITHDRAWAL",
    amount: Number(amount),
    status: "PENDING",
    reference: id,
    description: `Wallet Withdrawal Request`,
    createdAt: new Date().toISOString(),
  });

  writeDB(db);
  res.json({
    success: true,
    message: "Withdrawal request submitted! Processing will complete within 24 hours.",
    data: { wallet },
  });
});

// Transaction History
app.get("/api/transactions", authenticateToken, (req: any, res) => {
  const db = readDB();
  const list = db.transactions.filter((t) => t.userId === req.user.id);
  res.json({
    success: true,
    data: list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  });
});

// Notifications
app.get("/api/notifications", authenticateToken, (req: any, res) => {
  const db = readDB();
  const list = db.notifications.filter((n) => n.userId === req.user.id);
  res.json({
    success: true,
    data: list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  });
});

// Mark Notification Read
app.post("/api/notifications/read", authenticateToken, (req: any, res) => {
  const db = readDB();
  db.notifications.forEach((n) => {
    if (n.userId === req.user.id) {
      n.isRead = true;
    }
  });
  writeDB(db);
  res.json({ success: true });
});

// Referral Statistics
app.get("/api/referrals", authenticateToken, (req: any, res) => {
  const db = readDB();
  const userId = req.user.id;

  // Level 1: direct referrals
  const l1Users = db.users.filter((u) => u.referredBy === userId);
  const l1Ids = l1Users.map((u) => u.id);

  // Level 2: referrals of L1
  const l2Users = db.users.filter((u) => u.referredBy && l1Ids.includes(u.referredBy));
  const l2Ids = l2Users.map((u) => u.id);

  // Level 3: referrals of L2
  const l3Users = db.users.filter((u) => u.referredBy && l2Ids.includes(u.referredBy));

  // Count active miners in team
  const checkActiveMiners = (ids: string[]) => {
    return db.investments.filter((inv) => ids.includes(inv.userId) && inv.status === "ACTIVE").length;
  };

  const directMiners = checkActiveMiners(l1Ids);
  const totalTeamMiners = checkActiveMiners([...l1Ids, ...l2Ids, ...l3Users.map((u) => u.id)]);

  const commissions = db.transactions.filter(
    (t) => t.userId === userId && t.type === "REFERRAL_COMMISSION"
  );
  const totalCommissionEarned = commissions.reduce((sum, c) => sum + c.amount, 0);

  res.json({
    success: true,
    data: {
      referralCode: req.user.referralCode,
      referralLink: `${process.env.APP_URL || "http://localhost:3000"}/?ref=${req.user.referralCode}`,
      stats: {
        level1Count: l1Users.length,
        level2Count: l2Users.length,
        level3Count: l3Users.length,
        directMiners,
        totalTeamMiners,
        totalCommissionEarned,
      },
      team: {
        level1: l1Users.map((u) => ({ id: u.id, fullName: u.fullName, mobile: u.mobile, dateJoined: u.createdAt })),
        level2: l2Users.map((u) => ({ id: u.id, fullName: u.fullName, mobile: u.mobile, dateJoined: u.createdAt })),
        level3: l3Users.map((u) => ({ id: u.id, fullName: u.fullName, mobile: u.mobile, dateJoined: u.createdAt })),
      },
    },
  });
});

// Support Tickets
app.get("/api/support", authenticateToken, (req: any, res) => {
  const db = readDB();
  const list = db.tickets.filter((t) => t.userId === req.user.id);
  res.json({
    success: true,
    data: list,
  });
});

app.post("/api/support", authenticateToken, (req: any, res) => {
  const { subject, message } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ success: false, message: "Subject and message are required" });
  }

  const db = readDB();
  const newTicket: SupportTicket = {
    id: `ticket-${Math.random().toString(36).substring(2, 9)}`,
    userId: req.user.id,
    subject,
    status: "OPEN",
    messages: [
      {
        senderId: req.user.id,
        senderName: req.user.fullName,
        message,
        createdAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  };

  db.tickets.push(newTicket);
  writeDB(db);
  res.status(201).json({ success: true, message: "Support ticket created successfully!", data: newTicket });
});

app.post("/api/support/:ticketId/reply", authenticateToken, (req: any, res) => {
  const { message } = req.body;
  const { ticketId } = req.params;
  if (!message) {
    return res.status(400).json({ success: false, message: "Message cannot be empty" });
  }

  const db = readDB();
  const ticket = db.tickets.find((t) => t.id === ticketId);
  if (!ticket) {
    return res.status(404).json({ success: false, message: "Ticket not found" });
  }

  // Double check authorization (must be ticket owner or admin)
  if (ticket.userId !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Unauthorized to reply to this ticket" });
  }

  ticket.messages.push({
    senderId: req.user.id,
    senderName: req.user.fullName,
    message,
    createdAt: new Date().toISOString(),
  });

  if (req.user.role === "admin") {
    ticket.status = "IN_PROGRESS";
  } else {
    ticket.status = "OPEN";
  }

  writeDB(db);
  res.json({ success: true, data: ticket });
});


// ==========================================
// --- ADMINISTRATIVE CONTROLS (ADMIN ONLY) ---
// ==========================================

function verifyAdmin(req: any, res: any, next: any) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access restricted: Administrators only" });
  }
  next();
}

// Admin stats
app.get("/api/admin/stats", authenticateToken, verifyAdmin, (req, res) => {
  const db = readDB();
  const usersCount = db.users.length;
  const activeMinersCount = db.investments.filter(i => i.status === "ACTIVE").length;
  const totalRecharged = db.recharges.filter(r => r.status === "SUCCESS").reduce((sum, r) => sum + r.amount, 0);
  const totalWithdrawn = db.withdrawals.filter(w => w.status === "APPROVED").reduce((sum, w) => sum + w.amount, 0);

  res.json({
    success: true,
    data: {
      usersCount,
      activeMinersCount,
      totalRecharged,
      totalWithdrawn,
      pendingRechargesCount: db.recharges.filter(r => r.status === "PENDING").length,
      pendingWithdrawalsCount: db.withdrawals.filter(w => w.status === "PENDING").length,
      openTicketsCount: db.tickets.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS").length,
    }
  });
});

// Admin Users list
app.get("/api/admin/users", authenticateToken, verifyAdmin, (req, res) => {
  const db = readDB();
  const list = db.users.map(u => ({
    ...u,
    wallet: db.wallets[u.id] || { available: 0, investment: 0, earnings: 0 }
  }));
  res.json({ success: true, data: list });
});

// Admin manual wallet adjustment
app.post("/api/admin/users/:userId/adjust-balance", authenticateToken, verifyAdmin, (req, res) => {
  const { amount, balanceType } = req.body; // available, earnings
  const { userId } = req.params;

  if (amount === undefined || isNaN(amount)) {
    return res.status(400).json({ success: false, message: "Invalid amount" });
  }

  const db = readDB();
  const wallet = db.wallets[userId];
  if (!wallet) {
    return res.status(404).json({ success: false, message: "User wallet not found" });
  }

  if (balanceType === "earnings") {
    wallet.earnings = Number((wallet.earnings + Number(amount)).toFixed(2));
  } else {
    wallet.available = Number((wallet.available + Number(amount)).toFixed(2));
  }

  // Record adjustment transaction
  db.transactions.push({
    id: `adj-${Math.random().toString(36).substring(2, 9)}`,
    userId,
    type: "ADJUSTMENT",
    amount: Number(amount),
    status: "SUCCESS",
    reference: "ADMIN_ADJUST",
    description: `Admin balance adjustment on ${balanceType}`,
    createdAt: new Date().toISOString(),
  });

  db.notifications.push({
    id: `notif-${Math.random().toString(36).substring(2, 9)}`,
    userId,
    title: "Wallet Balance Adjusted",
    message: `Your ${balanceType} balance was adjusted by ₹${amount} by the admin system.`,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  writeDB(db);
  res.json({ success: true, message: "Balance successfully adjusted!", data: wallet });
});

// Admin list recharges
app.get("/api/admin/recharges", authenticateToken, verifyAdmin, (req, res) => {
  const db = readDB();
  const detailedRecharges = db.recharges.map(r => {
    const user = db.users.find(u => u.id === r.userId);
    return {
      ...r,
      userFullName: user ? user.fullName : "Unknown User",
      userMobile: user ? user.mobile : "N/A"
    };
  });
  res.json({ success: true, data: detailedRecharges });
});

// Admin verify and approve recharge
app.post("/api/admin/recharges/:id/verify", authenticateToken, verifyAdmin, (req, res) => {
  const { status } = req.body; // SUCCESS or FAILED
  const { id } = req.params;

  if (status !== "SUCCESS" && status !== "FAILED") {
    return res.status(400).json({ success: false, message: "Status must be SUCCESS or FAILED" });
  }

  const db = readDB();
  const recharge = db.recharges.find(r => r.id === id);
  if (!recharge) {
    return res.status(404).json({ success: false, message: "Recharge request not found" });
  }

  if (recharge.status !== "PENDING") {
    return res.status(400).json({ success: false, message: "This recharge request has already been processed" });
  }

  recharge.status = status;

  // Update original transaction
  const mainTx = db.transactions.find(t => t.reference === recharge.reference && t.type === "RECHARGE");
  if (mainTx) {
    mainTx.status = status;
  }

  if (status === "SUCCESS") {
    // Add to user wallet available balance
    if (db.wallets[recharge.userId]) {
      db.wallets[recharge.userId].available = Number(
        (db.wallets[recharge.userId].available + recharge.amount).toFixed(2)
      );
    }

    db.notifications.push({
      id: `notif-${Math.random().toString(36).substring(2, 9)}`,
      userId: recharge.userId,
      title: "Recharge Successful",
      message: `Your recharge request of ₹${recharge.amount} was verified and credited!`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  } else {
    db.notifications.push({
      id: `notif-${Math.random().toString(36).substring(2, 9)}`,
      userId: recharge.userId,
      title: "Recharge Declined",
      message: `Your recharge request of ₹${recharge.amount} was rejected. Please double check UPI Ref No.`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  writeDB(db);
  res.json({ success: true, message: `Recharge ${status.toLowerCase()} successfully!` });
});

// Admin list withdrawals
app.get("/api/admin/withdrawals", authenticateToken, verifyAdmin, (req, res) => {
  const db = readDB();
  const detailedWithdrawals = db.withdrawals.map(w => {
    const user = db.users.find(u => u.id === w.userId);
    return {
      ...w,
      userFullName: user ? user.fullName : "Unknown User",
      userMobile: user ? user.mobile : "N/A"
    };
  });
  res.json({ success: true, data: detailedWithdrawals });
});

// Admin verify and approve withdrawal
app.post("/api/admin/withdrawals/:id/verify", authenticateToken, verifyAdmin, (req, res) => {
  const { status } = req.body; // APPROVED or REJECTED
  const { id } = req.params;

  if (status !== "APPROVED" && status !== "REJECTED") {
    return res.status(400).json({ success: false, message: "Status must be APPROVED or REJECTED" });
  }

  const db = readDB();
  const withdrawal = db.withdrawals.find(w => w.id === id);
  if (!withdrawal) {
    return res.status(404).json({ success: false, message: "Withdrawal request not found" });
  }

  if (withdrawal.status !== "PENDING") {
    return res.status(400).json({ success: false, message: "This withdrawal request has already been processed" });
  }

  withdrawal.status = status;

  // Update original transaction
  const mainTx = db.transactions.find(t => t.reference === withdrawal.id && t.type === "WITHDRAWAL");
  if (mainTx) {
    mainTx.status = status === "APPROVED" ? "SUCCESS" : "FAILED";
  }

  if (status === "REJECTED") {
    // Return money to user's wallet (credit to available balance)
    if (db.wallets[withdrawal.userId]) {
      db.wallets[withdrawal.userId].available = Number(
        (db.wallets[withdrawal.userId].available + withdrawal.amount).toFixed(2)
      );
    }

    db.notifications.push({
      id: `notif-${Math.random().toString(36).substring(2, 9)}`,
      userId: withdrawal.userId,
      title: "Withdrawal Rejected",
      message: `Your withdrawal of ₹${withdrawal.amount} was rejected and funds were refunded to your available balance.`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  } else {
    db.notifications.push({
      id: `notif-${Math.random().toString(36).substring(2, 9)}`,
      userId: withdrawal.userId,
      title: "Withdrawal Approved",
      message: `Your withdrawal of ₹${withdrawal.amount} was approved and dispatched to bank details!`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  writeDB(db);
  res.json({ success: true, message: `Withdrawal successfully updated to ${status.toLowerCase()}` });
});

// Admin support ticket management
app.get("/api/admin/tickets", authenticateToken, verifyAdmin, (req, res) => {
  const db = readDB();
  const detailedTickets = db.tickets.map(t => {
    const user = db.users.find(u => u.id === t.userId);
    return {
      ...t,
      userFullName: user ? user.fullName : "Unknown User",
      userMobile: user ? user.mobile : "N/A"
    };
  });
  res.json({ success: true, data: detailedTickets });
});

// Admin change support ticket status
app.post("/api/admin/tickets/:ticketId/status", authenticateToken, verifyAdmin, (req, res) => {
  const { status } = req.body;
  const { ticketId } = req.params;

  const db = readDB();
  const ticket = db.tickets.find(t => t.id === ticketId);
  if (!ticket) {
    return res.status(404).json({ success: false, message: "Ticket not found" });
  }

  ticket.status = status;
  writeDB(db);
  res.json({ success: true, message: "Ticket status updated successfully!" });
});

// Admin create/edit plan
app.post("/api/admin/plans", authenticateToken, verifyAdmin, (req, res) => {
  const { name, category, price, dailyIncome, durationDays, hashrate, imageUrl } = req.body;

  if (!name || !price || !dailyIncome || !durationDays) {
    return res.status(400).json({ success: false, message: "Name, price, dailyIncome, and durationDays are required" });
  }

  const db = readDB();
  const newPlan: MiningPlan = {
    id: `plan-${Math.random().toString(36).substring(2, 9)}`,
    name,
    category: category || "Normal",
    price: Number(price),
    dailyIncome: Number(dailyIncome),
    durationDays: Number(durationDays),
    hashrate: hashrate || "100 TH/s",
    imageUrl: imageUrl || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
    status: true,
  };

  db.plans.push(newPlan);
  writeDB(db);
  res.status(201).json({ success: true, message: "Mining rig plan created!", data: newPlan });
});


// --- Vite Middleware setup for full-stack SPA serving ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Mining Energy Backend] Running on http://localhost:${PORT}`);
  });
}

startServer();
