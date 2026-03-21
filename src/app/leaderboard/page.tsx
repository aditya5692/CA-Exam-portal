import { getGlobalLeaderboard, getUserRank } from "@/actions/leaderboard-actions";
import { getCurrentUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { ChartLineUp, Medal, Trophy, UserCircle, ArrowRight, Sparkle, Star, Crown, ShareNetwork, Lightbulb, Target, TrendUp, CheckCircle, Users, Presentation, Calendar } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Navbar } from "@/components/common/navbar";
import { Footer } from "@/components/common/footer";

type LeaderboardStudent = {
    rank: number;
    studentId: string;
    fullName: string;
    totalXP: number;
    level: number;
};

export const metadata = {
    title: "Global Leaderboard | CA Exam Portal",
    description: "Global student rankings based on learning XP.",
};

export const revalidate = 3600;

export default async function LeaderboardPage() {
    const user = await getCurrentUser();
    const isTeacherOrAdmin = user?.role === "TEACHER" || user?.role === "ADMIN";
    
    const res = await getGlobalLeaderboard(100);
    const topStudents = res.success && res.data ? res.data : [];

    let myRankData = null;
    if (user && !isTeacherOrAdmin) {
        const rankRes = await getUserRank(user.id);
        if (rankRes.success) {
            myRankData = rankRes.data;
        }
    }

    const isUserInTop100 = topStudents.some(s => s.studentId === user?.id);

    const top1 = topStudents[0];
    const top2 = topStudents[1];
    const top3 = topStudents[2];
    const rest = topStudents.slice(3);

    return (
        <div className="min-h-screen bg-[#FDFDFF] font-outfit text-slate-900 flex flex-col">
            <Navbar user={user} />

            <main className="flex-grow pt-28 pb-16 px-6 sm:px-12 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-1000">
                
                {/* Two-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
                    
                    {/* Left Column: Rankings & Champions */}
                    <div className="space-y-12">
                        
                        {/* Compact Achievement Header */}
                        <div className="space-y-2 border-b border-slate-100 pb-8">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                                <Star size={12} weight="fill" className="animate-pulse" />
                                Elite Leaderboard
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 leading-none text-left">
                                Global <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Rankings</span>
                            </h1>
                            <p className="text-slate-500 font-medium text-lg max-w-xl text-left">
                                Celebrating the top scholars in their journey to professional excellence.
                            </p>
                        </div>

                        {topStudents.length > 0 ? (
                            <div className="space-y-12">
                                {/* The Championship Podium Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                                    {top2 && <ChampionCard student={top2} rank={2} variant="silver" />}
                                    {top1 && <ChampionCard student={top1} rank={1} variant="gold" featured={true} />}
                                    {top3 && <ChampionCard student={top3} rank={3} variant="bronze" />}
                                </div>

                                {/* Ranking Table */}
                                {rest.length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 pl-4 text-left">All Rankings (4-100)</h3>
                                        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-2xl shadow-slate-200/20 overflow-hidden">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left">
                                                    <thead>
                                                        <tr className="bg-slate-50/50 border-b border-slate-100">
                                                            <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 w-24">Rank</th>
                                                            <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Student Name</th>
                                                            <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">XP Points</th>
                                                            <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center w-28">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50">
                                                        {rest.map((student) => {
                                                            const isMe = student.studentId === user?.id;
                                                            return (
                                                                <tr key={student.studentId} className={cn(
                                                                    "transition-all duration-300 group hover:bg-blue-50/20",
                                                                    isMe && "bg-blue-50/40 relative shadow-inner"
                                                                )}>
                                                                    <td className="py-4 px-6">
                                                                        <div className={cn(
                                                                            "w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs",
                                                                            isMe ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-slate-100 text-slate-500"
                                                                        )}>
                                                                            {student.rank}
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-4 px-6 font-bold text-slate-800 flex items-center gap-3">
                                                                        <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                                                            <UserCircle size={20} weight="fill" />
                                                                        </div>
                                                                        <span className="truncate max-w-[150px] sm:max-w-none">{student.fullName}</span>
                                                                        {isMe && <span className="h-5 px-2 bg-blue-100 text-blue-600 rounded flex items-center text-[9px] font-black uppercase tracking-widest ml-1 animate-pulse uppercase">YOU</span>}
                                                                    </td>
                                                                    <td className="py-4 px-6 text-right">
                                                                        <span className="font-black font-mono text-slate-900">{student.totalXP.toLocaleString()}</span>
                                                                    </td>
                                                                    <td className="py-4 px-6 text-center text-left">
                                                                        <span className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-100 shadow-sm text-[10px] font-black tracking-tight text-slate-500 uppercase">
                                                                            Lvl {student.level}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-300">
                                <Trophy size={48} weight="duotone" className="text-slate-300 mx-auto mb-4" />
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">Leaderboard Opening Soon</h2>
                                <p className="text-slate-500 mt-2 text-sm font-medium">Rankings refresh every hour. Start practicing to claim your spot!</p>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Sidebar (Analysis & Suggestions) */}
                    <div className="space-y-6 pt-1">
                        
                        {/* Student Personal Analysis Box */}
                        {user && myRankData && !isTeacherOrAdmin && (
                            <div className="p-6 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden group border border-slate-800">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[80px] -mr-16 -mt-16 opacity-40 group-hover:opacity-60 transition-opacity" />
                                
                                <div className="relative z-10 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-blue-400">Personal Analysis</h3>
                                        <TrendUp size={20} weight="bold" className="text-blue-400" />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Global Standing</div>
                                                <div className="text-4xl font-black tracking-tighter">#{myRankData.rank}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Percentile</div>
                                                <div className="text-xl font-black text-blue-400">Top {100 - myRankData.percentile}%</div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                                            <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400 font-mono">
                                                <span>Level Milestone</span>
                                                <span>Lvl {myRankData.level} → {myRankData.level + 1}</span>
                                            </div>
                                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" 
                                                    style={{ width: '65%' }} 
                                                />
                                            </div>
                                            <p className="text-[9px] font-medium text-slate-400 italic">
                                                ~{Math.round((myRankData.level + 1) * 250 - myRankData.totalXP % 500)} XP to next milestone.
                                            </p>
                                        </div>
                                    </div>

                                    <button className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                                        <ShareNetwork size={18} weight="bold" />
                                        Share My Rank
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Teacher/Admin "Class Analysis" Placeholder Box */}
                        {isTeacherOrAdmin && (
                            <div className="p-6 rounded-[2.5rem] bg-indigo-900 text-white shadow-2xl relative overflow-hidden group border border-indigo-800">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400 rounded-full blur-[80px] -mr-16 -mt-16 opacity-40 group-hover:opacity-60 transition-opacity" />
                                
                                <div className="relative z-10 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-300">Teacher Insights</h3>
                                        <Presentation size={20} weight="bold" className="text-indigo-300" />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <div className="text-[10px] font-bold text-indigo-200 uppercase mb-1">Top Batch Avg</div>
                                                <div className="text-3xl font-black tracking-tighter">1,240 XP</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-bold text-indigo-200 uppercase mb-1">Growth</div>
                                                <div className="text-xl font-black text-green-400">+12%</div>
                                            </div>
                                        </div>

                                        <p className="text-[11px] font-medium text-indigo-100 bg-white/5 p-4 rounded-xl border border-white/10">
                                            Your students are most active on Mock Exams during weekend evenings (6PM - 9PM).
                                        </p>
                                    </div>

                                    <Link href="/teacher/dashboard" className="w-full h-12 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                                        View All Batches
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Integrated "Pro Suggestions" Box */}
                        <div className="p-6 rounded-[2.5rem] bg-white border border-slate-200 shadow-sm space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                                    <Lightbulb size={24} weight="fill" />
                                </div>
                                <h3 className="font-black text-slate-900 tracking-tight text-left">Success Tips</h3>
                            </div>

                            <div className="space-y-4">
                                <SuggestionItem 
                                    icon={<Target size={14} weight="bold" />}
                                    title={isTeacherOrAdmin ? "Encourage Retrieval" : "Accuracy First"}
                                    desc={isTeacherOrAdmin ? "Remind students that practicing Mock Exams boosts their global rank significantly." : "Correct answers in Mock Exams provide 2x XP multipliers."}
                                />
                                <SuggestionItem 
                                    icon={<Calendar size={14} weight="bold" />}
                                    title="Consistency Wins"
                                    desc="A 5-day study streak unlocks the Elite Multiplier rewards for all students."
                                />
                                <SuggestionItem 
                                    icon={<Presentation size={14} weight="bold" />}
                                    title="Peer Learning"
                                    desc="Comparing standing with peers in the Top 100 boosts overall batch motivation."
                                />
                            </div>

                            <Link href={isTeacherOrAdmin ? "/teacher/dashboard" : "/student/dashboard"} className="w-full h-11 rounded-xl border border-blue-100 bg-blue-50/50 text-blue-600 hover:bg-blue-600 hover:text-white font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center transition-all bg-white text-left">
                                Go to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponents (Leaderboard 3.0)
// ─────────────────────────────────────────────────────────────────────────────

function ChampionCard({ 
    student, 
    rank, 
    variant,
    featured = false
}: { 
    student: LeaderboardStudent, 
    rank: number, 
    variant: "gold" | "silver" | "bronze",
    featured?: boolean
}) {
    const config = {
        gold: {
            bg: "bg-white",
            border: "border-amber-400 shadow-[0_0_40px_-15px_rgba(245,158,11,0.3)]",
            icon: Trophy,
            iconColor: "text-amber-500",
            badgeBg: "bg-amber-500",
            title: "Scholar Gold"
        },
        silver: {
            bg: "bg-white",
            border: "border-slate-300 shadow-[0_0_40px_-15px_rgba(148,163,184,0.3)]",
            icon: Medal,
            iconColor: "text-slate-400",
            badgeBg: "bg-slate-400",
            title: "Scholar Silver"
        },
        bronze: {
            bg: "bg-white",
            border: "border-orange-400 shadow-[0_0_40px_-15px_rgba(251,146,60,0.3)]",
            icon: Medal,
            iconColor: "text-orange-500",
            badgeBg: "bg-orange-500",
            title: "Scholar Bronze"
        }
    };

    const style = config[variant];
    const Icon = style.icon;

    return (
        <div className={cn(
            "relative p-6 rounded-[2.5rem] border transition-all duration-700 group",
            style.bg, style.border, featured && "md:scale-105 md:-mt-2 ring-4 ring-amber-50 shadow-2xl"
        )}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className={cn(
                        "px-3 py-1 rounded-full text-white font-black text-[10px] uppercase tracking-widest text-left",
                        style.badgeBg
                    )}>
                       Rank #{rank}
                    </div>
                    {featured && <Crown size={22} weight="fill" className="text-amber-500 animate-bounce" />}
                </div>

                <div className="flex flex-col items-center text-center space-y-3">
                    <div className={cn(
                        "w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all duration-500 shadow-inner group-hover:rotate-6",
                        featured ? "bg-amber-50" : "bg-slate-50"
                    )}>
                        <Icon size={48} weight="duotone" className={style.iconColor} />
                    </div>
                    <div>
                        <h4 className="text-xl font-black tracking-tight text-slate-900 truncate max-w-[150px]">{student.fullName}</h4>
                        <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest uppercase">{style.title}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 text-center">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Total XP</div>
                        <div className="text-base font-black font-mono tracking-tighter text-slate-900 group-hover:text-blue-600 transition-colors">
                            {student.totalXP.toLocaleString()}
                        </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Level</div>
                        <div className="text-base font-black text-slate-900">Lvl {student.level}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SuggestionItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="flex gap-4 group p-3 rounded-2xl hover:bg-slate-50 transition-colors text-left">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                {icon}
            </div>
            <div className="space-y-0.5">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide group-hover:text-blue-700 transition-colors">{title}</h4>
                <p className="text-[11px] font-medium text-slate-500 leading-normal">{desc}</p>
            </div>
        </div>
    );
}
