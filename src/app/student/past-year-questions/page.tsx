import { PastYearQuestionsDashboard } from "@/components/home/PastYearQuestionsDashboard";
import { getCurrentUser } from "@/lib/auth/session";
import { Calendar } from "@phosphor-icons/react/dist/ssr";

export default async function StudentPastYearQuestionsPage() {
    const user = await getCurrentUser(["STUDENT", "ADMIN"]);
    
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
        <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500 font-outfit">
            {/* Standardized Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.2)]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Historical Records</span>
                    </div>
                    <h1 className="font-outfit tracking-tighter leading-tight text-3xl md:text-4xl font-black text-slate-900">
                        Past Year <span className="text-indigo-600">Questions</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-base font-sans max-w-2xl leading-relaxed">
                        Access official ICAI past year papers and practice questions for better preparation.
                    </p>
                </div>
                {daysToExam > 0 && (
                    <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-900/5 hover:bg-slate-800 transition-all active:scale-95 shrink-0 mb-1 pointer-events-none">
                        <Calendar size={18} weight="bold" className="text-indigo-400" />
                        Next Milestone: {daysToExam} Days
                    </div>
                )}
            </div>

            <PastYearQuestionsDashboard />
        </div>
    );
}
