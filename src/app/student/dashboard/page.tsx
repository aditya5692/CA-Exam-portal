import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma/client";
import { resolveStudentCALevel } from "@/lib/student-level";
import { buildStudentVisibleExamWhere } from "@/lib/server/exam-publishing";
import { cn } from "@/lib/utils";
import { StudentPageHeader } from "@/components/student/shared/page-header";
import { BookOpen,ChartLineUp,Clock,FilePdf,FileText,List,Medal,Play,Sparkle,Target,Trophy } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export const dynamic = "force-dynamic";

type DashboardAnnouncement = {
    id: string;
    title: string;
    description: string;
    date: string;
    tag: string;
    type: string;
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

export default async function StudentDashboardPage() {
    // ── Fetch real data ────────────────────────────────────────────────────────
    let userName = "Student";
    let userTarget = "Not Set";

    // Four cards stats
    let totalQuestionsAttempted = 0;
    let totalQuestionsAvailable = 0;
    let mcqProgressPct = 0;

    let totalStudyMinutes = 0;

    let totalMCQScore = 0;
    let avgAccuracy = 0;

    let currentRank = 0;
    let percentile = 90;

    // Header level progress
    let levelProgressPct = 0;

    // Exam date
    let daysToExam = 0;

    // Updates
    let announcements: DashboardAnnouncement[] = [];

    // Rankings
    let leaderboard: DashboardLeaderboardEntry[] = [];

    // Practice questions
    let topPracticeExams: DashboardPracticeExam[] = [];

    // Free Resources
    let freeResources: DashboardResource[] = [];

    try {
        const user = await getCurrentUser(["STUDENT", "ADMIN"]);
        if (!user) throw new Error("Unauthorized");
        userName = user.fullName?.split(" ")[0] ?? user.email?.split("@")[0] ?? "Student";
        userTarget = user.examTarget || "";
        const visibleExamWhere = await buildStudentVisibleExamWhere(
            user.id,
            resolveStudentCALevel(user.examTarget, user.department),
        );

        // Logic for days remaining using examTarget (like "May 2026" or "CA Foundation May 2026")
        if (userTarget) {
            const months = { "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5, "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11 };
            const parts = userTarget.split(" ");
            // Look for the last two parts as Month and Year
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

        // Profile / Streaks / Ranks
        const profile = await prisma.studentLearningProfile.findUnique({
            where: { studentId: user.id }
        });

        if (profile) {
            totalMCQScore = profile.totalXP;
            avgAccuracy = profile.avgAccuracy;

            // Calculate level progress (each level uses formula: 50 * (level - 1)^2)
            const currentLevelBaseline = 50 * Math.pow(profile.level - 1, 2);
            const nextLevelBaseline = 50 * Math.pow(profile.level, 2);
            const xpIntoLevel = profile.totalXP - currentLevelBaseline;
            const xpRequiredForNext = nextLevelBaseline - currentLevelBaseline;
            levelProgressPct = Math.min(100, Math.round((xpIntoLevel / xpRequiredForNext) * 100));
        }

        // Ranking (calculate global rank based on totalXP)
        const allProfiles = await prisma.studentLearningProfile.findMany({
            select: { id: true, studentId: true, totalXP: true, student: { select: { fullName: true } } },
            orderBy: [
                { totalXP: 'desc' },
                { updatedAt: 'asc' } // Tie-breaker for stable ranking
            ]
        });

        const myRankIndex = allProfiles.findIndex(p => p.studentId === user.id);
        const totalProfiles = allProfiles.length;
        currentRank = myRankIndex !== -1 ? myRankIndex + 1 : 0;

        if (totalProfiles > 0 && currentRank > 0) {
            percentile = Math.round(((totalProfiles - currentRank) / totalProfiles) * 100);
            if (percentile === 0 && totalProfiles === 1) percentile = 100; // if only 1 user, they are top 100%
        } else {
            percentile = 0;
        }

        // Mini leaderboard: Top 3 plus User if User is not in top 3
        leaderboard = allProfiles.slice(0, 3).map((p, idx) => ({
            rank: idx + 1,
            name: p.studentId === user.id ? (p.student.fullName || "Student") + " (You)" : p.student.fullName || "Student",
            score: p.totalXP,
            isMe: p.studentId === user.id
        }));

        // Ensure user is in leaderboard view if they are lower down (show top 2 + me to keep it max 3)
        if (myRankIndex > 2) {
            const myProfile = allProfiles[myRankIndex];
            leaderboard = [
                ...leaderboard.slice(0, 2),
                {
                    rank: myRankIndex + 1,
                    name: (myProfile.student?.fullName || "Student") + " (You)",
                    score: myProfile.totalXP,
                    isMe: true
                }
            ];
        }

        // MCQ Progress
        const answersCount = await prisma.studentAnswer.count({
            where: { attempt: { studentId: user.id } }
        });
        totalQuestionsAttempted = answersCount;

        totalQuestionsAvailable = await prisma.examQuestion.count({
            where: { exam: visibleExamWhere },
        });

        if (totalQuestionsAvailable > 0) {
            mcqProgressPct = Math.round((totalQuestionsAttempted / totalQuestionsAvailable) * 100);
        }

        const allAttempts = await prisma.examAttempt.findMany({
            where: { studentId: user.id, status: "SUBMITTED", endTime: { not: null } },
            select: { startTime: true, endTime: true }
        });
        totalStudyMinutes = Math.round(allAttempts.reduce((s, a) => s + (a.endTime ? (new Date(a.endTime).getTime() - new Date(a.startTime).getTime()) / 60000 : 0), 0));

        // Announcements (Update Feeds) based on enrolled batches
        const enrollments = await prisma.enrollment.findMany({ where: { studentId: user.id }, select: { batchId: true } });
        const batchIds = enrollments.map(e => e.batchId);

        const rawAnnouncements = await prisma.announcement.findMany({
            where: { batchId: { in: batchIds } },
            include: { batch: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
            take: 3
        });

        announcements = rawAnnouncements.map(a => {
            const words = a.content.split(' ');
            const title = words.slice(0, 6).join(' ') + (words.length > 6 ? '...' : '');

            return {
                id: a.id,
                title: title || "New Announcement",
                description: a.content,
                date: new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                tag: a.batch.name,
                type: "NORMAL"
            };
        });

        // Top Practice Questions (Exams)
        const practiceExamsRaw = await prisma.exam.findMany({
            where: visibleExamWhere,
            orderBy: { createdAt: "desc" },
            take: 4,
            include: { _count: { select: { questions: true } }, attempts: { select: { id: true } } }
        });

        topPracticeExams = practiceExamsRaw.map(e => ({
            id: e.id,
            title: e.title,
            questions: e._count.questions,
            category: e.category || "General"
        }));

        // Fetch some free resources
        const freeResRaw = await prisma.studyMaterial.findMany({
            where: { isPublic: true },
            take: 4,
            orderBy: { createdAt: "desc" }
        });
        freeResources = freeResRaw.map(r => ({
            id: r.id,
            title: r.title,
            category: r.category,
            type: r.subType || "PDF"
        }));
    } catch (e) {
        console.error("Dashboard error:", e);
    }

    const studyHoursLabel = totalStudyMinutes >= 60
        ? `${Math.floor(totalStudyMinutes / 60)}h ${totalStudyMinutes % 60}m`
        : `${totalStudyMinutes}m`;

    return (
        <div className="space-y-8 pb-10 w-full max-w-[1400px] mx-auto font-outfit">
            <StudentPageHeader
                eyebrow="Student dashboard"
                title={`Welcome back, ${userName}.`}
                description={
                    <>
                        You have completed{" "}
                        <span className="font-bold text-[var(--student-accent-strong)]">{levelProgressPct}%</span>{" "}
                        of your current learning level.
                    </>
                }
                daysToExam={daysToExam}
            />

            {/* Top 4 Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-1 relative">
                {/* Decorative gradients for the row */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[rgba(242,227,192,0.18)] via-transparent to-[rgba(220,235,230,0.26)] blur-3xl" />

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
                        <span className="text-[var(--student-accent-strong)]">{mcqProgressPct}% Total Progress</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 overflow-hidden bg-[rgba(244,237,226,0.9)]">
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
                <div className="student-surface group relative flex min-h-[160px] flex-col justify-between overflow-hidden rounded-2xl p-8 transition-all duration-300 hover:border-[#cfe0d5] hover:shadow-[0_20px_36px_rgba(55,48,38,0.08)]">
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
                        {Math.round(avgAccuracy)}% Avg. Accuracy
                    </div>
                </div>

                {/* Current Ranking */}
                <div className="student-surface-dark group relative flex min-h-[160px] flex-col justify-between overflow-hidden rounded-2xl p-8 transition-all duration-300 hover:shadow-[0_28px_44px_rgba(24,31,34,0.18)]">
                    <div className="flex items-start justify-between relative z-10">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/45">
                            Global Rank
                        </span>
                        <div className="student-icon-tile-warm flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300">
                            <Medal size={20} weight="fill" />
                        </div>
                    </div>
                    <div className="relative z-10 mb-3 mt-2 font-outfit text-4xl font-bold leading-none tracking-tight text-white">#{currentRank > 0 ? currentRank : '-'} <span className="pl-1 text-xs font-bold uppercase tracking-widest text-white/40">RANK</span></div>
                    <div className="relative z-10 text-[10px] font-bold uppercase tracking-widest text-[var(--student-support)]">
                        TOP {Math.max(1, 100 - percentile)}% of Students
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid lg:grid-cols-3 gap-8 pt-4">
                {/* Left Column: Update Feeds */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="space-y-1">
                            <h2 className="flex items-center gap-3 font-outfit uppercase font-bold text-[var(--student-text)]">
                                <FileText size={20} className="text-[var(--student-muted)]" weight="bold" />
                                Latest Announcements
                            </h2>
                            <p className="pl-8 text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)]">Stay updated with the latest news</p>
                        </div>
                        <Link href="/student/updates" className="student-button-secondary rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-200 active:scale-95">View All</Link>
                    </div>

                    <div className="space-y-4">
                        {announcements.length === 0 ? (
                            <div className="student-surface rounded-2xl border-2 border-dashed p-12 text-center">
                                <FileText size={40} className="mx-auto mb-4 text-[var(--student-border-strong)] opacity-70" />
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
                                            <button className="student-button-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-200 active:scale-95">
                                                <Play size={14} weight="fill" />
                                                Read More
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column: Rankings */}
                <div className="space-y-6">
                    <div className="space-y-1 mb-2">
                        <h2 className="flex items-center gap-3 uppercase font-outfit font-bold text-[var(--student-text)]">
                            <Trophy size={20} className="text-[var(--student-muted)]" weight="bold" />
                            Peer Leaderboard
                        </h2>
                        <p className="pl-8 text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)]">Your standing among peers</p>
                    </div>

                    <div className="student-surface rounded-2xl p-5">
                        {leaderboard.length === 0 ? (
                            <div className="py-20 text-center text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)]/60">
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
                                                <div className={cn("text-[10px] font-bold uppercase tracking-widest", item.isMe ? "text-[rgba(220,235,230,0.74)]" : "text-[var(--student-muted)]")}>
                                                    LVL {Math.floor(1 + Math.sqrt(item.score / 50))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={cn("mb-0.5 font-outfit text-sm font-bold leading-tight tracking-tight", item.isMe ? "text-white" : "text-[var(--student-text)]")}>{item.score.toLocaleString()}</div>
                                            <div className={cn("text-[10px] font-bold uppercase tracking-widest", item.isMe ? "text-[rgba(220,235,230,0.74)]" : "text-[var(--student-accent-strong)]")}>Unit XP</div>
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
                        <div className="student-surface lg:col-span-4 rounded-2xl border-2 border-dashed p-12 text-center text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)]/60">
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
                        <div className="student-surface lg:col-span-4 rounded-2xl border-2 border-dashed p-12 text-center text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)]/60">
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
