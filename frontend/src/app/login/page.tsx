"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ShieldCheck, User, UserCog } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("STUDENT");
  const [demoMode, setDemoMode] = useState(false);
  const [demoEmail, setDemoEmail] = useState("");
  const [demoPassword, setDemoPassword] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.role === "admin" || session?.user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/student");
      }
    }
  }, [status, session, router]);

  const handleSignIn = async () => {
    setLoading(true);
    document.cookie = `selectedRole=${role}; path=/; max-age=3600`;
    await signIn("google", { callbackUrl: role === "ADMIN" ? "/admin" : "/student" });
  };

  const handleDemoSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    document.cookie = `selectedRole=${role}; path=/; max-age=3600`;
    await signIn("credentials", {
      email: demoEmail,
      password: demoPassword,
      callbackUrl: role === "ADMIN" ? "/admin" : "/student",
    });
  };

  // If still checking session, show nothing to avoid flash
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute top-0 right-0 w-full h-[60vh] bg-gradient-to-b from-blue-100/50 to-transparent pointer-events-none" />

      {/* Back to home link */}
      <button
        onClick={() => router.push("/")}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-sm text-slate-400 hover:text-slate-700 transition-colors"
      >
        ← Back to home
      </button>

      <div className="z-10 relative flex flex-col items-center px-4 w-full max-w-lg mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full"
        >
          {/* Brand mark */}
          <div className="text-center mb-6">
            <span className="font-serif text-2xl font-semibold text-slate-700 tracking-tight">
              Room<span className="text-orange-500">Sync</span>
            </span>
          </div>

          {/* Main auth card */}
          <div className="bg-white px-10 py-12 rounded-[2rem] text-center shadow-[0_10px_50px_rgba(0,0,0,0.05)] border border-slate-100">

            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className={`mx-auto p-4 rounded-full w-20 h-20 flex items-center justify-center mb-6 transition-colors duration-500 ${
                role === "ADMIN"
                  ? "bg-violet-100 text-violet-600"
                  : "bg-blue-100 text-blue-600"
              }`}
            >
              {role === "ADMIN" ? (
                <UserCog className="w-10 h-10" />
              ) : (
                <User className="w-10 h-10" strokeWidth={1.5} />
              )}
            </motion.div>

            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Hostel Allotment Portal
            </h1>

            <p className="text-slate-500 mb-10 text-sm px-2 leading-relaxed">
              Welcome back. Please specify your role to sign into the housing
              administration system.
            </p>

            {/* Role toggle */}
            <div className="flex bg-slate-100 p-1.5 rounded-xl mb-8 relative z-20">
              <button
                onClick={() => setRole("STUDENT")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  role === "STUDENT"
                    ? "text-blue-700 bg-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <User className="w-4 h-4" /> Student
              </button>
              <button
                onClick={() => setRole("ADMIN")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  role === "ADMIN"
                    ? "text-violet-700 bg-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <UserCog className="w-4 h-4" /> Faculty Admin
              </button>
            </div>

            <AnimatePresence mode="wait">
              {!demoMode ? (
                <motion.div
                  key="google-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <button
                    onClick={handleSignIn}
                    disabled={loading}
                    className={`w-full text-white font-medium py-4 px-6 rounded-xl flex items-center justify-center gap-4 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                      role === "ADMIN"
                        ? "bg-violet-600 hover:bg-violet-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <div className="bg-white p-1 rounded-md">
                          <svg
                            viewBox="0 0 24 24"
                            className="w-4 h-4 flex-shrink-0"
                            preserveAspectRatio="xMidYMid meet"
                          >
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.86C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.86z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.86c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                          </svg>
                        </div>
                        Sign in via SIT Account
                        <ChevronRight className="w-5 h-5 ml-1 opacity-70" />
                      </>
                    )}
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="demo-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleDemoSignIn}
                  className="space-y-4"
                >
                  <input
                    type="email"
                    placeholder="E.g., student0@sitpune.edu.in"
                    value={demoEmail}
                    onChange={(e) => setDemoEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                  />
                  <input
                    type="password"
                    placeholder="Enter manual password..."
                    value={demoPassword}
                    onChange={(e) => setDemoPassword(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3.5 px-6 rounded-xl transition-all shadow-md disabled:opacity-50"
                  >
                    {loading ? "Authenticating..." : "Manual Sign In"}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Restricted to @sitpune.edu.in Domains</span>
              {/* Hidden backdoor toggle */}
              <button
                onClick={() => setDemoMode(!demoMode)}
                className="ml-auto text-slate-300 hover:text-slate-500 font-bold transition-colors"
                title="Toggle Manual Override"
                type="button"
              >
                •
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}