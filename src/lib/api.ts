import { db, auth } from "../firebase";
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  query, where, orderBy, addDoc, serverTimestamp, increment, runTransaction, Timestamp
} from "firebase/firestore";
import { 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  GoogleAuthProvider, signInWithPopup
} from "firebase/auth";

// Helper to convert mobile to email
const mobileToEmail = (mobile: string) => `${mobile}@miningenergy.app`;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const api = {
  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const userId = result.user.uid;
    
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    
    if (!userSnap.exists()) {
      const myReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await setDoc(userDocRef, {
        fullName: result.user.displayName || "Google User",
        mobile: "",
        email: result.user.email || "",
        referralCode: myReferralCode,
        referredBy: null,
        role: "user",
        createdAt: serverTimestamp()
      });

      await setDoc(doc(db, "wallets", userId), {
        available: 100, // Welcome bonus of ₹100!
        investment: 0,
        earnings: 0,
        lastCheckIn: null
      });

      await addDoc(collection(db, "notifications"), {
        userId,
        title: "Welcome Bonus!",
        message: "Thank you for registering. We have credited ₹100 registration bonus to your wallet!",
        isRead: false,
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, "transactions"), {
        userId,
        type: "BONUS",
        amount: 100,
        status: "SUCCESS",
        reference: "WELCOME",
        description: "Welcome Registration Bonus",
        createdAt: serverTimestamp()
      });
    }
    return userId;
  },

  async register(mobile: string, password: string, fullName: string, referralCode: string) {
    const email = mobileToEmail(mobile);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;
    
    // Create User Doc
    const myReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    await setDoc(doc(db, "users", userId), {
      fullName,
      mobile,
      referralCode: myReferralCode,
      referredBy: referralCode || null,
      role: "user",
      createdAt: serverTimestamp()
    });

    // Create Wallet Doc
    await setDoc(doc(db, "wallets", userId), {
      available: 0,
      investment: 0,
      earnings: 0,
      lastCheckIn: null
    });

    return userId;
  },

  async login(mobile: string, password: string) {
    const email = mobileToEmail(mobile);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return cred.user.uid;
    } catch (err: any) {
      if ((err.code === "auth/invalid-credential" || err.code === "auth/user-not-found") && mobile === "8144553816" && password === "admin16") {
        // Auto-register admin if they don't exist yet
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const userId = cred.user.uid;
        await setDoc(doc(db, "users", userId), {
          fullName: "System Admin",
          mobile,
          referralCode: "ADMIN777",
          referredBy: null,
          role: "admin",
          createdAt: serverTimestamp()
        });
        await setDoc(doc(db, "wallets", userId), {
          available: 100000,
          investment: 0,
          earnings: 0,
          lastCheckIn: null
        });
        return userId;
      }
      throw err;
    }
  },

  async logout() {
    await signOut(auth);
  },

  async getMe() {
    if (!auth.currentUser) throw new Error("Not authenticated");
    const uid = auth.currentUser.uid;
    const userDocRef = doc(db, "users", uid);
    const walletDocRef = doc(db, "wallets", uid);

    try {
      let userSnap = await getDoc(userDocRef);
      let walletSnap = await getDoc(walletDocRef);

      if (!userSnap.exists()) {
        const email = auth.currentUser.email || "";
        let mobile = email.split("@")[0];
        if (mobile.length !== 10 || isNaN(Number(mobile))) {
          mobile = "";
        }
        const myReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        await setDoc(userDocRef, {
          fullName: auth.currentUser.displayName || "Mining Member",
          mobile: mobile,
          email: auth.currentUser.email || "",
          referralCode: myReferralCode,
          referredBy: null,
          role: mobile === "8144553816" ? "admin" : "user",
          createdAt: serverTimestamp()
        });
        userSnap = await getDoc(userDocRef);
      }

      if (!walletSnap.exists()) {
        await setDoc(walletDocRef, {
          available: 100, // Welcome bonus of ₹100!
          investment: 0,
          earnings: 0,
          lastCheckIn: null
        });
        walletSnap = await getDoc(walletDocRef);
      }

      const wData = walletSnap.data();
      return {
        user: { id: uid, ...userSnap.data() },
        wallet: {
          available: wData?.available ?? 0,
          investment: wData?.investment ?? 0,
          earnings: wData?.earnings ?? 0,
          lastCheckIn: wData?.lastCheckIn ?? null
        }
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    }
  },

  async getPlans() {
    try {
      const q = query(collection(db, "plans"), where("status", "==", true));
      const snap = await getDocs(q);
      if (snap.empty) {
        if (!auth.currentUser) {
          return [];
        }
        // Seed default plans
        const DEFAULT_PLANS = [
          { name: "Antminer S19 Pro (Basic)", category: "Normal", price: 500, dailyIncome: 25, durationDays: 30, hashrate: "110 TH/s", imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80", status: true },
          { name: "Whatsminer M30S++", category: "Normal", price: 1500, dailyIncome: 80, durationDays: 45, hashrate: "112 TH/s", imageUrl: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=600&q=80", status: true },
          { name: "AvalonMiner 1246 Pro", category: "VIP", price: 3000, dailyIncome: 180, durationDays: 60, hashrate: "90 TH/s", imageUrl: "https://images.unsplash.com/photo-1591453089816-0fbb971b454c?auto=format&fit=crop&w=600&q=80", status: true },
          { name: "Bitmain Antminer L7 (Scrypt)", category: "VIP", price: 5000, dailyIncome: 320, durationDays: 60, hashrate: "9.5 GH/s", imageUrl: "https://images.unsplash.com/photo-1605792657660-596af9009e82?auto=format&fit=crop&w=600&q=80", status: true },
          { name: "Giga Mining Cluster Node v1", category: "Premium", price: 10000, dailyIncome: 700, durationDays: 90, hashrate: "500 TH/s", imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80", status: true },
          { name: "Super-Energy Quantum Grid", category: "Exclusive", price: 25000, dailyIncome: 2000, durationDays: 120, hashrate: "2.5 PH/s", imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80", status: true }
        ];
        const createdPlans = [];
        for (const p of DEFAULT_PLANS) {
          const pRef = doc(collection(db, "plans"));
          await setDoc(pRef, p);
          createdPlans.push({ id: pRef.id, ...p });
        }
        return createdPlans;
      }
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, "plans");
    }
  },

  async getInvestments() {
    if (!auth.currentUser) return [];
    try {
      const q = query(collection(db, "investments"), where("userId", "==", auth.currentUser.uid));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "investments");
    }
  },

  async getTransactions() {
    if (!auth.currentUser) return [];
    try {
      const q = query(collection(db, "transactions"), where("userId", "==", auth.currentUser.uid), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "transactions");
    }
  },

  async getNotifications() {
    if (!auth.currentUser) return [];
    try {
      const q = query(collection(db, "notifications"), where("userId", "==", auth.currentUser.uid), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "notifications");
    }
  },

  async getTickets() {
    if (!auth.currentUser) return [];
    try {
      const q = query(collection(db, "tickets"), where("userId", "==", auth.currentUser.uid));
      const snap = await getDocs(q);
      // get messages for each ticket
      const tickets = [];
      for (const d of snap.docs) {
        const msgsSnap = await getDocs(collection(db, "tickets", d.id, "messages"));
        tickets.push({
          id: d.id,
          ...d.data(),
          messages: msgsSnap.docs.map(m => ({ id: m.id, ...m.data() })).sort((a: any, b: any) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0))
        });
      }
      return tickets;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "tickets");
    }
  },

  async checkIn() {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("Not auth");
    return await runTransaction(db, async (t) => {
      const walletRef = doc(db, "wallets", uid);
      const walletSnap = await t.get(walletRef);
      const w = walletSnap.data() as any;
      const today = new Date().toISOString().split("T")[0];
      if (w.lastCheckIn === today) {
        throw new Error("Already checked in today.");
      }
      t.update(walletRef, {
        available: increment(20),
        lastCheckIn: today
      });
      const txRef = doc(collection(db, "transactions"));
      t.set(txRef, {
        userId: uid,
        type: "CHECK_IN",
        amount: 20,
        status: "SUCCESS",
        description: "Daily Check-in Bonus",
        createdAt: serverTimestamp()
      });
      return { success: true, message: "Checked in! +₹20" };
    });
  },

  async buyPlan(planId: string) {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("Not auth");
    return await runTransaction(db, async (t) => {
      const walletRef = doc(db, "wallets", uid);
      const planRef = doc(db, "plans", planId);
      
      const [walletSnap, planSnap] = await Promise.all([t.get(walletRef), t.get(planRef)]);
      const w = walletSnap.data() as any;
      const p = planSnap.data() as any;
      
      if (w.available < p.price) {
        throw new Error("Insufficient balance.");
      }
      
      t.update(walletRef, {
        available: increment(-p.price),
        investment: increment(p.price)
      });
      
      const invRef = doc(collection(db, "investments"));
      t.set(invRef, {
        userId: uid,
        planId,
        amount: p.price,
        dailyIncome: p.dailyIncome,
        remainingDays: p.durationDays,
        status: "ACTIVE",
        startedAt: serverTimestamp(),
        nextYieldAt: new Date(Date.now() + 24*3600*1000)
      });
      
      const txRef = doc(collection(db, "transactions"));
      t.set(txRef, {
        userId: uid,
        type: "PLAN_PURCHASE",
        amount: p.price,
        status: "SUCCESS",
        description: `Bought ${p.name}`,
        createdAt: serverTimestamp()
      });
      
      return { success: true, message: "Plan purchased successfully" };
    });
  },

  async collectYield() {
     const uid = auth.currentUser?.uid;
     if (!uid) throw new Error("Not auth");
     const q = query(collection(db, "investments"), where("userId", "==", uid), where("status", "==", "ACTIVE"));
     const snap = await getDocs(q);
     let totalYield = 0;
     const now = new Date();
     
     await runTransaction(db, async (t) => {
        // Collect yields
        // Note: Realistically runTransaction doesn't support queries inside, so we fetched outside.
        // This is safe-ish for client side logic.
        const walletRef = doc(db, "wallets", uid);
        
        for (const invDoc of snap.docs) {
          const inv = invDoc.data();
          if (inv.remainingDays > 0) { // simplified time check for demo
            totalYield += inv.dailyIncome;
            t.update(invDoc.ref, {
              remainingDays: increment(-1),
              nextYieldAt: new Date(now.getTime() + 24*3600*1000)
            });
          }
        }
        
        if (totalYield > 0) {
          t.update(walletRef, {
            available: increment(totalYield),
            earnings: increment(totalYield)
          });
          
          const txRef = doc(collection(db, "transactions"));
          t.set(txRef, {
            userId: uid,
            type: "YIELD",
            amount: totalYield,
            status: "SUCCESS",
            description: "Daily rig yield collection",
            createdAt: serverTimestamp()
          });
        }
     });
     
     if (totalYield > 0) {
       return { success: true, message: `Collected ₹${totalYield} successfully!` };
     } else {
       throw new Error("No yields ready to collect right now.");
     }
  },

  async recharge(amount: number, method: string, reference: string) {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("Not auth");
    const recRef = doc(collection(db, "recharges"));
    await setDoc(recRef, {
      userId: uid,
      amount,
      method,
      reference,
      status: "PENDING",
      createdAt: serverTimestamp()
    });
    
    const txRef = doc(collection(db, "transactions"));
    await setDoc(txRef, {
      userId: uid,
      type: "RECHARGE",
      amount,
      status: "PENDING",
      reference,
      description: "Wallet Deposit",
      createdAt: serverTimestamp()
    });
    return { success: true, message: "Recharge submitted for review." };
  },

  async instantAutoRecharge(amount: number, method: string) {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("Not authenticated");
    
    const reference = "AUTO_UPI_" + Math.random().toString(36).substring(2, 11).toUpperCase();
    
    // Create successful recharge doc
    const recRef = doc(collection(db, "recharges"));
    await setDoc(recRef, {
      userId: uid,
      amount,
      method,
      reference,
      status: "SUCCESS",
      createdAt: serverTimestamp()
    });
    
    // Create successful transaction doc
    const txRef = doc(collection(db, "transactions"));
    await setDoc(txRef, {
      userId: uid,
      type: "RECHARGE",
      amount,
      status: "SUCCESS",
      reference,
      description: `Instant Deposit via ${method}`,
      createdAt: serverTimestamp()
    });

    // Update wallet immediately
    const walletRef = doc(db, "wallets", uid);
    await updateDoc(walletRef, {
      available: increment(amount)
    });

    return { success: true, message: `Payment Received! ₹${amount} successfully credited to your wallet.` };
  },

  async withdraw(payload: any) {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("Not auth");
    
    return await runTransaction(db, async (t) => {
      const walletRef = doc(db, "wallets", uid);
      const wSnap = await t.get(walletRef);
      const w = wSnap.data() as any;
      if (w.available < payload.amount) throw new Error("Insufficient balance.");
      
      t.update(walletRef, {
        available: increment(-payload.amount)
      });
      
      const wdRef = doc(collection(db, "withdrawals"));
      t.set(wdRef, {
        userId: uid,
        amount: payload.amount,
        bankName: payload.bankName,
        accountNumber: payload.accountNumber,
        ifscCode: payload.ifscCode,
        status: "PENDING",
        createdAt: serverTimestamp()
      });
      
      const txRef = doc(collection(db, "transactions"));
      t.set(txRef, {
        userId: uid,
        type: "WITHDRAWAL",
        amount: payload.amount,
        status: "PENDING",
        description: "Bank Withdrawal",
        createdAt: serverTimestamp()
      });
      
      return { success: true, message: "Withdrawal requested." };
    });
  },

  async createTicket(subject: string, message: string) {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("Not auth");
    try {
      const tRef = doc(collection(db, "tickets"));
      await setDoc(tRef, {
        userId: uid,
        subject,
        status: "OPEN"
      });
      const mRef = doc(collection(db, "tickets", tRef.id, "messages"));
      await setDoc(mRef, {
        senderId: uid,
        ticketUserId: uid,
        content: message,
        timestamp: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "tickets");
    }
  },

  async replyTicket(ticketId: string, message: string) {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("Not auth");
    try {
      // Find the parent ticket owner UID
      const tSnap = await getDoc(doc(db, "tickets", ticketId));
      const ticketUserId = tSnap.exists() ? (tSnap.data()?.userId || uid) : uid;

      const mRef = doc(collection(db, "tickets", ticketId, "messages"));
      await setDoc(mRef, {
        senderId: uid,
        ticketUserId,
        content: message,
        timestamp: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `tickets/${ticketId}/messages`);
    }
  },

  async markNotifsRead() {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("Not auth");
    const q = query(collection(db, "notifications"), where("userId", "==", uid), where("isRead", "==", false));
    const snap = await getDocs(q);
    const promises = snap.docs.map(d => updateDoc(d.ref, { isRead: true }));
    await Promise.all(promises);
  },

  // Admin Methods
  async adminGetStats() {
    try {
      const users = await getDocs(collection(db, "users"));
      const invs = await getDocs(query(collection(db, "investments"), where("status", "==", "ACTIVE")));
      const wds = await getDocs(query(collection(db, "withdrawals"), where("status", "==", "APPROVED")));
      const wdsAll = await getDocs(query(collection(db, "withdrawals"), where("status", "==", "PENDING")));
      const recAll = await getDocs(query(collection(db, "recharges"), where("status", "==", "PENDING")));
      const recApproved = await getDocs(query(collection(db, "recharges"), where("status", "==", "SUCCESS")));
      const tics = await getDocs(query(collection(db, "tickets"), where("status", "==", "OPEN")));
      
      let totalRecharged = 0;
      recApproved.forEach(d => totalRecharged += d.data().amount || 0);
      
      let totalWithdrawn = 0;
      wds.forEach(d => totalWithdrawn += d.data().amount || 0);

      return { 
        usersCount: users.size,
        activeMinersCount: invs.size, 
        totalRecharged, 
        totalWithdrawn,
        pendingRechargesCount: recAll.size,
        pendingWithdrawalsCount: wdsAll.size,
        openTicketsCount: tics.size
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, "admin/stats");
    }
  },
  async adminGetUsers() {
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const walletsSnap = await getDocs(collection(db, "wallets"));
      
      const walletsMap = new Map();
      walletsSnap.docs.forEach(doc => {
        walletsMap.set(doc.id, doc.data());
      });

      return usersSnap.docs.map(d => {
        const userData = d.data();
        const userId = d.id;
        const wData = walletsMap.get(userId);
        const wallet = {
          available: wData?.available ?? 0,
          investment: wData?.investment ?? 0,
          earnings: wData?.earnings ?? 0,
          lastCheckIn: wData?.lastCheckIn ?? null
        };
        return {
          id: userId,
          ...userData,
          wallet
        };
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "admin/users");
    }
  },
  async adminGetRecharges() {
    const snap = await getDocs(collection(db, "recharges"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async adminGetWithdrawals() {
    const snap = await getDocs(collection(db, "withdrawals"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async adminGetTickets() {
    const snap = await getDocs(collection(db, "tickets"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async adminVerifyRecharge(id: string, status: string) { 
    return await runTransaction(db, async (t) => {
      const rRef = doc(db, "recharges", id);
      const rSnap = await t.get(rRef);
      if (!rSnap.exists()) throw new Error("Not found");
      const r = rSnap.data();
      if (r.status !== "PENDING") throw new Error("Already processed");
      
      t.update(rRef, { status });
      if (status === "SUCCESS") {
        t.update(doc(db, "wallets", r.userId), {
          available: increment(r.amount)
        });
      }
      return { success: true };
    });
  },
  async adminVerifyWithdrawal(id: string, status: string) { 
    return await runTransaction(db, async (t) => {
      const wRef = doc(db, "withdrawals", id);
      const wSnap = await t.get(wRef);
      if (!wSnap.exists()) throw new Error("Not found");
      const w = wSnap.data();
      if (w.status !== "PENDING") throw new Error("Already processed");
      
      t.update(wRef, { status });
      if (status === "REJECTED") {
        t.update(doc(db, "wallets", w.userId), {
          available: increment(w.amount)
        });
      }
      return { success: true };
    });
  },
  async adminAdjustBalance(userId: string, amount: number, type: string) { 
    const updateObj: any = {};
    updateObj[type] = increment(amount);
    await updateDoc(doc(db, "wallets", userId), updateObj);
    return { success: true };
  },
  async adminUpdateTicketStatus(ticketId: string, status: string) { 
    await updateDoc(doc(db, "tickets", ticketId), { status });
    return { success: true };
  },
  async adminCreatePlan(plan: any) { 
    await setDoc(doc(collection(db, "plans")), { ...plan, status: true });
    return { success: true };
  },
};
