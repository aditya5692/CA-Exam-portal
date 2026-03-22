import { getStudentHistory } from "@/actions/student-actions";
import { StudentAttemptHistory } from "@/components/student/analytics/attempt-history";
import { StudentAnalyticsOverview } from "@/components/student/analytics/performance-overview";
import { StudentPageHeader } from "@/components/student/shared/page-header";
import { getCurrentUser } from "@/lib/auth/session";
import { getStudentStudyRecommendations } from "@/lib/server/study-intelligence";
import { Info } from "@phosphor-icons/react/dist/ssr";
import { redirect } from "next/navigation";

export default async function StudentAnalyticsPage() {
    const user = await getCurrentUser(["STUDENT", "ADMIN"]);
    const result = await getStudentHistory();
    
    if (!result.success || !result.data) {
        redirect("/auth/login");
    }

    const recommendations = user
        ? await getStudentStudyRecommendations(user.id, 5)
        : null;

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
            <StudentPageHeader
                eyebrow="Performance metrics"
                title="Performance"
                accent="Insights"
                description="Track your progress, analyze your performance across subjects, and identify areas for improvement."
                daysToExam={daysToExam}
            />

            <StudentAnalyticsOverview data={result.data} />

            {recommendations && (
                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="student-surface rounded-3xl p-8">
                        <div className="mb-6 flex items-center justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--student-muted)]">Study intelligence</p>
                                <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--student-text)]">Next Best Actions</h2>
                            </div>
                            <div className="student-chip-accent rounded-2xl px-4 py-3 text-right">
                                <div className="text-[10px] font-bold uppercase tracking-widest">Due For Review</div>
                                <div className="text-2xl font-black">{recommendations.summary.dueForReviewCount}</div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {recommendations.priorityTopics.map((topic) => (
                                <div key={`${topic.subject}-${topic.topic}`} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{topic.subject}</div>
                                            <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-900">{topic.topic}</h3>
                                        </div>
                                        <div className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${topic.priorityBand === "HIGH" ? "bg-rose-100 text-rose-700" : topic.priorityBand === "MEDIUM" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                                            {topic.priorityBand}
                                        </div>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                        <span className="rounded-full bg-white px-3 py-1 border border-slate-100">Accuracy {topic.accuracy}%</span>
                                        <span className="rounded-full bg-white px-3 py-1 border border-slate-100">Attempts {topic.attempts}</span>
                                        <span className="rounded-full bg-white px-3 py-1 border border-slate-100">{topic.dueForReview ? "Review Due" : "Scheduled"}</span>
                                    </div>
                                    <p className="mt-4 text-sm font-medium leading-relaxed text-slate-600">{topic.suggestedAction}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="student-surface rounded-3xl p-8">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--student-muted)]">Subject focus</p>
                            <div className="mt-5 space-y-4">
                                {recommendations.subjectFocus.slice(0, 4).map((subject) => (
                                    <div key={subject.subject} className="rounded-2xl border border-slate-100 p-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">{subject.subject}</h3>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${subject.trend === "IMPROVING" ? "text-emerald-600" : subject.trend === "NEEDS_ATTENTION" ? "text-rose-600" : "text-slate-500"}`}>
                                                {subject.trend.replace("_", " ")}
                                            </span>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between text-sm font-semibold text-slate-600">
                                            <span>Accuracy {subject.averageAccuracy}%</span>
                                            <span>{subject.recommendedMinutes} min focus</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="student-surface-dark rounded-3xl p-8 text-white">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">Weekly direction</p>
                            <div className="mt-5 space-y-3">
                                {recommendations.nextActions.map((action) => (
                                    <div key={action} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-medium leading-relaxed text-slate-200">
                                        {action}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <StudentAttemptHistory attempts={result.data.attempts} />

            {/* Additional Guidance Section */}
            <div className="student-surface-dark relative flex flex-col items-center gap-10 overflow-hidden rounded-2xl p-10 text-white lg:flex-row">
                <div className="student-icon-tile-warm flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                        <Info size={28} weight="bold" />
                    </div>
                </div>
                <div className="flex-1 space-y-3 text-center lg:text-left relative z-10">
                    <h3 className="text-2xl font-bold text-white font-outfit tracking-tight">How is my ranking calculated?</h3>
                    <p className="max-w-4xl font-sans text-base font-medium leading-relaxed text-white/70">
                        Your global ranking is based on your total XP earned across all practice sessions. We compare your performance with other students to provide a clear understanding of your competitive standing and overall progress.
                    </p>
                </div>
                <button className="student-button-secondary relative z-10 shrink-0 rounded-xl px-8 py-4 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95">
                    Learn More
                </button>
            </div>
        </div>
    );
}
