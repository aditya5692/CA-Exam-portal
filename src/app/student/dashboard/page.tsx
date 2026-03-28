import { getGlobalLeaderboard, getUserRank } from "@/actions/leaderboard-actions";
import { getStudentFeed, getMyEducators, type MyEducator } from "@/actions/batch-actions";
import { resumeProgress } from "@/actions/progress-actions";
import { getStudentHistory, getExamHubData } from "@/actions/student-actions";
import { ResumeCard } from "@/components/student/dashboard/resume-card";
import { TutorialCards } from "@/components/student/dashboard/tutorial-cards";
import { StudentPageHeader } from "@/components/student/shared/page-header";
import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma/client";
import { resolvePlanEntitlement, resolvePublicPlanTier } from "@/lib/server/plan-entitlements";
import {
    getStudentCACategory,
    resolveStudentExamTarget,
    type CaLevelKey
} from "@/lib/student-level";
import { listStudentVisibleExams } from "@/lib/server/exam-publishing";
import { getRoleRedirectPath } from "@/lib/server/auth-management";
import type { AppRole } from "@/lib/auth/demo-accounts";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";
import type { StudentVisibleExam } from "@/types/publish-exam";
import { BookOpen, ChartLineUp, Clock, FilePdf, FileText, List, Medal, Play, Sparkle, Target, Trophy, ChalkboardTeacher, CaretRight, ShieldCheck, CreditCard, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ComponentProps } from "react";

export const dynamic = "force-dynamic";

type ResumeCardProgress = ComponentProps<typeof ResumeCard>["progress"];

type DashboardAnnouncement = {
    id: string;
    title: string;
    description: string;
    date: string;
    tag: string;
};

type DashboardLeaderboardEntry = {
    rank: number;
    name: string;
    score: number;
    isMe: boolean;
};

type DashboardPracticeExam = {
    id: string;
    title: string;
    questions: number;
    category: string;
};

type DashboardResource = {
    id: string;
    title: string;
    category: string;
    type: string;
};

type SubmittedAttemptWindow = {
    startTime: Date;
    endTime: Date | null;
};

type DashboardResourceRecord = {
    id: string;
    title: string;
    category: string;
    subType: string;
    downloads: number;
    isTrending: boolean;
    createdAt: Date;
};

function truncateLabel(value: string, maxLength: number) {
    const normalized = value.replace(/\s+/g, " ").trim();
    if (normalized.length <= maxLength) {
        return normalized;
    }

    return `${normalized.slice(0, maxLength - 3)}...`;
}

function formatAnnouncementDate(value: Date) {
    const timestamp = new Date(value).getTime();
    if (Number.isNaN(timestamp)) {
        return "Recently";
    }

    const ageInDays = Math.floor((Date.now() - timestamp) / 86_400_000);
    if (ageInDays <= 0) {
        return "Today";
    }

    if (ageInDays === 1) {
        return "Yesterday";
    }

    if (ageInDays < 7) {
        return `${ageInDays} days ago`;
    }

    return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}

function getStudentResourceCategories(level: CaLevelKey) {
    const categories = new Set<string>(["GENERAL", getStudentCACategory(level)]);

    if (level === "ipc") {
        categories.add("CA Inter");
    }

    return Array.from(categories);
}

export default async function StudentDashboardPage() {
    // ── Fetch real data ────────────────────────────────────────────────────────
    let userName = "Student";
    let totalQuestionsAttempted = 0;
    let totalQuestionsAvailable = 0;
    let mcqProgressPct = 0;
    let totalStudyMinutes = 0;
    let totalMCQScore = 0;
    let avgAccuracy = 0;
    let currentRank = 0;
    let percentile = 0;
    let levelProgressPct = 0;
    let daysToExam = 0;
    let announcements: DashboardAnnouncement[] = [];
    let leaderboard: DashboardLeaderboardEntry[] = [];
    let topPracticeExams: DashboardPracticeExam[] = [];
    let freeResources: DashboardResource[] = [];
    let latestProgress: ResumeCardProgress = null;
    let myEducators: MyEducator[] = [];

    const user = await getCurrentUser();
    if (!user) {
        redirect("/auth/login");
    }

    if (user.role !== "STUDENT" && user.role !== "ADMIN") {
        redirect(getRoleRedirectPath(user.role as AppRole));
    }

    const validUser = user; // Type guard helper for TS
    const planEntitlement = resolvePlanEntitlement(user.plan, user.role);
    const currentPlanTier = resolvePublicPlanTier(user.plan);
    const isPaidPlan = planEntitlement.isPremium;
    const planName = planEntitlement.displayName;
    const expiresAt = user.planExpiresAt;
    const daysLeft = expiresAt ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

    try {
        const examTarget = resolveStudentExamTarget(user);
        const caLevelKey = examTarget.caLevelKey;
        const resourceCategories = getStudentResourceCategories(caLevelKey);

        const [
            progressResult,
            historyResult,
            examHubResult,
            feedResult,
            leaderboardResult,
            userRankResult,
            visibleExams,
            topicProgressTotals,
            submittedAttempts,
            resourceLibrary,
            educatorsResult,
        ] = await Promise.all([
            resumeProgress(),
            getStudentHistory(),
            getExamHubData(),
            getStudentFeed(),
            getGlobalLeaderboard(5),
            getUserRank(validUser.id),
            listStudentVisibleExams(validUser.id, caLevelKey).catch(() => [] as StudentVisibleExam[]),
            prisma.topicProgress.aggregate({
                where: { studentId: validUser.id },
                _sum: { totalAttempted: true },
            }).catch(() => ({ _sum: { totalAttempted: 0 } })),
            prisma.examAttempt.findMany({
                where: {
                    studentId: validUser.id,
                    status: "SUBMITTED",
                },
                select: {
                    startTime: true,
                    endTime: true,
                },
            }).catch(() => [] as SubmittedAttemptWindow[]),
            prisma.studyMaterial.findMany({
                where: {
                    isPublic: true,
                    category: { in: resourceCategories },
                },
                select: {
                    id: true,
                    title: true,
                    category: true,
                    subType: true,
                    downloads: true,
                    isTrending: true,
                    createdAt: true,
                },
                orderBy: [
                    { isTrending: "desc" },
                    { downloads: "desc" },
                    { createdAt: "desc" },
                ],
                take: 4,
            }).catch(() => [] as DashboardResourceRecord[]),
            getMyEducators()
        ]);

        userName = user.fullName?.trim() || user.email?.trim() || "Student";

        if (progressResult.success) {
            latestProgress = progressResult.data as ResumeCardProgress;
        }

        if (historyResult.success && historyResult.data) {
            totalMCQScore = historyResult.data.profile.totalXP;
            avgAccuracy = historyResult.data.profile.avgAccuracy;
            daysToExam = historyResult.data.examTargetDays;
        }

        if (examHubResult.success && examHubResult.data) {
            const practiceGoal = examHubResult.data.practiceGoal;
            if (practiceGoal.target > 0) {
                levelProgressPct = Math.min(
                    100,
                    Math.round((practiceGoal.current / practiceGoal.target) * 100),
                );
            }
        }

        totalQuestionsAttempted = topicProgressTotals._sum.totalAttempted ?? 0;
        totalQuestionsAvailable = visibleExams.reduce((sum: number, exam: StudentVisibleExam) => sum + exam.questionCount, 0);
        if (totalQuestionsAvailable > 0) {
            mcqProgressPct = Math.min(
                100,
                Math.round((totalQuestionsAttempted / totalQuestionsAvailable) * 100),
            );
        }

        totalStudyMinutes = submittedAttempts.reduce((sum: number, attempt: SubmittedAttemptWindow) => {
            if (!attempt.endTime) {
                return sum;
            }

            const durationInMinutes = Math.round(
                (attempt.endTime.getTime() - attempt.startTime.getTime()) / 60_000,
            );

            return durationInMinutes > 0 ? sum + durationInMinutes : sum;
        }, 0);

        if (feedResult.success && feedResult.data) {
            announcements = feedResult.data.feedItems.slice(0, 3).map((item) => ({
                id: item.id,
                title: item.batchName,
                description: truncateLabel(item.content, 110),
                date: formatAnnouncementDate(item.createdAt),
                tag: item.teacherName,
            }));
        }

        if (leaderboardResult.success && leaderboardResult.data) {
            leaderboard = leaderboardResult.data.map((entry) => ({
                rank: entry.rank,
                name: entry.fullName,
                score: entry.totalXP,
                isMe: entry.studentId === user.id,
            }));
        }

        if (userRankResult.success && userRankResult.data) {
            currentRank = userRankResult.data.rank;
            percentile = userRankResult.data.percentile;

            if (!leaderboard.some((entry) => entry.isMe)) {
                const topPeers = leaderboard.filter((entry) => !entry.isMe).slice(0, 4);
                leaderboard = [
                    ...topPeers,
                    {
                        rank: userRankResult.data.rank,
                        name: user.fullName?.trim() || user.email?.trim() || "You",
                        score: userRankResult.data.totalXP,
                        isMe: true,
                    },
                ].sort((left, right) => left.rank - right.rank);
            }
        }

        topPracticeExams = visibleExams.slice(0, 4).map((exam: StudentVisibleExam) => ({
            id: exam.id,
            title: exam.title,
            questions: exam.questionCount,
            category: exam.subject || exam.category,
        }));

        freeResources = resourceLibrary.map((resource: DashboardResourceRecord) => ({
            id: resource.id,
            title: resource.title,
            category: resource.category,
            type: resource.subType,
        }));
        
        if (educatorsResult && educatorsResult.success) {
            myEducators = educatorsResult.data || [];
        }
    } catch (error) {
        console.error("Dashboard error:", error);
    }

    const studyHoursLabel = totalStudyMinutes >= 60
        ? `${Math.floor(totalStudyMinutes / 60)}h ${totalStudyMinutes % 60}m`
        : `${totalStudyMinutes}m`;
    const practiceCoverageLabel = totalQuestionsAvailable > 0
        ? `${mcqProgressPct}% Total Progress`
        : "Waiting for published exams";
    const scoreLabel = avgAccuracy > 0
        ? `${Math.round(avgAccuracy)}% Avg. Accuracy`
        : "Accuracy updates after submissions";
    const rankLabel = currentRank > 0
        ? `TOP ${Math.max(1, 100 - percentile)}% of Students`
        : "Complete practice to unlock ranking";

    return (
        <div className="space-y-8 pb-10 w-full max-w-[1400px] mx-auto font-outfit">
            <StudentPageHeader
                eyebrow="Student dashboard"
                title={`Welcome back, ${userName}.`}
                description={
                    <>
                        You have completed{" "}
                        <span className="font-bold text-[var(--student-accent-strong)]">{levelProgressPct}%</span>{" "}
                        of your current practice goal.
                    </>
                }
                daysToExam={daysToExam}
            />

            {/* Tutorial Section - Shown on first login */}
            {validUser.loginCount === 1 && (
                <TutorialCards />
            )}

            {/* Resume Card Section */}
            {latestProgress && (
                <div className="px-1 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
                    <ResumeCard progress={latestProgress} />
                </div>
            )}

            {/* Top 4 Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-1 relative">
                {/* Decorative gradients for the row */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[var(--student-accent-soft)] via-transparent to-[var(--student-support-soft)] blur-3xl" />

                {/* MCQ Progress */}
                <div className="student-surface group relative flex min-h-[160px] flex-col justify-center overflow-hidden rounded-2xl transition-all duration-300 hover:border-[var(--student-accent-soft-strong)] hover:shadow-[0_20px_36px_rgba(55,48,38,0.08)]">
                    <div className="flex items-start justify-between mb-6 px-8 pt-8">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)]">
                            Practice Coverage
                        </span>
                        <div className="student-icon-tile flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300">
                            <ChartLineUp size={20} weight="fill" />
                        </div>
                    </div>
                    <div className="mb-3 flex items-end gap-2 px-8">
                        <div className="font-outfit text-4xl font-bold leading-none tracking-tight text-[var(--student-text)]">{totalQuestionsAttempted.toLocaleString()}</div>
                    </div>
                    <div className="mt-3 flex items-center justify-between px-8 pb-8 text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)]">
                        <span className="text-[var(--student-accent-strong)]">{practiceCoverageLabel}</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 overflow-hidden bg-[var(--student-panel-muted)]">
                        <div className="h-full bg-[var(--student-accent)] transition-all duration-1000 ease-out" style={{ width: `${Math.min(mcqProgressPct, 100)}%` }}></div>
                    </div>
                </div>

                {/* Total Study Time */}
                <div className="student-surface group relative flex min-h-[160px] flex-col justify-between rounded-2xl p-8 transition-all duration-300 hover:border-[var(--student-support-soft-strong)] hover:shadow-[0_20px_36px_rgba(55,48,38,0.08)]">
                    <div className="flex items-start justify-between mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)]">
                            Total Study Time
                        </span>
                        <div className="student-icon-tile-warm flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300">
                            <Clock size={20} weight="fill" />
                        </div>
                    </div>
                    <div className="mb-3 mt-2 font-outfit text-4xl font-bold leading-none tracking-tight text-[var(--student-text)]">{studyHoursLabel}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)]">
                        Focused Learning
                    </div>
                </div>

                {/* Total MCQ Score */}
                <div className="student-surface group relative flex min-h-[160px] flex-col justify-between overflow-hidden rounded-2xl p-8 transition-all duration-300 hover:border-[var(--student-success-soft-strong)] hover:shadow-[0_20px_36px_rgba(55,48,38,0.08)]">
                    <div className="flex items-start justify-between mb-4 relative z-10">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)]">
                            Points Earned
                        </span>
                        <div className="student-icon-tile-success flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300">
                            <Target size={20} weight="fill" />
                        </div>
                    </div>
                    <div className="relative z-10 mb-3 mt-2 font-outfit text-4xl font-bold leading-none tracking-tight text-[var(--student-text)]">{totalMCQScore.toLocaleString()} <span className="text-sm font-bold tracking-tight text-[var(--student-success)]">XP</span></div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)]">
                        {scoreLabel}
                    </div>
                </div>

                {/* Current Ranking */}
                <div className="student-surface-dark group relative flex min-h-[160px] flex-col justify-between overflow-hidden rounded-2xl p-8 transition-all duration-300 hover:shadow-[0_28px_44px_rgba(24,31,34,0.18)]">
                    <div className="flex items-start justify-between relative z-10">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--student-ink-muted)]">
                            Global Rank
                        </span>
                        <div className="student-icon-tile-warm flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300">
                            <Medal size={20} weight="fill" />
                        </div>
                    </div>
                    <div className="relative z-10 mb-3 mt-2 font-outfit text-4xl font-bold leading-none tracking-tight">#{currentRank > 0 ? currentRank : '-'} <span className="pl-1 text-xs font-bold uppercase tracking-widest opacity-40">RANK</span></div>
                    <div className="relative z-10 text-[10px] font-bold uppercase tracking-widest text-[var(--student-support)]">
                        {rankLabel}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid lg:grid-cols-3 gap-8 pt-4">
                {/* Left Column: Educators & Update Feeds */}
                <div className="lg:col-span-2 space-y-10">
                    
                    {/* My Educators Horizontal List */}
                    {myEducators.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h2 className="flex items-center gap-3 font-outfit uppercase font-bold text-[var(--student-text)]">
                                        <ChalkboardTeacher size={20} className="text-[var(--student-muted)]" weight="bold" />
                                        My Educators
                                    </h2>
                                    <p className="pl-8 text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted-strong)]">Quick access to your faculties</p>
                                </div>
                            </div>
                            
                            <div className="flex overflow-x-auto gap-4 pb-4 custom-scrollbar snap-x">
                                {myEducators.map(ed => (
                                    <Link key={ed.id} href={`/student/educator/${ed.id}`} className="snap-start shrink-0 w-[260px] student-surface group relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:border-indigo-500/30 hover:shadow-[0_16px_32px_rgba(79,70,229,0.08)]">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg shadow-inner">
                                                {ed.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                <CaretRight size={14} weight="bold" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-outfit text-lg font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{ed.name}</h3>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {ed.subjects.length > 0 ? ed.subjects.slice(0, 2).map((s, i) => (
                                                    <span key={i} className="text-[9px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-100/50 truncate max-w-[100px]">{s}</span>
                                                )) : (
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-2.5 py-1 rounded truncate">General Faculty</span>
                                                )}
                                                {ed.subjects.length > 2 && <span className="text-[9px] font-black tracking-widest text-slate-500 bg-slate-100 px-1.5 py-1 rounded">+{ed.subjects.length - 2}</span>}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Treasury Portal (Subscription Control) */}
                    <div className="space-y-6">
                        <div className="space-y-1 mb-2">
                            <h2 className="flex items-center gap-3 uppercase font-outfit font-bold text-[var(--student-text)]">
                                <ShieldCheck size={20} className="text-[var(--student-muted)]" weight="bold" />
                                Treasury Oversight
                            </h2>
                            <p className="pl-8 text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted-strong)]">Financial & Access Instrumentation</p>
                        </div>

                        <div className="student-surface group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-[0_20px_40px_rgba(16,185,129,0.08)]">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
                            
                            <div className="relative flex justify-between items-start mb-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-outfit text-xl font-black text-slate-900 tracking-tight">{planName}</h3>
                                        {isPaidPlan && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 font-black uppercase tracking-widest border border-emerald-200">{currentPlanTier}</span>
                                        )}
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Governance Active</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                    <CreditCard size={20} weight="bold" />
                                </div>
                            </div>

                            <div className="relative space-y-4 mb-6">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan Validity</span>
                                    <span className="text-sm font-black text-slate-800">{isPaidPlan ? `${daysLeft} Days Remaining` : "Perpetual Free"}</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className={cn("h-full transition-all duration-1000", isPaidPlan ? "bg-emerald-500" : "bg-slate-300")} 
                                        style={{ width: isPaidPlan ? `${Math.min(100, (daysLeft / 365) * 100)}%` : "100%" }} 
                                    />
                                </div>
                            </div>

                            <Link 
                                href="/pricing"
                                className="relative flex items-center justify-center gap-3 w-full py-3.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95 group"
                            >
                                {isPaidPlan ? "Manage Subscription" : "Compare Plans"}
                                <ArrowRight size={14} weight="bold" className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-2">
                        <div className="space-y-1">
                            <h2 className="flex items-center gap-3 font-outfit uppercase font-bold text-[var(--student-text)]">
                                <FileText size={20} className="text-[var(--student-muted)]" weight="bold" />
                                Latest Announcements
                            </h2>
                            <p className="pl-8 text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted-strong)]">Stay updated with the latest news</p>
                        </div>
                        <Link href="/student/updates" className="student-button-secondary rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-200 active:scale-95">View All</Link>
                    </div>

                    <div className="space-y-4">
                        {announcements.length === 0 ? (
                            <div className="student-surface rounded-2xl border-2 border-dashed border-[var(--student-border)] p-12 text-center">
                                <FileText size={40} className="mx-auto mb-4 text-[var(--student-border-strong)] opacity-30" />
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)]">No active announcements</h3>
                            </div>
                        ) : (
                            announcements.map((feed) => (
                                <div key={feed.id} className="student-surface group relative flex gap-5 overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:border-[var(--student-accent-soft-strong)] hover:shadow-[0_18px_30px_rgba(55,48,38,0.08)]">
                                    <div className="student-icon-tile flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300">
                                        <FileText size={20} weight="fill" />
                                    </div>
                                    <div className="flex-1 min-w-0 relative z-10">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)]">
                                                <span className="text-[var(--student-accent-strong)]">{feed.tag}</span> <span className="px-2 opacity-30">/</span> {feed.date}
                                            </div>
                                        </div>
                                        <h3 className="mb-2 font-outfit text-lg font-bold leading-tight tracking-tight text-[var(--student-text)] transition-colors group-hover:text-[var(--student-accent-strong)]">
                                            {feed.title}
                                        </h3>
                                        <p className="mb-5 max-w-xl line-clamp-1 font-sans text-sm font-medium text-[var(--student-muted)] opacity-90">
                                            {feed.description}
                                        </p>
                                        <div className="flex items-center gap-4">
                                            <Link href="/student/updates" className="student-button-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-200 active:scale-95">
                                                <Play size={14} weight="fill" />
                                                Read More
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

                {/* Right Column: Rankings */}
                <div className="space-y-6">
                    <div className="space-y-1 mb-2">
                        <h2 className="flex items-center gap-3 uppercase font-outfit font-bold text-[var(--student-text)]">
                            <Trophy size={20} className="text-[var(--student-muted)]" weight="bold" />
                            Peer Leaderboard
                        </h2>
                        <p className="pl-8 text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted-strong)]">Your standing among peers</p>
                    </div>

                    <div className="student-surface rounded-2xl p-5">
                        {leaderboard.length === 0 ? (
                            <div className="py-20 text-center text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted-light)]">
                                No Peer Data
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {leaderboard.map((item, i) => (
                                    <div key={i} className={cn(
                                        "flex items-center justify-between p-4 rounded-2xl transition-all duration-300",
                                        item.isMe ? "bg-[var(--student-accent-strong)] text-white shadow-[0_20px_30px_rgba(31,92,80,0.18)]" : "hover:bg-white/80"
                                    )}>
                                        <div className="flex items-center gap-4">
                                            <div className={cn("w-5 text-center text-xs font-bold", item.isMe ? "text-[rgba(220,235,230,0.82)]" : "text-[var(--student-muted)]")}>
                                                {item.rank}
                                            </div>
                                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold uppercase shadow-sm border",
                                                item.isMe ? "bg-white/10 border-white/10 text-white" : "bg-white border-[var(--student-border)] text-[var(--student-muted)]")}>
                                                {item.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className={cn("mb-0.5 font-outfit text-sm font-bold leading-tight tracking-tight", item.isMe ? "text-white" : "text-[var(--student-text)]")}>
                                                    {item.name}
                                                </div>
                                                <div className={cn("text-[10px] font-bold uppercase tracking-widest", item.isMe ? "text-white/70" : "text-[var(--student-muted)]")}>
                                                    LVL {Math.floor(1 + Math.sqrt(item.score / 50))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={cn("mb-0.5 font-outfit text-sm font-bold leading-tight tracking-tight", item.isMe ? "text-white" : "text-[var(--student-text)]")}>{item.score.toLocaleString()}</div>
                                            <div className={cn("text-[10px] font-bold uppercase tracking-widest", item.isMe ? "text-white/70" : "text-[var(--student-accent-strong)]")}>Unit XP</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Link href="/leaderboard"
                            className="student-button-secondary mt-6 block w-full rounded-xl py-3.5 text-center text-[10px] font-bold uppercase tracking-widest transition-all active:scale-[0.98]">
                            View Detailed Ranking
                        </Link>
                    </div>
                </div>
            </div>

            {/* Free Resource Library Section */}
            <div className="pt-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="space-y-1">
                        <h2 className="flex items-center gap-3 uppercase font-outfit font-bold text-[var(--student-text)]">
                            <BookOpen size={20} className="text-[var(--student-muted)]" weight="bold" />
                            Free Resources
                        </h2>
                        <p className="pl-8 text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)]">Helpful study materials</p>
                    </div>
                    <Link href="/student/free-resources" className="student-button-secondary rounded-xl px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-200 active:scale-95">Explore All</Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {freeResources.length === 0 ? (
                        <div className="student-surface lg:col-span-4 rounded-2xl border-2 border-dashed border-[var(--student-border)] p-12 text-center text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted-light)]">
                            No resources available yet
                        </div>
                    ) : freeResources.map((res) => (
                        <Link href="/student/free-resources" key={res.id}
                            className="student-surface group relative flex min-h-[140px] cursor-pointer flex-col justify-between overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:border-[var(--student-accent-soft-strong)] hover:shadow-[0_18px_30px_rgba(55,48,38,0.08)]">
                            <div className="flex items-start justify-between mb-4 relative z-10">
                                <div className="student-icon-tile flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300">
                                    <FilePdf size={18} weight="fill" />
                                </div>
                                <span className="student-chip rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
                                    {res.type}
                                </span>
                            </div>
                            <div className="z-10 relative">
                                <h4 className="mb-2 line-clamp-2 font-outfit text-base font-bold leading-tight tracking-tight text-[var(--student-text)] transition-colors group-hover:text-[var(--student-accent-strong)]">
                                    {res.title}
                                </h4>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)]">
                                    {res.category}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="pt-10">
                <div className="flex items-center justify-between mb-8">
                    <div className="space-y-1">
                        <h2 className="flex items-center gap-3 uppercase font-outfit font-bold text-[var(--student-text)]">
                            <Sparkle size={20} className="text-[var(--student-muted)]" weight="bold" />
                            Recommended Exams
                        </h2>
                        <p className="pl-8 text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)]">Top practice modules for you</p>
                    </div>
                    <Link href="/student/exams" className="student-button-secondary rounded-xl px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-200 active:scale-95">View More</Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {topPracticeExams.length === 0 ? (
                        <div className="student-surface lg:col-span-4 rounded-2xl border-2 border-dashed border-[var(--student-border)] p-12 text-center text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted-light)]">
                            No exams available yet
                        </div>
                    ) : topPracticeExams.map((exam) => {
                        return (
                            <Link href={`/exam/war-room?examId=${exam.id}`} key={exam.id}
                                className="student-surface group relative flex min-h-[140px] cursor-pointer flex-col justify-between overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:border-[var(--student-accent-soft-strong)] hover:shadow-[0_18px_30px_rgba(55,48,38,0.08)]">
                                <div className="flex items-start justify-between mb-4 relative z-10">
                                    <div className="student-icon-tile flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300">
                                        <List size={18} weight="fill" />
                                    </div>
                                    <div className="h-2 w-2 rounded-full bg-[var(--student-success)]" />
                                </div>
                                <div className="z-10 relative">
                                    <h4 className="mb-2 line-clamp-1 font-outfit text-base font-bold leading-tight tracking-tight text-[var(--student-text)] transition-colors group-hover:text-[var(--student-accent-strong)]">
                                        {exam.title}
                                    </h4>
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)]">
                                        <span>{exam.questions} Questions</span>
                                        <span className="opacity-30">•</span>
                                        <span className="text-[var(--student-muted-strong)]">{exam.category}</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
