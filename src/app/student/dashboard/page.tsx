import { getGlobalLeaderboard, getUserRank } from "@/actions/leaderboard-actions";
import { getStudentFeed, getMyEducators, type MyEducator } from "@/actions/batch-actions";
import { resumeProgress } from "@/actions/progress-actions";
import { getStudentHistory, getExamHubData } from "@/actions/student-actions";
import { ResumeCard } from "@/components/student/dashboard/resume-card";
import { TutorialCards } from "@/components/student/dashboard/tutorial-cards";
import { StudentPageHeader } from "@/components/student/shared/page-header";
import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma/client";

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
import { BookOpen, ChartLineUp, Clock, FilePdf, FileText, List, Medal, Play, Sparkle, Target, Trophy, ChalkboardTeacher, CaretRight, Users, CheckCircle } from "@phosphor-icons/react/dist/ssr";
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
    let dailyTargets: any[] = [];

    const user = await getCurrentUser();
    if (!user) {
        redirect("/auth/login");
    }

    if (user.role !== "STUDENT" && user.role !== "ADMIN") {
        redirect(getRoleRedirectPath(user.role as AppRole));
    }

    const validUser = user; // Type guard helper for TS


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
            getMyEducators(),
            prisma.dailyTargetQueue.findMany({
                where: { studentId: validUser.id, isCompleted: false },
                include: { mcq: { include: { subject: true } } },
                orderBy: { priority: "desc" },
                take: 5
            }).catch(() => [])
        ]);

        userName = user.fullName?.trim() || user.email?.trim() || "Student";
        dailyTargets = arguments[11] || []; // Quick assignment from Promise.all index 11 (zero-indexed)

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
            announcements = feedResult.data.feedItems.slice(0, 3).map((item: any) => ({
                id: item.id,
                title: item.batchName,
                description: truncateLabel(item.content, 110),
                date: formatAnnouncementDate(item.createdAt),
                tag: item.teacherName,
            }));
        }

        if (leaderboardResult.success && leaderboardResult.data) {
            leaderboard = leaderboardResult.data.map((entry: any) => ({
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
        <div className="space-y-8 pb-10 w-full max-w-[1400px] mx-auto  ">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-1 relative">
                {/* Decorative gradients for the row */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[var(--student-accent-soft)] via-transparent to-[var(--student-support-soft)] blur-3xl opacity-50" />

                {/* MCQ Progress */}
                <div className="student-surface group relative flex min-h-[160px] flex-col justify-center overflow-hidden rounded-lg transition-all duration-300 hover:border-[var(--student-accent-soft-strong)] hover:shadow-xl">
                    <div className="flex items-start justify-between mb-6 px-5 pt-8">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--student-muted)]">
                            Practice Coverage
                        </span>
                        <div className="student-icon-tile flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-300">
                            <ChartLineUp size={20} weight="fill" />
                        </div>
                    </div>
                    <div className="mb-3 flex items-end gap-2 px-5">
                        <div className="  text-3xl xl:text-4xl font-bold leading-none tracking-tight text-[var(--student-text)]">{totalQuestionsAttempted.toLocaleString()}</div>
                    </div>
                    <div className="mt-3 flex items-center justify-between px-5 pb-8 text-[10px] font-black uppercase tracking-widest text-[var(--student-muted)]">
                        <span className="text-[var(--student-accent-strong)]">{mcqProgressPct}% Progress</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 overflow-hidden bg-[var(--student-panel-muted)]">
                        <div className="h-full bg-[var(--student-accent)] transition-all duration-1000 ease-out" style={{ width: `${Math.min(mcqProgressPct, 100)}%` }}></div>
                    </div>
                </div>

                {/* Total Study Time */}
                <div className="student-surface group relative flex min-h-[160px] flex-col justify-center rounded-lg p-6 transition-all duration-300 hover:shadow-xl">
                    <div className="flex items-start justify-between mb-6">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--student-muted)]">
                            Focus Time
                        </span>
                        <div className="student-icon-tile-warm flex h-10 w-10 items-center justify-center rounded-lg">
                            <Clock size={20} weight="fill" />
                        </div>
                    </div>
                    <div className="mb-3   text-3xl xl:text-4xl font-bold leading-none tracking-tight">{studyHoursLabel}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[var(--student-accent-strong)]">Learning Engine Active</div>
                </div>

                {/* Total MCQ Score */}
                <div className="student-surface group relative flex min-h-[160px] flex-col justify-center overflow-hidden rounded-lg p-6 transition-all duration-300 hover:shadow-xl">
                    <div className="flex items-start justify-between mb-6 relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--student-muted)]">
                            Unit Experience
                        </span>
                        <div className="student-icon-tile-success flex h-10 w-10 items-center justify-center rounded-lg">
                            <Target size={20} weight="fill" />
                        </div>
                    </div>
                    <div className="relative z-10 mb-3   text-3xl xl:text-4xl font-bold leading-none tracking-tight">{totalMCQScore.toLocaleString()} <span className="text-sm font-black tracking-tight text-[var(--student-success)]">XP</span></div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[var(--student-success-strong)]">{avgAccuracy}% Accuracy</div>
                </div>

                {/* Current Ranking */}
                <div className="student-surface-dark group relative flex min-h-[160px] flex-col justify-center overflow-hidden rounded-lg p-6 transition-all duration-300 hover:shadow-2xl">
                    <div className="flex items-start justify-between relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--student-ink-muted)] opacity-60">
                            Global Position
                        </span>
                        <div className="student-icon-tile-warm flex h-10 w-10 items-center justify-center rounded-lg">
                            <Medal size={20} weight="fill" />
                        </div>
                    </div>
                    <div className="relative z-10 mb-3   text-3xl xl:text-4xl font-bold leading-none tracking-tight">#{currentRank > 0 ? currentRank : '-'} <span className="pl-1 text-xs font-black uppercase tracking-widest opacity-40">INDEX</span></div>
                    <div className="relative z-10 text-[10px] font-black uppercase tracking-widest text-[var(--student-support)] opacity-80">
                        Top {Math.max(1, 100 - percentile)}% Rank
                    </div>
                </div>
            </div>

            {/* Main Content Area - Balanced 2-Column Grid */}
            <div className="grid lg:grid-cols-2 gap-8 pt-4">
                <div className="space-y-8">
                    {/* My Educators */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h2 className="flex items-center gap-3   uppercase font-bold text-lg text-[var(--student-text)]">
                                    <ChalkboardTeacher size={20} className="text-[var(--student-muted)]" weight="bold" />
                                    My Educators
                                </h2>
                                <p className="pl-8 text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted-strong)] opacity-60">Quick access to faculties</p>
                            </div>
                        </div>

                        {myEducators.length === 0 ? (
                            <div className="student-surface rounded-lg p-12 text-center bg-gray-50/30 border-dashed border-gray-200">
                                <Users size={32} className="mx-auto mb-4 text-gray-300" weight="bold" />
                                <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Join a batch to unlock faculties</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {myEducators.slice(0, 2).map(ed => (
                                    <Link key={ed.id} href={`/student/educator/${ed.id}`} className="student-surface group relative flex items-center gap-5 p-6 transition-all duration-300 hover:border-indigo-500/30 hover:shadow-lg">
                                        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg shrink-0 uppercase">
                                            {ed.name.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="  text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{ed.name}</h3>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 opacity-80 truncate">{ed.subjects[0] || "Faculty"}</div>
                                        </div>
                                        <CaretRight size={14} weight="bold" className="ml-auto text-slate-300 group-hover:text-indigo-600 transition-colors" />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* UNIFIED DAILY TARGET QUEUE */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <div className="space-y-1">
                                <h2 className="flex items-center gap-3   uppercase font-bold text-lg text-[var(--student-text)]">
                                    <List size={20} className="text-[var(--student-muted)]" weight="bold" />
                                    Today's Targets
                                </h2>
                                <p className="pl-8 text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted-strong)] opacity-60">Cross-subject unified queue from Shadow Engine</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {dailyTargets.length === 0 ? (
                                <div className="student-surface rounded-lg p-16 text-center border-dashed">
                                    <CheckCircle size={40} className="mx-auto mb-4 text-emerald-400" weight="fill" />
                                    <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600">All targets clear!</p>
                                </div>
                            ) : (
                                dailyTargets.map((target) => (
                                    <div key={target.id} className="student-surface group relative flex gap-6 overflow-hidden rounded-lg p-6 transition-all duration-300 hover:shadow-lg border-l-4 border-l-orange-500">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-orange-500">
                                                    {target.reason} <span className="px-1 opacity-20">|</span> {target.mcq?.subject?.name || "Topic"}
                                                </div>
                                                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg text-[9px] font-bold">Category {target.mcq?.icaiCategory || "Gen"}</span>
                                            </div>
                                            <h3 className="mb-2   text-md font-bold text-slate-900 group-hover:text-indigo-600 line-clamp-2 leading-tight">
                                                {target.mcq?.questionText || "Question Content Hidden"}
                                            </h3>
                                        </div>
                                        <button className="self-center bg-indigo-600 text-white rounded-full p-2 h-10 w-10 flex items-center justify-center shadow-md hover:bg-indigo-700 transition">
                                            <Play size={16} weight="fill" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Peer & High Priority Sections */}
                <div className="space-y-8">
                    <div className="space-y-1">
                        <h2 className="flex items-center gap-3   uppercase font-bold text-lg text-[var(--student-text)]">
                            <Trophy size={20} className="text-[var(--student-muted)]" weight="bold" />
                            Global Leaderboard
                        </h2>
                        <p className="pl-8 text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted-strong)] opacity-60">Your standing in the elite cohort</p>
                    </div>

                    <div className="student-surface rounded-lg p-6 shadow-sm border-[var(--student-border)]">
                        {leaderboard.length === 0 ? (
                            <div className="py-24 text-center text-[11px] font-black uppercase tracking-widest text-slate-300">Synchronizing Data...</div>
                        ) : (
                            <div className="space-y-2">
                                {leaderboard.map((item, i) => (
                                    <div key={i} className={cn(
                                        "flex items-center justify-between p-4 rounded-lg transition-all duration-300",
                                        item.isMe ? "bg-[var(--student-accent-strong)] text-white shadow-lg" : "hover:bg-slate-50 border border-transparent hover:border-slate-100"
                                    )}>
                                        <div className="flex items-center gap-4">
                                            <div className={cn("w-5 text-center text-[11px] font-black", item.isMe ? "text-white/60" : "text-slate-300")}>
                                                {item.rank}
                                            </div>
                                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-[11px] font-black uppercase border",
                                                item.isMe ? "bg-white/10 border-white/20 text-white" : "bg-white border-slate-100 text-slate-400")}>
                                                {item.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className={cn("text-sm font-bold tracking-tight", item.isMe ? "text-white" : "text-slate-900")}>
                                                    {item.isMe ? "You" : item.name.split(' ')[0]}
                                                </div>
                                                <div className={cn("text-[9px] font-black uppercase tracking-widest", item.isMe ? "text-white/50" : "text-slate-400")}>
                                                    LVL {Math.floor(1 + Math.sqrt(item.score / 50))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={cn("text-right   text-sm font-bold", item.isMe ? "text-white" : "text-indigo-600")}>
                                            {item.score.toLocaleString()} <span className="text-[9px] opacity-60 ml-0.5 whitespace-nowrap">XP</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Link href="/leaderboard" className="block w-full mt-6 py-3.5 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] text-center hover:bg-slate-800 transition-all active:scale-[0.98]">Full Directory Index</Link>
                    </div>

                    {/* Quick Resources / Tips */}
                    <div className="student-surface rounded-lg p-8 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="relative z-10 space-y-4">
                            <Sparkle size={24} weight="fill" className="text-indigo-200" />
                            <h3 className="text-lg font-black uppercase tracking-widest leading-tight">Momentum Daily</h3>
                            <p className="text-sm leading-relaxed text-indigo-100 font-medium opacity-90">Maximize your focus sessions by reviewing "Professor Files" first thing in the morning.</p>
                            <Link href="/student/free-resources" className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white hover:translate-x-1 transition-transform pt-2">
                                View Productivity Tips <CaretRight size={12} weight="bold" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Global Sections */}
            <div className="pt-10 space-y-16">
                {/* Resource Section */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="flex items-center gap-3   uppercase font-bold text-lg text-[var(--student-text)]">
                                <BookOpen size={20} className="text-[var(--student-muted)]" weight="bold" />
                                Resource Library
                            </h2>
                            <p className="pl-8 text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted-strong)] opacity-60">System verified study materials</p>
                        </div>
                        <Link href="/student/free-resources" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:underline">Explore Collection</Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {freeResources.length === 0 ? (
                            <div className="lg:col-span-4 py-16 text-center border-2 border-dashed border-slate-100 rounded-lg text-[11px] font-black uppercase tracking-widest text-slate-300">No Archives Found</div>
                        ) : freeResources.map((res) => (
                            <Link href="/student/free-resources" key={res.id} className="student-surface group p-6 rounded-lg transition-all hover:shadow-lg">
                                <div className="flex items-start justify-between mb-5">
                                    <div className="student-icon-tile h-10 w-10 rounded-lg flex items-center justify-center">
                                        <FilePdf size={20} weight="fill" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest bg-slate-50 px-2.5 py-1.5 rounded-lg text-slate-400">{res.type}</span>
                                </div>
                                <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 line-clamp-2 uppercase leading-tight mb-2 transition-colors">{res.title}</h4>
                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">{res.category}</div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Exams Section */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="flex items-center gap-3   uppercase font-bold text-lg text-[var(--student-text)]">
                                <List size={20} className="text-[var(--student-muted)]" weight="bold" />
                                War Room Access
                            </h2>
                            <p className="pl-8 text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted-strong)] opacity-60">High-priority practice modules</p>
                        </div>
                        <Link href="/student/exams" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:underline">Join Simulation</Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {topPracticeExams.length === 0 ? (
                            <div className="lg:col-span-4 py-16 text-center border-2 border-dashed border-slate-100 rounded-lg text-[11px] font-black uppercase tracking-widest text-slate-300">Modules Offline</div>
                        ) : topPracticeExams.map((exam) => (
                            <Link href={`/exam/war-room?examId=${exam.id}`} key={exam.id} className="student-surface group p-6 rounded-lg transition-all hover:shadow-lg border-l-4 border-l-indigo-500">
                                <div className="flex items-start justify-between mb-5">
                                    <div className="student-icon-tile h-10 w-10 rounded-lg flex items-center justify-center bg-indigo-50 text-indigo-600">
                                        <Play size={18} weight="fill" />
                                    </div>
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 line-clamp-2 uppercase leading-tight mb-2 transition-colors">{exam.title}</h4>
                                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                                    <span>{exam.questions} Questions</span>
                                    <span className="text-indigo-600">{exam.category}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}


