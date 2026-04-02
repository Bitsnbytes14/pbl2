"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { LogOut, Home, Users, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import RoomChat from "@/components/RoomChat";

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [allocation, setAllocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated") {
      if (session.user?.role === "admin" || session.user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        fetchAllocation();
      }
    }
  }, [status, router, session]);

  const fetchAllocation = async () => {
    try {
      const email = session?.user?.email;
      if (!email) return;
      
      const res = await axios.get(`http://localhost:5000/api/student/dashboard/${email}`);
      setAllocation(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Loader2 className="w-10 h-10 text-blue-500" />
        </motion.div>
        <p className="text-slate-500 mt-4 animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 relative overflow-hidden">
      {/* Soft warm background gradients */}
      <div className="absolute top-0 right-0 w-full h-[60vh] bg-gradient-to-b from-blue-100/50 to-transparent pointer-events-none" />

      {/* Top Navbar */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="w-full px-8 md:px-16 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Home className="w-4 h-4 text-blue-600" />
            </div>
            <span className="font-bold text-lg hidden sm:block tracking-wide">Student Portal</span>
          </div>
          
          <div className="flex items-center gap-5">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-800">{session?.user?.name}</p>
              <p className="text-xs text-slate-500">{session?.user?.email}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden border border-slate-300 hidden sm:block">
              {session?.user?.image ? (
                <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex justify-center items-center text-xs font-bold text-slate-600">{session?.user?.name?.charAt(0)}</div>
              )}
            </div>
            <button 
              onClick={() => signOut({ callbackUrl: '/' })}
              className="p-2 text-slate-500 hover:text-red-500 hover:bg-slate-100 rounded-lg transition-colors border border-transparent"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="w-full px-8 md:px-16 py-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center sm:text-left"
        >
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
            Welcome back, {session?.user?.name?.split(' ')[0]}
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Here is your hostel allocation status for the upcoming semester.</p>
        </motion.div>

        {/* Status Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5, type: "spring" }}
          className="bg-white border border-slate-200 shadow-sm rounded-[2rem] p-8 md:p-12 relative overflow-hidden group"
        >

          {allocation?.status === 'NOT_SUBMITTED' ? (
            <div className="text-center py-10">
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }} 
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-24 h-24 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <AlertCircle className="w-12 h-12 text-amber-500" />
              </motion.div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">Action Required</h2>
              <p className="text-slate-500 mb-10 max-w-md mx-auto leading-relaxed">
                You have not submitted your room preference form yet. Allocation can only proceed after submission.
              </p>
              <a 
                href="https://forms.gle/aW95oniwfrbkkxhC7" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-10 rounded-2xl transition-all shadow-md hover:-translate-y-1"
              >
                Start Preference Form <Sparkles className="w-5 h-5 ml-2" />
              </a>
            </div>
          ) : allocation?.status === 'PENDING_ALLOCATION' ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-blue-50 border border-blue-200 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                <div className="absolute inset-0 border-t-2 border-r-2 border-blue-400 rounded-full animate-spin"></div>
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">Allocation in Progress</h2>
              <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
                Your form has been received. Administration is actively gathering preferences and finding the perfect match. Check back shortly.
              </p>
            </div>
          ) : allocation?.status === 'ALLOCATED' ? (
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                <div>
                  <h2 className="text-sm text-blue-600 font-bold uppercase tracking-widest mb-2">Your Assigned Room</h2>
                  <div className="text-6xl font-black text-slate-800">{allocation.room_number}</div>
                </div>
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="px-6 py-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center shrink-0 shadow-sm"
                >
                  <p className="text-emerald-700 text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Strong Roommate Match
                  </p>
                </motion.div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <Users className="text-blue-600" /> Your Roommates
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allocation.roommates?.map((rm: any, idx: number) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + (idx * 0.1) }}
                    key={idx} 
                    className="bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors p-5 rounded-2xl flex items-center gap-4"
                  >
                    <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-700 shrink-0">
                      {rm.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-semibold text-slate-800 truncate text-lg">{rm.name}</p>
                      <p className="text-sm text-slate-500 flex items-center gap-2 truncate mt-1">
                        {rm.branch} <span className="w-1 h-1 bg-slate-300 rounded-full mx-1"></span> {rm.year}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Roommate Chat Area */}
              <div className="mt-12 pt-8 border-t border-slate-100">
                <RoomChat 
                  roomId={allocation.room_id} 
                  currentUserEmail={session?.user?.email as string} 
                  currentUserName={session?.user?.name as string} 
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              Unable to load status. Please try again or contact administration.
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

const AlertCircle = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);
