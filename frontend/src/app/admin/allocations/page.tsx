"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { ArrowLeft, Database, Download, Lock, Unlock, Shuffle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { API_URL } from "@/lib/api";

export default function AdminAllocations() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [allocations, setAllocations] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Custom manual swap states
  const [swapping, setSwapping] = useState(false);
  const [swapData, setSwapData] = useState({ roomAId: '', memberA: '', roomBId: '', memberB: '' });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated" && session.user?.role !== "admin" && session.user?.role !== "ADMIN") {
      router.push("/unauthorized");
    } else if (status === "authenticated") {
      fetchAllocations();
    }
  }, [status, router, session]);

  const fetchAllocations = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/admin/allocations`);
      if (res.data.allocations) {
         setAllocations(res.data.allocations);
         setUnassigned(res.data.unassigned || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLock = async (roomId: string, currentLockStatus: boolean) => {
      const newStatus = !currentLockStatus;
      
      // Optimistic UI Update: Instantly change the button state before server replies
      setAllocations((prev: any) => prev.map((a: any) => 
          a._id === roomId ? { ...a, isLocked: newStatus } : a
      ));

      try {
          await axios.post(`${API_URL}/api/admin/allocations/toggle-lock`, {
              roomId: roomId,
              isLocked: newStatus
          });
          // No need to fetchAllocations() again since we already updated the state!
      } catch (err) {
          // Rollback the UI if the server actually fails
          setAllocations((prev: any) => prev.map((a: any) => 
              a._id === roomId ? { ...a, isLocked: currentLockStatus } : a
          ));
          alert('Failed to update lock status in the database.');
      }
  }

  const handleSwap = async (e: any) => {
      e.preventDefault();
      try {
          await axios.post(`${API_URL}/api/admin/allocations/manual-swap`, swapData);
          setSwapping(false);
          setSwapData({ roomAId: '', memberA: '', roomBId: '', memberB: '' });
          alert("Swap completed successfully!");
          fetchAllocations();
      } catch (err: any) {
          alert(err.response?.data?.error || "Failed to swap members. Double check member IDs.");
      }
  }

  const downloadCSV = async () => {
    try {
        const response = await axios({
            url: `${API_URL}/api/admin/allocations/report`,
            method: 'GET',
            responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'Preference_Fulfillment_Report.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (err) {
        alert("Failed to generate report from ML engine.");
    }
  }

  if (status === "loading") return null;

  return (
    <div className="min-h-screen bg-[#F7F4EE] font-['Outfit'] text-[#1A2820] flex justify-center px-6 md:px-[6vw] py-6 pb-20">

        <div className="w-full relative z-10 pt-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <Link href="/admin" className="flex items-center gap-2 text-[#7A9088] hover:text-[#1A3A2A] font-medium transition-colors text-sm">
                    <ArrowLeft size={16}/> Back to Dashboard
                </Link>
                <div className="flex gap-4">
                    <button onClick={() => setSwapping(!swapping)} className="bg-white border border-[#1A3A2A]/10 hover:border-[#1A3A2A]/20 text-[#1A3A2A] px-5 py-2.5 rounded-full text-[13px] font-medium flex items-center gap-2 transition-all shadow-sm">
                        <Shuffle size={16}/> Manual Swap
                    </button>
                    <button onClick={downloadCSV} className="bg-[#C4613A] hover:bg-[#D4784F] text-white px-5 py-2.5 rounded-full text-[13px] font-medium flex items-center gap-2 shadow-[0_4px_24px_rgba(196,97,58,0.3)] hover:-translate-y-[1px] hover:shadow-[0_12px_36px_rgba(196,97,58,0.4)] transition-all">
                        <Download size={16} strokeWidth={2.5}/> Download CSV Report
                    </button>
                </div>
            </div>

            <div className="mb-10">
                <h1 className="text-4xl md:text-[44px] font-['Cormorant_Garamond'] font-semibold text-[#1A3A2A] mb-3 leading-tight">Room Allocations</h1>
                <p className="text-[#3A4F44] max-w-2xl font-light leading-[1.7]">
                    View, lock, or modify assigned student rooms. Locked rooms will strictly NOT be modified by the AI during subsequent engine runs.
                </p>
            </div>

            {swapping && (
                <motion.form initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} onSubmit={handleSwap} className="bg-white p-8 rounded-[20px] border border-[#1A3A2A]/10 shadow-[0_8px_40px_rgba(26,56,42,0.07)] mb-10 grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
                    <div>
                        <label className="text-[12px] font-semibold text-[#7A9088] uppercase tracking-[0.5px] block mb-2">Room A ID (_id)</label>
                        <input className="w-full bg-[#fcfbfa] border border-[#1A3A2A]/10 rounded-xl p-3 text-[14px] outline-none focus:border-[#7BAE94] focus:ring-1 focus:ring-[#7BAE94] transition-all" required value={swapData.roomAId} onChange={e=>setSwapData({...swapData, roomAId: e.target.value})} placeholder="Room A ID" />
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-[#7A9088] uppercase tracking-[0.5px] block mb-2">Member A Email</label>
                        <input className="w-full bg-[#fcfbfa] border border-[#1A3A2A]/10 rounded-xl p-3 text-[14px] outline-none focus:border-[#7BAE94] focus:ring-1 focus:ring-[#7BAE94] transition-all" required value={swapData.memberA} onChange={e=>setSwapData({...swapData, memberA: e.target.value})} placeholder="Email to move"/>
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-[#7A9088] uppercase tracking-[0.5px] block mb-2">Room B ID (_id)</label>
                        <input className="w-full bg-[#fcfbfa] border border-[#1A3A2A]/10 rounded-xl p-3 text-[14px] outline-none focus:border-[#7BAE94] focus:ring-1 focus:ring-[#7BAE94] transition-all" required value={swapData.roomBId} onChange={e=>setSwapData({...swapData, roomBId: e.target.value})} placeholder="Room B ID"/>
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-[#7A9088] uppercase tracking-[0.5px] block mb-2">Member B Email</label>
                        <input className="w-full bg-[#fcfbfa] border border-[#1A3A2A]/10 rounded-xl p-3 text-[14px] outline-none focus:border-[#7BAE94] focus:ring-1 focus:ring-[#7BAE94] transition-all" required value={swapData.memberB} onChange={e=>setSwapData({...swapData, memberB: e.target.value})} placeholder="Email to replace"/>
                    </div>
                    <button type="submit" className="w-full bg-[#1A3A2A] hover:bg-[#234D38] text-white rounded-xl p-3.5 font-medium transition-colors text-[14px]">Execute Swap</button>
                </motion.form>
            )}

            <div className="bg-white border border-[#1A3A2A]/10 rounded-[20px] overflow-hidden shadow-[0_8px_40px_rgba(26,56,42,0.07)]">
                <div className="p-8 border-b border-[#1A3A2A]/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#F7F4EE]/50">
                    <div>
                    <h3 className="font-semibold text-[18px] text-[#1A3A2A]">Generated Allotments</h3>
                    <p className="text-[#3A4F44] text-[13px] font-light mt-0.5">Overview of the verified student housing placements.</p>
                    </div>
                    <div className="bg-[#EBF4EF] px-4 py-2 rounded-full text-[12px] font-semibold text-[#2E6347] flex items-center gap-2 border border-[#7BAE94]/20">
                    <Database className="w-3.5 h-3.5" /> {allocations.length} Active Rooms
                    </div>
                </div>
                
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#1A3A2A]/10">
                    <table className="w-full text-left text-[14px] whitespace-nowrap relative">
                    <thead className="bg-[#F7F4EE] text-[#7A9088] border-b border-[#1A3A2A]/10 sticky top-0 z-20">
                        <tr>
                        <th className="px-8 py-5 font-semibold tracking-[1px] uppercase text-[11px]">Room details</th>
                        <th className="px-8 py-5 font-semibold tracking-[1px] uppercase text-[11px]">Classification</th>
                        <th className="px-8 py-5 font-semibold tracking-[1px] uppercase text-[11px]">Assigned Students</th>
                        <th className="px-8 py-5 font-semibold tracking-[1px] uppercase text-[11px] text-right">Lock Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A3A2A]/5 text-[#3A4F44]">
                        {[...allocations].sort((a: any, b: any) => (a.room_number || "").localeCompare(b.room_number || "")).map((a: any) => (
                        <tr key={a._id || a.room_number} className="hover:bg-[#F7F4EE]/50 transition-colors group">
                            <td className="px-8 py-5">
                                <div className="font-['Cormorant_Garamond'] font-bold text-[#1A3A2A] text-[24px] leading-tight">{a.room_number}</div>
                                <div className="text-[13px] text-[#7A9088] font-light mt-0.5">Block {a.block}, Floor {a.floor}</div>
                                <div className="text-[10px] text-[#1A3A2A]/40 mt-1 select-all hover:text-[#1A3A2A]/80 font-mono tracking-tight">{a._id}</div>
                            </td>
                            <td className="px-8 py-5">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-[0.5px] uppercase ${a.gender_group && a.gender_group.includes('FLEX') ? 'bg-[#FAF0EB] text-[#C4613A]' : 'bg-[#EDE9E0] text-[#1A3A2A]'}`}>
                                {a.gender_group}
                            </span>
                            </td>
                            <td className="px-8 py-5">
                            <div className="flex flex-col gap-1.5">
                                {(a.memberDetails || a.members).map((member: string, idx: number) => (
                                <span key={idx} className="bg-white px-3.5 py-2 rounded-xl text-[13px] border border-[#1A3A2A]/10 text-[#3A4F44] truncate max-w-[280px] font-medium shadow-sm">
                                    {member}
                                </span>
                                ))}
                            </div>
                            </td>
                            <td className="px-8 py-5 text-right">
                                <button onClick={() => toggleLock(a._id, a.isLocked)} className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-colors border ${a.isLocked ? 'bg-[#FAF0EB] text-[#C4613A] border-[#C4613A]/20 hover:bg-[#FBE8E0]' : 'bg-white text-[#7A9088] border-[#1A3A2A]/10 hover:bg-[#F7F4EE]'}`}>
                                    {a.isLocked ? <Lock size={14}/> : <Unlock size={14}/>}
                                    {a.isLocked ? 'Locked' : 'Unlocked'}
                                </button>
                            </td>
                        </tr>
                        ))}
                        {loading && (
                        <tr>
                            <td colSpan={4} className="px-8 py-24 text-center text-[#7A9088] font-light">
                                <div className="flex items-center justify-center gap-3">
                                    <svg className="animate-spin h-5 w-5 text-[#C4613A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Loading room data...
                                </div>
                            </td>
                        </tr>
                        )}
                        {!loading && allocations.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-8 py-24 text-center text-[#7A9088] font-light">
                            No allotments generated yet.
                            </td>
                        </tr>
                        )}
                    </tbody>
                    </table>
                </div>
            </div>

            {unassigned.length > 0 && (
                <div className="bg-white border border-[#C4613A]/20 rounded-[20px] overflow-hidden mt-10 shadow-sm">
                    <div className="p-8 border-b border-[#C4613A]/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#FAF0EB]/50">
                        <div>
                            <h3 className="font-semibold text-xl text-[#1A3A2A]">Unassigned Students</h3>
                            <p className="text-[#C4613A]/80 text-[13px] font-light mt-1">Students who could not be accommodated due to capacity constraints.</p>
                        </div>
                        <div className="bg-[#white] border border-[#C4613A]/20 px-4 py-2 rounded-full text-[12px] font-semibold text-[#C4613A]">
                            {unassigned.length} Pending
                        </div>
                    </div>
                    <div className="p-8">
                        <div className="flex flex-wrap gap-3">
                            {unassigned.map((student: string, idx: number) => (
                                <span key={idx} className="bg-[#F7F4EE] px-4 py-2 rounded-xl text-[14px] border border-[#1A3A2A]/10 text-[#3A4F44] font-medium">
                                    {student}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
}
