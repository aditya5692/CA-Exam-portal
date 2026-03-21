import { Calendar, Play, Clock, Trophy, Sparkle, Fire, Medal, FileText, BookmarkSimple, List, CaretRight, ChartLineUp, BookOpen, FilePdf, Target } from "@phosphor-icons/react/dist/ssr";
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

    let totalMCQScore = 0;
    let avgAccuracy = 0;

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

    // Free Resources
    let freeResources: any[] = [];

    try {
        const user = await getCurrentUser(["STUDENT", "ADMIN"]);
        if (!user) throw new Error("Unauthorized");
        userName = user.fullName?.split(" ")[0] ?? user.email?.split("@")[0] ?? "Student";
        userTarget = user.examTarget || "";

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
            totalMCQScore = profile.totalCorrect;
            avgAccuracy = profile.avgAccuracy;

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
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.2)]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Student Dashboard</span>
                    </div>
                    <h1 className="font-outfit tracking-tighter leading-tight">
                        Welcome back, {userName}.
                    </h1>
                    <p className="text-slate-500 font-medium text-base font-sans max-w-2xl leading-relaxed">
                        You have completed <span className="text-indigo-600 font-bold">{levelProgressPct}%</span> of your current learning level.
                    </p>
                </div>
                {daysToExam > 0 && (
                    <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-900/5 hover:bg-slate-800 transition-all active:scale-95 shrink-0 mb-1">
                        <Calendar size={18} weight="bold" className="text-indigo-400" />
                        Next Milestone: {daysToExam} Days
                    </div>
                )}
            </div>

            {/* Top 4 Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-1 relative">
                {/* Decorative gradients for the row */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/20 via-transparent to-purple-50/20 blur-3xl -z-10" />

                {/* MCQ Progress */}
                <div className="bg-white/80 backdrop-blur-md border border-slate-100 shadow-sm rounded-2xl relative overflow-hidden flex flex-col justify-center min-h-[160px] transition-all duration-300 hover:shadow-md hover:border-indigo-100/50 group">
                    <div className="flex items-start justify-between mb-6 px-8 pt-8">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-outfit">
                            Practice Coverage
                        </span>
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center transition-all duration-300 group-hover:bg-indigo-600 group-hover:text-white shadow-sm border border-slate-100">
                            <ChartLineUp size={20} weight="bold" />
                        </div>
                    </div>
                    <div className="flex items-end gap-2 mb-3 px-8">
                        <div className="text-4xl font-bold text-slate-900 leading-none tracking-tight font-outfit">{totalQuestionsAttempted.toLocaleString()}</div>
                    </div>
                    <div className="flex items-center justify-between mt-3 px-8 pb-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-outfit">
                        <span className="text-indigo-600/80">{mcqProgressPct}% Total Progress</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-50 overflow-hidden">
                        <div className="h-full bg-indigo-500 transition-all duration-1000 ease-out" style={{ width: `${Math.min(mcqProgressPct, 100)}%` }}></div>
                    </div>
                </div>

                {/* Total Study Time */}
                <div className="bg-white/80 backdrop-blur-md border border-slate-100 shadow-sm rounded-2xl p-8 relative min-h-[160px] transition-all duration-300 hover:shadow-md hover:border-amber-100/50 group flex flex-col justify-between">
                    <div className="flex items-start justify-between mb-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-outfit">
                            Total Study Time
                        </span>
                        <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center transition-all duration-300 group-hover:bg-amber-500 group-hover:text-white shadow-sm border border-slate-100">
                            <Clock size={20} weight="bold" />
                        </div>
                    </div>
                    <div className="text-4xl font-bold text-slate-900 leading-none mt-2 tracking-tight font-outfit mb-3">{studyHoursLabel}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-outfit">
                        Focused Learning
                    </div>
                </div>

                {/* Total MCQ Score */}
                <div className="bg-white/80 backdrop-blur-md border border-slate-100 shadow-sm rounded-2xl p-8 relative overflow-hidden min-h-[160px] transition-all duration-300 hover:shadow-md hover:border-emerald-100/50 group flex flex-col justify-between">
                    <div className="flex items-start justify-between mb-4 relative z-10">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-outfit">
                            Points Earned
                        </span>
                        <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center transition-all duration-300 group-hover:bg-emerald-500 group-hover:text-white shadow-sm border border-slate-100">
                            <Target size={20} weight="bold" />
                        </div>
                    </div>
                    <div className="text-4xl font-bold text-slate-900 leading-none mt-2 relative z-10 tracking-tight font-outfit mb-3">{totalMCQScore.toLocaleString()} <span className="text-sm text-slate-400 font-bold tracking-tight">XP</span></div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-outfit">
                        {Math.round(avgAccuracy)}% Avg. Accuracy
                    </div>
                </div>

                {/* Current Ranking */}
                <div className="bg-slate-900 border border-slate-800 shadow-md rounded-2xl p-8 relative min-h-[160px] transition-all duration-300 hover:shadow-lg group overflow-hidden flex flex-col justify-between">
                    <div className="flex items-start justify-between relative z-10">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-outfit">
                            Global Rank
                        </span>
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-300 group-hover:bg-amber-500 group-hover:text-slate-950">
                            <Medal size={20} className="text-amber-500/80 group-hover:text-inherit" weight="bold" />
                        </div>
                    </div>
                    <div className="text-4xl font-bold text-white leading-none mt-2 tracking-tight relative z-10 font-outfit mb-3">#{currentRank > 0 ? currentRank : '-'} <span className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">RANK</span></div>
                    <div className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest font-outfit relative z-10">
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
                            <h2 className="flex items-center gap-3 font-outfit uppercase">
                                <FileText size={20} className="text-slate-400" weight="bold" />
                                Latest Announcements
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-8">Stay updated with the latest news</p>
                        </div>
                        <Link href="/student/updates" className="px-4 py-2 rounded-xl bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-950 hover:text-white transition-all duration-200 border border-slate-100 active:scale-95 shadow-sm">View All</Link>
                    </div>

                    <div className="space-y-4">
                        {announcements.length === 0 ? (
                            <div className="p-12 bg-white rounded-2xl border border-slate-100 text-center shadow-sm border-dashed border-2">
                                <FileText size={40} className="mx-auto text-slate-200 mb-4 opacity-50" />
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No active announcements</h3>
                            </div>
                        ) : (
                            announcements.map((feed) => (
                                <div key={feed.id} className="p-6 bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all duration-300 flex gap-5 group relative overflow-hidden">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 shrink-0 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm border border-slate-100">
                                        <FileText size={20} weight="bold" />
                                    </div>
                                    <div className="flex-1 min-w-0 relative z-10">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                <span className="text-indigo-600/80">{feed.tag}</span> <span className="px-2 opacity-30">/</span> {feed.date}
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight font-outfit tracking-tight group-hover:text-indigo-600 transition-colors">
                                            {feed.title}
                                        </h3>
                                        <p className="text-sm font-medium text-slate-500 mb-5 line-clamp-1 opacity-80 font-sans max-w-xl">
                                            {feed.description}
                                        </p>
                                        <div className="flex items-center gap-4">
                                            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-600 active:scale-95 transition-all duration-200">
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
                        <h2 className="flex items-center gap-3 uppercase font-outfit">
                            <Trophy size={20} className="text-slate-400" weight="bold" />
                            Peer Leaderboard
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-8">Your standing among peers</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        {leaderboard.length === 0 ? (
                            <div className="py-20 text-center text-slate-300 uppercase tracking-widest text-[10px] font-bold">
                                No Peer Data
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {leaderboard.map((item, i) => (
                                    <div key={i} className={cn(
                                        "flex items-center justify-between p-4 rounded-2xl transition-all duration-300",
                                        item.isMe ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" : "hover:bg-slate-50"
                                    )}>
                                        <div className="flex items-center gap-4">
                                            <div className={cn("text-xs font-bold w-5 text-center", item.isMe ? "text-indigo-200" : "text-slate-400")}>
                                                {item.rank}
                                            </div>
                                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold uppercase shadow-sm border",
                                                item.isMe ? "bg-white/10 border-white/10 text-white" : "bg-white border-slate-100 text-slate-400")}>
                                                {item.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className={cn("text-sm font-bold tracking-tight font-outfit leading-tight mb-0.5", item.isMe ? "text-white" : "text-slate-900")}>
                                                    {item.name}
                                                </div>
                                                <div className={cn("text-[10px] font-bold uppercase tracking-widest", item.isMe ? "text-indigo-200/70" : "text-slate-400")}>
                                                    LVL {Math.floor(item.score / 1000) + 1}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={cn("text-sm font-bold tracking-tight font-outfit leading-tight mb-0.5", item.isMe ? "text-white" : "text-slate-900")}>{item.score.toLocaleString()}</div>
                                            <div className={cn("text-[10px] font-bold uppercase tracking-widest", item.isMe ? "text-indigo-200/70" : "text-indigo-500")}>Unit XP</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Link href="/leaderboard"
                            className="block w-full text-center py-3.5 mt-6 text-[10px] font-bold tracking-widest uppercase text-slate-400 hover:text-slate-950 transition-all border border-slate-100 rounded-xl hover:bg-slate-50 active:scale-[0.98]">
                            View Detailed Ranking
                        </Link>
                    </div>
                </div>
            </div>

            {/* Free Resource Library Section */}
            <div className="pt-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="space-y-1">
                        <h2 className="flex items-center gap-3 uppercase font-outfit">
                            <BookOpen size={20} className="text-slate-400" weight="bold" />
                            Free Resources
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-8">Helpful study materials</p>
                    </div>
                    <Link href="/student/free-resources" className="px-5 py-2.5 rounded-xl bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-950 hover:text-white transition-all duration-200 border border-slate-100 shadow-sm active:scale-95">Explore All</Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {freeResources.length === 0 ? (
                        <div className="lg:col-span-4 p-12 text-center text-slate-300 bg-white rounded-2xl border-2 border-slate-100 border-dashed uppercase tracking-widest text-[10px] font-bold shadow-sm">
                            No resources available yet
                        </div>
                    ) : freeResources.map((res) => (
                        <Link href="/student/free-resources" key={res.id}
                            className="p-6 bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all duration-300 flex flex-col justify-between group cursor-pointer min-h-[140px] relative overflow-hidden">
                            <div className="flex items-start justify-between mb-4 relative z-10">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                    <FilePdf size={18} weight="bold" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100/50">
                                    {res.type}
                                </span>
                            </div>
                            <div className="z-10 relative">
                                <h4 className="font-bold text-base text-slate-900 leading-tight mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors tracking-tight font-outfit">
                                    {res.title}
                                </h4>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
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
                        <h2 className="flex items-center gap-3 uppercase font-outfit">
                            <Sparkle size={20} className="text-slate-400" weight="bold" />
                            Recommended Exams
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-8">Top practice modules for you</p>
                    </div>
                    <Link href="/student/exams" className="px-5 py-2.5 rounded-xl bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-950 hover:text-white transition-all duration-200 border border-slate-100 active:scale-95 shadow-sm">View More</Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {topPracticeExams.length === 0 ? (
                        <div className="lg:col-span-4 p-12 text-center text-slate-300 bg-white rounded-2xl border-2 border-slate-100 border-dashed uppercase tracking-widest text-[10px] font-bold shadow-sm">
                            No exams available yet
                        </div>
                    ) : topPracticeExams.map((exam, i) => {
                        return (
                            <Link href={`/exam/war-room?examId=${exam.id}`} key={exam.id}
                                className="p-6 bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all duration-300 flex flex-col justify-between group cursor-pointer min-h-[140px] relative overflow-hidden">
                                <div className="flex items-start justify-between mb-4 relative z-10">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                        <List size={18} weight="bold" />
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                </div>
                                <div className="z-10 relative">
                                    <h4 className="font-bold text-base text-slate-900 leading-tight mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors tracking-tight font-outfit">
                                        {exam.title}
                                    </h4>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                        <span>{exam.questions} Questions</span>
                                        <span className="opacity-30">•</span>
                                        <span className="text-slate-500/80">{exam.category}</span>
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
