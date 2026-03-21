import { StudentAnalyticsOverview } from "@/components/student/analytics/performance-overview";
import { StudentAttemptHistory } from "@/components/student/analytics/attempt-history";
import { Info, Calendar } from "@phosphor-icons/react/dist/ssr";
import { getStudentHistory } from "@/actions/student-actions";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function StudentAnalyticsPage() {
    const user = await getCurrentUser(["STUDENT", "ADMIN"]);
    const result = await getStudentHistory();
    
    if (!result.success || !result.data) {
        redirect("/auth/login");
    }

    let daysToExam = 0;
    const userTarget = user?.examTarget || "";
    if (userTarget) {
        const months = { "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5, "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11 };
        const parts = userTarget.split(" ");
        if (parts.length >= 2) {
            const moPartRaw = parts[parts.length - 2].substring(0, 3).toLowerCase();
            const moKey = Object.keys(months).find(k => k.toLowerCase() === moPartRaw);
            const yrPart = parseInt(parts[parts.length - 1]);
            if (moKey && !isNaN(yrPart)) {
                const targetDate = new Date(yrPart, months[moKey as keyof typeof months], 1);
                const now = new Date();
                const diffTime = targetDate.getTime() - now.getTime();
                daysToExam = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            }
        }
    }

    return (
        <div className="space-y-12 pb-20 font-outfit">
            {/* Standardized Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.2)]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Performance Metrics</span>
                    </div>
                    <h1 className="font-outfit tracking-tighter leading-tight text-3xl md:text-4xl font-black text-slate-900">
                        Performance <span className="text-indigo-600">Insights</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-base font-sans max-w-2xl leading-relaxed">
                        Track your progress, analyze your performance across subjects, and identify areas for improvement.
                    </p>
                </div>
                {daysToExam > 0 && (
                    <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-900/5 hover:bg-slate-800 transition-all active:scale-95 shrink-0 mb-1 pointer-events-none">
                        <Calendar size={18} weight="bold" className="text-indigo-400" />
                        Next Milestone: {daysToExam} Days
                    </div>
                )}
            </div>

            <StudentAnalyticsOverview data={result.data} />

            <StudentAttemptHistory attempts={result.data.attempts} />

            {/* Additional Guidance Section */}
            <div className="p-10 rounded-2xl bg-slate-900 text-white border border-white/5 shadow-xl flex flex-col lg:flex-row items-center gap-10 relative overflow-hidden group">
                <div className="w-16 h-16 rounded-2xl bg-white/5 text-indigo-400 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                    <div className="p-2.5 rounded-xl bg-slate-800/50 border border-white/5">
                        <Info size={28} weight="bold" />
                    </div>
                </div>
                <div className="flex-1 space-y-3 text-center lg:text-left relative z-10">
                    <h3 className="text-2xl font-bold text-white font-outfit tracking-tight">How is my ranking calculated?</h3>
                    <p className="text-slate-400 text-base font-medium leading-relaxed font-sans max-w-4xl opacity-90">
                        Your global ranking is based on your total XP earned across all practice sessions. We compare your performance with other students to provide a clear understanding of your competitive standing and overall progress.
                    </p>
                </div>
                <button className="px-8 py-4 rounded-xl bg-white text-slate-950 font-bold text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-50 transition-all active:scale-95 shrink-0 relative z-10">
                    Learn More
                </button>
            </div>
        </div>
    );
}
