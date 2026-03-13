import { Calendar, Play, Clock, Trophy, Sparkle, Fire, Medal, FileText, BookmarkSimple, List, CaretRight, ChartLineUp } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma/client";

export default async function StudentDashboardPage() {
    // ── Fetch real data ────────────────────────────────────────────────────────
    let userName = "Student";
    let userTarget = "Not Set";

    // Four cards stats
    let totalQuestionsAttempted = 0;
    let totalQuestionsAvailable = 100;
    let mcqProgressPct = 0;

    let totalStudyMinutes = 0;

    let practiceStreak = 0;
    let personalBestStreak = 0;

    let currentRank = 0;
    let percentile = 90;

    // Header level progress
    let levelProgressPct = 0;

    // Exam date
    let daysToExam = 0;

    // Updates
    let announcements: any[] = [];

    // Rankings
    let leaderboard: any[] = [];

    // Practice questions
    let topPracticeExams: any[] = [];

    try {
        const user = await getCurrentUser(["STUDENT", "ADMIN"]);
        if (!user) throw new Error("Unauthorized");
        userName = user.fullName?.split(" ")[0] ?? user.email?.split("@")[0] ?? "Student";
        userTarget = user.examTarget || "";

        // Logic for days remaining using examTarget (like "May 2026")
        if (userTarget) {
            const months = { "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5, "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11 };
            const parts = userTarget.split(" ");
            if (parts.length === 2 && parts[0].length >= 3) {
                const mo = parts[0].substring(0, 3);
                const yr = parseInt(parts[1]);
                if (months[mo as keyof typeof months] !== undefined && !isNaN(yr)) {
                    const targetDate = new Date(yr, months[mo as keyof typeof months], 1);
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
            practiceStreak = profile.streak;
            personalBestStreak = profile.longestStreak;

            // Calculate pseudo level progress (each level is 1000 XP)
            const currentLevelBaseline = (profile.level - 1) * 1000;
            const xpIntoLevel = profile.totalXP - currentLevelBaseline;
            levelProgressPct = Math.min(100, Math.round((xpIntoLevel / 1000) * 100));
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

        // Count total unique published questions to serve as "total MCQs" available
        totalQuestionsAvailable = await prisma.question.count();
        if (totalQuestionsAvailable < 100) totalQuestionsAvailable = 1000; // Provide a sensible denominator if DB is empty

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
            where: { status: "PUBLISHED" },
            take: 4,
            include: { _count: { select: { questions: true } }, attempts: { select: { id: true } } }
        });

        // Sort by attempt count manually since we couldn't do it cleanly in Prisma aggregate simply here
        const sortedExams = practiceExamsRaw.sort((a, b) => b.attempts.length - a.attempts.length);

        topPracticeExams = sortedExams.map(e => ({
            id: e.id,
            title: e.title,
            questions: e._count.questions,
            category: e.category || "General"
        }));

    } catch (e) {
        console.error("Dashboard error:", e);
    }

    const studyHoursLabel = totalStudyMinutes >= 60
        ? `${Math.floor(totalStudyMinutes / 60)}h ${totalStudyMinutes % 60}m`
        : `${totalStudyMinutes}m`;

    return (
        <div className="space-y-10 pb-20 w-full max-w-[1400px] mx-auto p-4 sm:p-6 md:p-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-[40px] font-black text-slate-900 tracking-tight leading-tight mb-2">
                        Welcome back, {userName}!
                    </h1>
                    <p className="text-slate-500 font-medium text-sm md:text-base">
                        You&apos;ve completed {levelProgressPct}% of your learning level. Keep going!
                    </p>
                </div>
                {daysToExam > 0 && (
                    <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-sm shadow-sm">
                        <Calendar size={20} weight="fill" className="text-indigo-500" />
                        Exam in {daysToExam} Days
                    </div>
                )}
            </div>

            {/* Top 4 Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* MCQ Progress */}
                <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-center min-h-[140px]">
                    <div className="flex items-start justify-between mb-4">
                        <span className="text-sm font-bold text-slate-500 flex items-center gap-1.5">
                            MCQ Progress
                        </span>
                        <ChartLineUp size={20} className="text-indigo-500" weight="bold" />
                    </div>
                    <div className="flex items-end gap-3">
                        <div className="text-3xl font-black text-slate-900 leading-none">{totalQuestionsAttempted.toLocaleString()}</div>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-xs font-medium text-slate-400">
                        <span>Attempted / {(totalQuestionsAvailable >= 1000 ? (totalQuestionsAvailable / 1000).toFixed(1) + 'k' : totalQuestionsAvailable)} total</span>
                        <span className="text-indigo-600 font-bold">{mcqProgressPct}%</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="absolute bottom-6 left-6 right-6 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(mcqProgressPct, 100)}%` }}></div>
                    </div>
                </div>

                {/* Total Study Time */}
                <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] relative min-h-[140px]">
                    <div className="flex items-start justify-between mb-4">
                        <span className="text-sm font-bold text-slate-500 flex items-center gap-1.5">
                            Total Study Time
                        </span>
                        <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center">
                            <Clock size={14} className="text-indigo-600" weight="fill" />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 leading-none mt-2">{studyHoursLabel}</div>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                        <ChartLineUp size={14} weight="bold" />
                        <span>Consistent learning</span>
                    </div>
                </div>

                {/* Practice Streak */}
                <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] relative overflow-hidden min-h-[140px]">
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03]">
                        <Fire size={120} weight="fill" />
                    </div>
                    <div className="flex items-start justify-between mb-4 relative z-10">
                        <span className="text-sm font-bold text-slate-500 flex items-center gap-1.5">
                            Practice Streak
                        </span>
                        <Fire size={20} className="text-orange-500" weight="fill" />
                    </div>
                    <div className="text-3xl font-black text-slate-900 leading-none mt-2 relative z-10">{practiceStreak} Days</div>
                    <div className="mt-4 text-xs font-medium text-slate-400 relative z-10">
                        Personal Best: {personalBestStreak} Days
                    </div>
                </div>

                {/* Current Ranking */}
                <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] relative border-l-[6px] border-l-indigo-500 min-h-[140px]">
                    <div className="flex items-start justify-between mb-4">
                        <span className="text-sm font-bold text-slate-500 flex items-center gap-1.5">
                            Current Ranking
                        </span>
                        <Medal size={20} className="text-indigo-500" weight="fill" />
                    </div>
                    <div className="text-3xl font-black text-slate-900 leading-none mt-2">Rank #{currentRank > 0 ? currentRank : '-'}</div>
                    <div className="mt-4 text-xs font-bold text-indigo-600">
                        {percentile}th Percentile
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Update Feeds */}
                <div className="lg:col-span-2 space-y-5">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <FileText size={24} className="text-indigo-500" weight="fill" />
                            Update Feeds
                        </h2>
                        <Link href="/student/updates" className="text-indigo-600 text-sm font-bold hover:underline">View All Updates</Link>
                    </div>

                    <div className="space-y-4">
                        {announcements.length === 0 ? (
                            <div className="p-8 bg-white rounded-3xl border border-slate-100 text-center shadow-sm">
                                <div className="inline-flex w-16 h-16 rounded-full bg-slate-50 items-center justify-center text-slate-300 mb-4">
                                    <FileText size={32} weight="fill" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-700">No updates yet</h3>
                                <p className="text-slate-500 text-sm mt-1">Check back later for important announcements from your educators.</p>
                            </div>
                        ) : (
                            announcements.map((feed, i) => (
                                <div key={feed.id} className="p-5 bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 shadow-sm transition-all flex gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-50 shrink-0 flex items-center justify-center border border-indigo-100/50">
                                        <FileText size={20} className="text-indigo-600" weight="fill" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                                                <span className="text-indigo-600">{feed.tag.substring(0, 15)}</span>
                                                <span>•</span>
                                                <span>{feed.date}</span>
                                            </div>
                                            {feed.type === "CRITICAL" && (
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-600 uppercase tracking-wider shrink-0">Critical</span>
                                            )}
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-900 mb-1.5 leading-tight truncate">
                                            {feed.title}
                                        </h3>
                                        <p className="text-xs font-medium text-slate-500 mb-3 line-clamp-2 leading-relaxed">
                                            {feed.description}
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-[11px] font-bold hover:bg-indigo-700 transition shadow-sm active:scale-95">
                                                <FileText size={14} />
                                                Read PDF
                                            </button>
                                            <button className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-md transition">
                                                <BookmarkSimple size={14} weight="bold" />
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column: Rankings */}
                <div className="space-y-5">
                    <div className="flex items-center gap-2 mb-2">
                        <Trophy size={24} className="text-indigo-500" weight="fill" />
                        <h2 className="text-xl font-bold text-slate-900">Rankings</h2>
                    </div>

                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                        {leaderboard.length === 0 ? (
                            <div className="py-12 text-center text-slate-400">
                                <Trophy size={48} className="mx-auto text-slate-200 mb-3" weight="fill" />
                                <p className="text-sm font-bold">No rankings available yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-0 relative">
                                {leaderboard.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between py-4 border-b border-slate-50/80 last:border-0 relative">
                                        <div className="flex items-center gap-4">
                                            <div className="text-sm font-bold w-6 text-center" style={{ color: item.rank === 1 ? '#f59e0b' : item.rank === 2 ? '#94a3b8' : item.rank === 3 ? '#b45309' : '#cbd5e1' }}>
                                                {item.rank}
                                            </div>
                                            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200 flex items-center justify-center">
                                                {/* Pseudo avatar */}
                                                <span className="font-bold text-slate-400 text-xs uppercase">{item.name.charAt(0)}</span>
                                            </div>
                                            <div>
                                                <div className={cn("text-sm font-bold leading-tight", item.isMe ? "text-slate-900" : "text-slate-700")}>
                                                    {item.name}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                                    Level {Math.floor(item.score / 1000) + 1}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-slate-900">{item.score.toLocaleString()}</div>
                                            <div className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5 font-bold">XP</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Link href="/student/leaderboard"
                            className="block w-full text-center py-3 mt-4 text-xs font-bold tracking-widest uppercase text-slate-500 hover:text-indigo-600 transition-colors bg-slate-50 rounded-xl hover:bg-indigo-50 border border-slate-100">
                            See Full Leaderboard
                        </Link>
                    </div>
                </div>
            </div>

            {/* Bottom Grid: Top Practice Questions */}
            <div className="pt-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-600 font-bold text-lg leading-none">?</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Top Practice Questions</h2>
                    </div>
                    <Link href="/student/exams" className="text-sm font-bold text-indigo-600 hover:underline flex items-center gap-1">
                        Practice More <CaretRight size={14} weight="bold" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {topPracticeExams.length === 0 ? (
                        <div className="lg:col-span-4 p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
                            No practice exams available right now.
                        </div>
                    ) : topPracticeExams.map((exam, i) => {
                        const iconColors = [
                            "bg-emerald-50 text-emerald-600",
                            "bg-purple-50 text-purple-600",
                            "bg-amber-50 text-amber-600",
                            "bg-rose-50 text-rose-600"
                        ];
                        const selColor = iconColors[i % iconColors.length];

                        return (
                            <Link href={`/exam/war-room?examId=${exam.id}`} key={exam.id}
                                className="p-4 bg-white rounded-[16px] border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all flex flex-col justify-between group cursor-pointer border-t-[3px] border-t-transparent hover:border-t-indigo-500 min-h-[110px]">
                                <div className="flex items-start justify-between mb-2">
                                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm", selColor)}>
                                        <List size={20} weight="fill" />
                                    </div>
                                    <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <CaretRight size={12} className="text-indigo-500" weight="bold" />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-slate-900 leading-tight mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                        {exam.title}
                                    </h4>
                                    <div className="text-[11px] text-slate-500 font-medium">
                                        {exam.questions} Questions • {exam.category}
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
