import React, { useState, useEffect } from "react";
import { Shield, Eye, EyeOff, KeyRound, Smartphone, UserPlus, LogIn, TrendingUp } from "lucide-react";

interface AuthViewProps {
  onLoginSuccess: (token: string, user: any) => void;
}

import { api } from "../lib/api";

export default function AuthView({ onLoginSuccess }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-fill referral code from query params if available
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      setReferralCode(ref.toUpperCase());
      setIsLogin(false); // Switch to registration
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!mobile || !password) {
      setError("Please fill in all credentials.");
      return;
    }

    if (mobile.length < 10) {
      setError("Please enter a valid mobile number.");
      return;
    }

    if (!isLogin) {
      if (!fullName) {
        setError("Please enter your full name.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);

    try {
      let uid = "";
      if (isLogin) {
        uid = await api.login(mobile, password);
      } else {
        uid = await api.register(mobile, password, fullName, referralCode);
      }
      
      setSuccess(isLogin ? "Login successful!" : "Registration successful!");
      setTimeout(async () => {
        try {
          const { user } = await api.getMe();
          onLoginSuccess(uid, user);
        } catch (err) {
          setError("Failed to fetch user data after auth.");
        }
      }, 500);
    } catch (err: any) {
      if (err.code === "auth/invalid-credential") {
        setError("Invalid mobile number or password.");
      } else {
        setError(err.message || "Authentication failed. Please try again.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const uid = await api.signInWithGoogle();
      setSuccess("Google Sign-In successful!");
      setTimeout(async () => {
        try {
          const { user } = await api.getMe();
          onLoginSuccess(uid, user);
        } catch (err) {
          setError("Failed to fetch user data after Google Auth.");
        }
      }, 500);
    } catch (err: any) {
      if (err.code === "auth/popup-blocked") {
        setError("Sign-in popup was blocked. Please allow popups for this site.");
      } else {
        setError(err.message || "Google Authentication failed. Please try again.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4 relative overflow-hidden">
      {/* Decorative ambient glowing orbits */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl shadow-2xl p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20 text-orange-500 mb-3 animate-pulse">
            <TrendingUp size={36} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans text-center">
            MINING ENERGY
          </h1>
          <p className="text-slate-400 text-sm mt-1 text-center">
            Premium Cryptocurrency Mining Investment Platform
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <UserPlus size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Mobile Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <Smartphone size={18} />
              </span>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <KeyRound size={18} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-11 pr-11 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <KeyRound size={18} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Referral Code (Optional)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <Shield size={18} />
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. ME123456"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors uppercase font-mono"
                  />
                </div>
              </div>
            </>
          )}

          {isLogin && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => alert("Please contact Administrator support or register a new account.")}
                className="text-xs text-orange-500 hover:underline font-medium"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-orange-950/20 hover:shadow-orange-600/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isLogin ? (
              <>
                <LogIn size={18} />
                <span>Login Securely</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Create Free Account</span>
              </>
            )}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900 px-3.5 text-slate-500 font-medium">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleGoogleSignIn}
          className="w-full bg-slate-950 hover:bg-slate-800 text-slate-200 font-semibold py-3 px-4 rounded-2xl flex items-center justify-center gap-3 border border-slate-800 shadow-md transition-all hover:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <div className="w-5 h-5 flex items-center justify-center font-bold text-base text-orange-500 font-sans select-none">G</div>
              <span>Sign in with Google</span>
            </>
          )}
        </button>

        <div className="mt-6 pt-6 border-t border-slate-800 text-center">
          <p className="text-sm text-slate-400">
            {isLogin ? "New to Mining Energy?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setSuccess("");
              }}
              className="text-orange-500 hover:underline font-semibold"
            >
              {isLogin ? "Register Now" : "Login Here"}
            </button>
          </p>
        </div>

        {isLogin && (
          <div className="mt-4 p-3 bg-slate-950 border border-slate-800/80 rounded-2xl text-center">
            <p className="text-xs text-slate-500">
              Please enter your credentials to securely access your investment dashboard.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
