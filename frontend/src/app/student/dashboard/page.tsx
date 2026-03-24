"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function StudentDashboard() {
  const [allocation, setAllocation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Hardcoded for demo integration purposes to a user that exists in the CSV
  // The backend uses student_1@sitpune.edu.in up to student_105@sitpune.edu.in based on uploaded CSV rows
  const MOCK_USER_ID = "student_1@sitpune.edu.in";

  useEffect(() => {
    fetch(`/api/student/allocation/${MOCK_USER_ID}`)
      .then(r => {
          if (!r.ok) throw new Error("Pending Allocation");
          return r.json();
      })
      .then(data => setAllocation(data))
      .catch(e => setError(e.message));
  }, []);

  return (
    <div className="min-h-screen bg-white text-black p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-end mb-12 border-b-4 border-black pb-6">
          <h1 className="text-4xl font-extrabold uppercase tracking-tighter">Student Terminal</h1>
          <div className="text-right">
             <p className="font-bold">{MOCK_USER_ID}</p>
             <p className="text-sm uppercase text-gray-500 font-semibold tracking-wider">Authentication Verified</p>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
            <div className="border-4 border-black p-8 flex flex-col justify-between">
                <div>
                    <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Profile Survey Status</h2>
                    <p className="text-gray-600 mb-6 font-medium">Your preference survey has been securely processed and is actively included in the matching pool.</p>
                </div>
                <button disabled className="bg-gray-100 text-gray-400 px-4 py-3 border-2 border-gray-300 font-bold uppercase tracking-wider cursor-not-allowed w-full">
                    Submissions Locked
                </button>
            </div>

            <div className="border-4 border-black p-8 bg-black text-white flex flex-col justify-between">
                <div>
                    <h2 className="text-xl font-bold uppercase tracking-tight mb-6 text-gray-400">Final Room Assignment</h2>
                    
                    {allocation ? (
                        <div>
                            <p className="text-5xl font-black mb-6">{allocation.id}</p>
                            <div className="text-sm mb-6">
                                <p className="uppercase tracking-widest text-gray-500 font-bold mb-2 text-xs">Assigned Roommates</p>
                                <ul className="space-y-2">
                                    {allocation.members.map((m: string, i: number) => (
                                        <li key={i} className={`flex items-center gap-2 ${m === MOCK_USER_ID ? "font-bold text-white" : "text-gray-300"}`}>
                                            <span className="w-2 h-2 bg-white inline-block"></span>
                                            {m} {m === MOCK_USER_ID && <span className="text-xs bg-white text-black px-2 py-0.5 uppercase tracking-wider">You</span>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="pt-4 border-t border-gray-800">
                                <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-1">Compatibility Score</p>
                                <p className="text-3xl font-black">{allocation.compatibility_score}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 text-center text-gray-400 border-2 border-dashed border-gray-700">
                            <p className="font-bold text-xl uppercase tracking-widest mb-2">Awaiting Engine</p>
                            <p className="text-sm font-medium">Waiting for the administrator to trigger the matching algorithm.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
