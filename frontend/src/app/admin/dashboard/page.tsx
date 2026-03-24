"use client";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [allocations, setAllocations] = useState<any[]>([]);
    const [unassigned, setUnassigned] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [sheetUrl, setSheetUrl] = useState("");
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const resStats = await fetch("/api/system/status");
            setStats(await resStats.json());

            const resAlloc = await fetch("/api/admin/allocations");
            setAllocations(await resAlloc.json());

            const resUnassign = await fetch("/api/admin/unassigned");
            setUnassigned(await resUnassign.json());
        } catch (e) {
            console.error(e);
        }
    };

    const triggerAllocation = async () => {
        setLoading(true);
        try {
            await fetch("/api/admin/allocation/trigger", { method: "POST" });
            fetchData(); // Refresh data after trigger
        } catch (e) {
            console.error(e);
            alert("Failed to run allocation");
        } finally {
            setLoading(false);
        }
    };

    const syncGoogleSheet = async () => {
        if (!sheetUrl) {
            alert("Please enter a Google Sheet CSV URL");
            return;
        }
        setSyncing(true);
        try {
            const res = await fetch("/api/admin/sync-google-sheet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sheet_url: sheetUrl })
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || "Failed to sync");
            }
            const data = await res.json();
            alert(data.message + ` (${data.records_synced} records)`);
            fetchData();
        } catch (e: any) {
            console.error(e);
            alert(e.message || "Failed to sync Google Sheet");
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="min-h-screen bg-white text-black p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12 border-b-4 border-black pb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-extrabold uppercase tracking-tighter">Admin Core</h1>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-sm mt-1">Hostel Management</p>
                    </div>
                    <button 
                        disabled={loading}
                        onClick={triggerAllocation}
                        className="bg-black text-white px-8 py-4 font-bold uppercase tracking-wider text-sm hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-[4px_4px_0_0_rgba(0,0,0,0.2)]"
                    >
                        {loading ? "Engaging Math Model..." : "Trigger Triplet Matching"}
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    <div className="p-6 border-4 border-black">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">System Expected</h3>
                        <p className="text-5xl font-black">{stats?.expected || "0"}</p>
                    </div>
                    <div className="p-6 border-4 border-black bg-black text-white">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Profiles Processed</h3>
                        <p className="text-5xl font-black">{stats?.submitted || "0"}</p>
                    </div>
                    <div className="p-6 border-4 border-black">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Pending Fallback</h3>
                        <p className="text-5xl font-black">{stats?.remaining || "0"}</p>
                    </div>
                </div>

                {/* Google Form / Sheet Sync Section */}
                <div className="mb-16 border-4 border-black p-6 bg-gray-50">
                    <h2 className="text-2xl font-extrabold uppercase tracking-tighter mb-4">Sync Google Form Data</h2>
                    <p className="text-sm text-gray-600 mb-4 font-medium">Link your Google Form to a Google Sheet, select "File &gt; Share &gt; Publish to web" as CSV, and paste the link below.</p>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
                            className="flex-1 border-2 border-black p-3 font-mono text-sm shadow-[4px_4px_0_0_rgba(0,0,0,0.2)]"
                            value={sheetUrl}
                            onChange={(e) => setSheetUrl(e.target.value)}
                        />
                        <button
                            disabled={syncing}
                            onClick={syncGoogleSheet}
                            className="bg-black text-white px-8 py-3 font-bold uppercase tracking-wider text-sm hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-[4px_4px_0_0_rgba(0,0,0,0.2)] whitespace-nowrap"
                        >
                            {syncing ? "Syncing..." : "Sync Data"}
                        </button>
                    </div>
                </div>

                <div className="flex justify-between items-end mb-6">
                    <h2 className="text-2xl font-extrabold uppercase tracking-tighter">Model Allocations Matrix</h2>
                    <p className="font-mono text-sm font-bold bg-gray-100 px-3 py-1 border-2 border-black">Total Rooms: {allocations.length}</p>
                </div>
                
                {allocations.length > 0 ? (
                    <div className="overflow-auto max-h-[500px] border-4 border-black relative relative-z-0">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 shadow-lg z-10 outline outline-4 outline-black">
                                <tr className="bg-black text-white">
                                    <th className="p-4 font-bold uppercase tracking-wider text-xs border-r border-gray-700">Room ID</th>
                                    <th className="p-4 font-bold uppercase tracking-wider text-xs border-r border-gray-700">Gender</th>
                                    <th className="p-4 font-bold uppercase tracking-wider text-xs border-r border-gray-700">Similarity Metric</th>
                                    <th className="p-4 font-bold uppercase tracking-wider text-xs">Assigned Members</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allocations.map((a, i) => (
                                    <tr key={i} className="border-b-2 border-gray-200 hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-black text-lg border-r-2 border-gray-200">{a.id}</td>
                                        <td className="p-4 font-bold uppercase border-r-2 border-gray-200">{a.gender_group}</td>
                                        <td className="p-4 border-r-2 border-gray-200 font-mono font-bold text-lg">{a.compatibility_score}</td>
                                        <td className="p-4 text-sm font-medium flex gap-2 flex-wrap">
                                            {(typeof a.members === 'string' ? a.members.split(',') : a.members).map((mStr: string, idx: number) => {
                                                let name = "";
                                                let email = "";
                                                let branch = "";
                                                let year = "";
                                                
                                                if (mStr.includes('::')) {
                                                    [name, email, branch, year] = mStr.split('::');
                                                    if (name === "Unknown Name") name = email.split('@')[0];
                                                } else {
                                                    const match = mStr.match(/(.+?@.+?)\s*\((.+?)\s*(Y.+?)\)/);
                                                    if (match) {
                                                        email = match[1];
                                                        name = email.split('@')[0];
                                                        branch = match[2];
                                                        year = match[3].replace('Y', '');
                                                    } else {
                                                        email = mStr;
                                                        name = mStr.split('@')[0];
                                                    }
                                                }

                                                return (
                                                    <div key={idx} className="relative group inline-block">
                                                        <div className="bg-white border-2 border-black px-3 py-1 font-bold cursor-default hover:bg-gray-50 transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-xs uppercase tracking-wider">
                                                            {name}
                                                        </div>
                                                        
                                                        {/* Hover Tooltip Box */}
                                                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full pb-2 hidden group-hover:flex flex-col items-center z-50 w-max">
                                                            <div className="bg-black text-white p-2 rounded shadow-2xl border border-gray-700 relative">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex flex-col">
                                                                        <span className="font-mono text-sm lowercase">{email}</span>
                                                                        {branch && year && <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{branch} • YEAR {year}</span>}
                                                                    </div>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            navigator.clipboard.writeText(email);
                                                                        }}
                                                                        className="bg-white text-black p-1.5 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                                                                        title="Copy Email"
                                                                    >
                                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                                                    </button>
                                                                </div>
                                                                {/* Arrow pointer */}
                                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-16 border-4 border-dashed border-gray-300 text-center mb-16">
                        <p className="text-gray-400 font-bold uppercase tracking-widest">No allocations recorded in database.</p>
                        <p className="text-gray-400 text-sm mt-2">Trigger the matching engine to process the CSV queue.</p>
                    </div>
                )}

                {/* Unassigned Section */}
                <div className="flex justify-between items-end mb-6 mt-16">
                    <h2 className="text-2xl font-extrabold uppercase tracking-tighter text-red-600">Unassigned / Fallback Queue</h2>
                    <p className="font-mono text-sm font-bold bg-gray-100 px-3 py-1 border-2 border-black">Total Unassigned: {unassigned.length}</p>
                </div>

                {unassigned.length > 0 ? (
                    <div className="overflow-auto max-h-[400px] border-4 border-black relative relative-z-0">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 shadow-lg z-10 outline outline-4 outline-black">
                                <tr className="bg-red-600 text-white">
                                    <th className="p-4 font-bold uppercase tracking-wider text-xs border-r border-red-800">Student</th>
                                    <th className="p-4 font-bold uppercase tracking-wider text-xs border-r border-red-800">Gender</th>
                                    <th className="p-4 font-bold uppercase tracking-wider text-xs border-r border-red-800">Branch</th>
                                    <th className="p-4 font-bold uppercase tracking-wider text-xs">Year</th>
                                </tr>
                            </thead>
                            <tbody>
                                {unassigned.map((u, i) => (
                                    <tr key={i} className="border-b-2 border-gray-200 hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-black border-r-2 border-gray-200">
                                            <div className="relative group inline-block">
                                                <div className="cursor-default">
                                                    {u.name && u.name !== "Unknown Name" ? u.name : u.user_id.split('@')[0]}
                                                </div>
                                                <div className="absolute left-0 bottom-full pb-2 hidden group-hover:flex flex-col z-50 w-max">
                                                    <div className="bg-black text-white p-2 text-xs rounded shadow-xl border border-gray-700 relative flex items-center gap-2">
                                                        <span className="font-mono font-normal tracking-wide lowercase">{u.user_id}</span>
                                                        <button onClick={() => navigator.clipboard.writeText(u.user_id)} className="bg-white text-black p-1 rounded hover:bg-gray-200 cursor-pointer">
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                                        </button>
                                                        <div className="absolute top-full left-4 -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-bold uppercase border-r-2 border-gray-200">{u.gender}</td>
                                        <td className="p-4 border-r-2 border-gray-200 font-bold">{u.branch}</td>
                                        <td className="p-4 font-medium">{u.year}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-16 border-4 border-dashed border-gray-300 text-center">
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-green-600">Zero Pending Fallbacks!</p>
                        <p className="text-gray-400 text-sm mt-2">Every student was perfectly allocated within constraints.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
