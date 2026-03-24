import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-white text-black font-sans">
      <div className="z-10 max-w-5xl w-full items-center justify-between text-sm flex flex-col gap-6 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-black">
          SIT Pune Hostel Allocator
        </h1>
        
        <p className="text-lg text-gray-600 max-w-2xl mt-4">
          A minimalist platform for data-driven, algorithm-based student assignment.
        </p>

        <div className="mt-8 flex gap-4">
          <Link 
            href="/student/dashboard" 
            className="flex items-center justify-center min-w-[200px] bg-black text-white px-8 py-4 font-medium hover:bg-gray-800 transition-colors border-2 border-black uppercase tracking-wider text-sm"
          >
            Student Portal
          </Link>

          <Link 
            href="/admin/dashboard" 
            className="flex items-center justify-center min-w-[200px] bg-white text-black px-8 py-4 font-medium hover:bg-gray-100 transition-colors border-2 border-black uppercase tracking-wider text-sm"
          >
            Administration
          </Link>
        </div>
      </div>
    </main>
  );
}
