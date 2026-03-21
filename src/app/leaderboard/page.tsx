import { getGlobalLeaderboard } from "@/actions/leaderboard-actions";
import { cn } from "@/lib/utils";
import { ChartLineUp,Info,Medal,Trophy,UserCircle } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

type LeaderboardStudent = {
    rank: number;
    studentId: string;
    fullName: string;
    totalXP: number;
    level: number;
};

export const metadata = {
    title: "Global Leaderboard | CA Exam Portal",
    description: "Public ranking of top CA aspirants based on learning XP.",
};

// Next.js config for 1-hour caching of this route natively at the page level if needed
export const revalidate = 3600;

export default async function LeaderboardPage() {
    const res = await getGlobalLeaderboard(100);
    const topStudents = res.success && res.data ? res.data : [];

    const top1 = topStudents[0];
    const top2 = topStudents[1];
    const top3 = topStudents[2];
    const rest = topStudents.slice(3);

    return (
        <div className="min-h-screen bg-slate-50 font-outfit">
            {/* Minimal Navbar for Public Page */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 h-16 flex items-center px-6 md:px-12 justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                        <ChartLineUp size={18} weight="bold" className="text-white" />
                    </div>
                    <span className="font-bold text-lg text-slate-900 tracking-tight">Financly</span>
                </Link>
                <div className="flex gap-4">
                    <Link href="/login" className="px-5 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
                        Sign In
                    </Link>
                    <Link href="/login" className="px-5 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-blue-600 transition-all shadow-md active:scale-95 hidden sm:block">
                        Get Started
                    </Link>
                </div>
            </nav>

            <main className="pt-32 pb-24 px-4 max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
                {/* Header */}
                <div className="text-center space-y-6 max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 shadow-sm mx-auto">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Global Rankings</span>
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-tight tracking-tight">
                        The CA Excellence <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Leaderboard.</span>
                    </h1>
                    
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm inline-block text-left relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-100 transition-colors duration-500" />
                        <div className="relative z-10 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 text-slate-400 mt-0.5">
                                <Info size={20} weight="duotone" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Transparent Ranking Formula</h3>
                                <p className="text-sm font-medium text-slate-500/90 leading-relaxed max-w-md">
                                    Positions are determined strictly by <strong className="text-blue-600 font-bold">Total Learning XP</strong>. 
                                    Earn XP through mock exams, consistent study streaks, and resource utilization.
                                </p>
                                <div className="mt-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                                    <Clock /> Updates Every Hour
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {topStudents.length > 0 ? (
                    <div className="space-y-12">
                        {/* The Podium */}
                        <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-6 mt-16 px-4">
                            {/* Rank 2 - Silver */}
                            {top2 && <PodiumCard student={top2} rank={2} color="slate" height="md:h-64" />}

                            {/* Rank 1 - Gold */}
                            {top1 && <PodiumCard student={top1} rank={1} color="amber" height="md:h-72" scale="md:scale-105" zIndex="z-10 shadow-2xl" />}

                            {/* Rank 3 - Bronze */}
                            {top3 && <PodiumCard student={top3} rank={3} color="orange" height="md:h-56" />}
                        </div>

                        {/* Ranks 4-100 Table */}
                        {rest.length > 0 && (
                            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden mt-8">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                                <th className="py-5 px-6 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Rank</th>
                                                <th className="py-5 px-6 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Aspiring Professional</th>
                                                <th className="py-5 px-6 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Total XP</th>
                                                <th className="py-5 px-6 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Level</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100/80">
                                            {rest.map((student) => (
                                                <tr key={student.studentId} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="py-4 px-6 whitespace-nowrap">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-sm flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                            #{student.rank}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 shadow-inner">
                                                                <UserCircle size={20} weight="fill" />
                                                            </div>
                                                            <span className="font-bold text-slate-800 text-[15px]">{student.fullName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 whitespace-nowrap text-right">
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-700 rounded-lg border border-slate-100 font-mono font-bold">
                                                            {student.totalXP.toLocaleString()} <span className="text-[10px] text-slate-400">XP</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 whitespace-nowrap text-center">
                                                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-black text-xs mx-auto border border-indigo-100/50 hover:bg-indigo-600 hover:text-white transition-colors cursor-default">
                                                            {student.level}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-32 bg-white rounded-[40px] border border-slate-200 shadow-sm mt-12">
                        <Trophy size={64} weight="duotone" className="text-slate-200 mx-auto mb-6" />
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Leaderboard is warming up</h2>
                        <p className="text-slate-500 mt-2 font-medium">It looks like the competition is just getting started. Check back soon!</p>
                    </div>
                )}
            </main>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────────────────

function Clock() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
            <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z"></path>
        </svg>
    );
}

function PodiumCard({ 
    student, 
    rank, 
    color, 
    height, 
    scale = "", 
    zIndex = "z-0" 
}: { 
    student: LeaderboardStudent, 
    rank: number, 
    color: "amber" | "slate" | "orange", 
    height: string, 
    scale?: string,
    zIndex?: string
}) {
    const colorStyles = {
        amber: {
            bg: "bg-amber-50",
            border: "border-amber-200",
            text: "text-amber-600",
            gradient: "from-amber-400 to-amber-600",
            badge: "bg-amber-100 text-amber-700",
            shadow: "shadow-amber-500/10",
            icon: Trophy
        },
        slate: {
            bg: "bg-slate-50",
            border: "border-slate-200",
            text: "text-slate-600",
            gradient: "from-slate-400 to-slate-600",
            badge: "bg-slate-200 text-slate-700",
            shadow: "shadow-slate-500/10",
            icon: Medal
        },
        orange: {
            bg: "bg-orange-50",
            border: "border-orange-200",
            text: "text-orange-600",
            gradient: "from-orange-400 to-orange-600",
            badge: "bg-orange-100 text-orange-700",
            shadow: "shadow-orange-500/10",
            icon: Medal
        }
    };

    const style = colorStyles[color];
    const Icon = style.icon;

    return (
        <div className={cn(
            "relative w-full md:w-64 flex flex-col items-center p-6 rounded-[32px] border transition-all duration-500",
            style.bg, style.border, style.shadow, height, scale, zIndex
        )}>
            {/* Rank Badge */}
            <div className={cn("absolute -top-5 flex items-center justify-center w-12 h-12 rounded-full border-4 border-white shadow-xl z-20 bg-gradient-to-br", style.gradient)}>
                <span className="text-white font-black text-lg">#{rank}</span>
            </div>

            <div className="mt-8 flex flex-col items-center text-center w-full h-full justify-between">
                <div className="space-y-3 flex flex-col items-center">
                    <div className={cn("w-14 h-14 rounded-full flex items-center justify-center mb-1", style.badge)}>
                        <Icon size={28} weight="duotone" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-[17px] font-black text-slate-900 leading-tight line-clamp-1 break-all">{student.fullName}</h4>
                        <div className="inline-flex items-center justify-center rounded-full bg-white px-3 py-1 border border-slate-100 font-mono text-[10px] uppercase font-bold tracking-widest text-indigo-600">
                            Lvl {student.level}
                        </div>
                    </div>
                </div>

                <div className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mt-4 md:mt-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Total XP</p>
                    <p className={cn("text-xl md:text-2xl font-black font-mono tracking-tight", style.text)}>
                        {student.totalXP.toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
    );
}
