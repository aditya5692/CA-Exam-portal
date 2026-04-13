import { getGlobalLeaderboard, getUserRank } from "@/actions/leaderboard-actions";
import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
import { getCurrentUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { Calendar, Crown, Lightbulb, Medal, Presentation, ShareNetwork, Star, Target, TrendUp, Trophy, UserCircle } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ReactNode } from "react";

type LeaderboardStudent = {
    rank: number;
    studentId: string;
    fullName: string;
    totalXP: number;
    level: number;
};

export const metadata = {
    title: "Global Leaderboard | Financly",
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

    const top1 = topStudents[0];
    const top2 = topStudents[1];
    const top3 = topStudents[2];
    const rest = topStudents.slice(3);

    return (
        <div className="student-theme flex min-h-screen flex-col bg-[var(--student-bg)] text-[var(--student-text)]">
            <Navbar user={user} />

            <main className="student-shell flex-grow px-6 pb-16 pt-28 sm:px-12">
                <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 lg:grid-cols-[1fr_320px]">
                    <div className="space-y-12">
                        <section className="student-surface rounded-lg px-7 py-8 md:px-9 md:py-9">
                            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--student-border)] bg-[var(--student-panel-solid)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--student-muted)]">
                                <Star size={12} weight="fill" className="text-[var(--student-support)]" />
                                Leaderboard
                            </div>
                            <h1 className="mt-4 max-w-3xl   text-4xl font-black leading-none tracking-[-0.05em] text-[var(--student-text)] md:text-5xl">
                                Global rankings shaped by
                                <span className="text-[var(--student-accent-strong)]"> steady practice</span>
                            </h1>
                            <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-[var(--student-muted)]">
                                A live view of students building momentum through mocks, revisions, and consistent work. The look is calmer now, but the competition stays intact.
                            </p>
                        </section>

                        {topStudents.length > 0 ? (
                            <div className="space-y-10">
                                <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                    {top2 && <ChampionCard student={top2} rank={2} variant="silver" />}
                                    {top1 && <ChampionCard student={top1} rank={1} variant="gold" featured />}
                                    {top3 && <ChampionCard student={top3} rank={3} variant="bronze" />}
                                </section>

                                {rest.length > 0 && (
                                    <section className="space-y-4">
                                        <div className="pl-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--student-muted)]">
                                            Full Rankings
                                        </div>
                                        <div className="student-surface overflow-hidden rounded-lg">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left">
                                                    <thead>
                                                        <tr className="border-b border-[var(--student-border)] bg-[var(--student-panel-muted)]/80">
                                                            <th className="w-24 px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--student-muted)]">Rank</th>
                                                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--student-muted)]">Student Name</th>
                                                            <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest text-[var(--student-muted)]">XP Points</th>
                                                            <th className="w-28 px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest text-[var(--student-muted)]">Level</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[var(--student-border)]/70">
                                                        {rest.map((student) => {
                                                            const isMe = student.studentId === user?.id;

                                                            return (
                                                                <tr
                                                                    key={student.studentId}
                                                                    className={cn(
                                                                        "transition-colors duration-300 hover:bg-[var(--student-panel-muted)]/60",
                                                                        isMe && "bg-[var(--student-accent-soft)]/70"
                                                                    )}
                                                                >
                                                                    <td className="px-6 py-4">
                                                                        <div
                                                                            className={cn(
                                                                                "flex h-9 w-9 items-center justify-center rounded-lg text-xs font-black",
                                                                                isMe
                                                                                    ? "bg-[var(--student-accent-strong)] text-white shadow-[0_14px_26px_rgba(31,92,80,0.18)]"
                                                                                    : "bg-[var(--student-panel-muted)] text-[var(--student-muted)]"
                                                                            )}
                                                                        >
                                                                            {student.rank}
                                                                        </div>
                                                                    </td>
                                                                    <td className="flex items-center gap-3 px-6 py-4 font-bold text-[var(--student-text)]">
                                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--student-border)] bg-[var(--student-panel-solid)] text-[var(--student-muted)]">
                                                                            <UserCircle size={20} weight="fill" />
                                                                        </div>
                                                                        <span className="truncate max-w-[150px] sm:max-w-none">{student.fullName}</span>
                                                                        {isMe && (
                                                                            <span className="rounded-full bg-[var(--student-support-soft)] px-2 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--student-support)]">
                                                                                You
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-right">
                                                                        <span className="font-mono font-black text-[var(--student-text)]">
                                                                            {student.totalXP.toLocaleString()}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-4 text-center">
                                                                        <span className="student-chip rounded-lg px-2.5 py-1.5 text-[10px] font-black uppercase tracking-tight">
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
                                    </section>
                                )}
                            </div>
                        ) : (
                            <div className="student-surface rounded-lg border-dashed py-20 text-center">
                                <Trophy size={48} weight="duotone" className="mx-auto mb-4 text-[var(--student-muted)]/45" />
                                <h2 className="text-xl font-black tracking-tight text-[var(--student-text)]">Leaderboard opening soon</h2>
                                <p className="mt-2 text-sm font-medium text-[var(--student-muted)]">
                                    Rankings refresh every hour. Start practicing to claim your spot.
                                </p>
                            </div>
                        )}
                    </div>

                    <aside className="space-y-6 pt-1">
                        {user && myRankData && !isTeacherOrAdmin && (
                            <div className="student-surface-dark relative overflow-hidden rounded-lg p-6 text-white">
                                <div className="absolute -right-14 -top-12 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(220,235,230,0.42),transparent_66%)]" />
                                <div className="relative z-10 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--student-accent-soft-strong)]">Personal Analysis</h3>
                                        <TrendUp size={20} weight="bold" className="text-[var(--student-accent-soft-strong)]" />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <div className="mb-1 text-[10px] font-bold uppercase text-white/55">Global Standing</div>
                                                <div className="text-4xl font-black tracking-tighter">#{myRankData.rank}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="mb-1 text-[10px] font-bold uppercase text-white/55">Percentile</div>
                                                <div className="text-xl font-black text-[var(--student-support)]">Top {100 - myRankData.percentile}%</div>
                                            </div>
                                        </div>

                                        <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
                                            <div className="flex items-center justify-between text-[10px] font-black uppercase text-white/55">
                                                <span>Level Milestone</span>
                                                <span>Lvl {myRankData.level} to {myRankData.level + 1}</span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                                <div className="h-full rounded-full bg-gradient-to-r from-[var(--student-accent-soft-strong)] to-[var(--student-support)]" style={{ width: "65%" }} />
                                            </div>
                                            <p className="text-[10px] font-medium text-white/60">
                                                About {Math.round((myRankData.level + 1) * 250 - myRankData.totalXP % 500)} XP to the next level.
                                            </p>
                                        </div>
                                    </div>

                                    <button className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--student-accent-strong)] text-xs font-black uppercase tracking-widest transition-all hover:bg-[var(--student-accent)]">
                                        <ShareNetwork size={18} weight="bold" />
                                        Share My Rank
                                    </button>
                                </div>
                            </div>
                        )}

                        {isTeacherOrAdmin && (
                            <div className="student-surface-dark relative overflow-hidden rounded-lg p-6 text-white">
                                <div className="absolute -right-16 -top-14 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(242,227,192,0.28),transparent_66%)]" />
                                <div className="relative z-10 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--student-support)]">Teacher Insights</h3>
                                        <Presentation size={20} weight="bold" className="text-[var(--student-support)]" />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <div className="mb-1 text-[10px] font-bold uppercase text-white/55">Top Batch Avg</div>
                                                <div className="text-3xl font-black tracking-tighter">1,240 XP</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="mb-1 text-[10px] font-bold uppercase text-white/55">Growth</div>
                                                <div className="text-xl font-black text-[var(--student-accent-soft-strong)]">+12%</div>
                                            </div>
                                        </div>

                                        <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-[11px] font-medium text-white/75">
                                            Your students are most active on mock exams during weekend evenings from 6 PM to 9 PM.
                                        </p>
                                    </div>

                                    <Link
                                        href="/teacher/dashboard"
                                        className="flex h-12 w-full items-center justify-center rounded-lg border border-white/15 bg-white/10 text-xs font-black uppercase tracking-widest transition-all hover:bg-white/20"
                                    >
                                        View All Batches
                                    </Link>
                                </div>
                            </div>
                        )}

                        <div className="student-surface rounded-lg p-6">
                            <div className="flex items-center gap-3">
                                <div className="student-icon-tile-warm flex h-10 w-10 items-center justify-center rounded-lg">
                                    <Lightbulb size={22} weight="fill" />
                                </div>
                                <h3 className="font-black tracking-tight text-[var(--student-text)]">Success Tips</h3>
                            </div>

                            <div className="mt-6 space-y-4">
                                <SuggestionItem
                                    icon={<Target size={14} weight="bold" />}
                                    title={isTeacherOrAdmin ? "Encourage Retrieval" : "Accuracy First"}
                                    desc={isTeacherOrAdmin ? "Remind students that regular mock practice pushes rank movement more than passive reading." : "Correct answers in mock exams provide stronger XP movement than rushed attempts."}
                                />
                                <SuggestionItem
                                    icon={<Calendar size={14} weight="bold" />}
                                    title="Consistency Wins"
                                    desc="A five-day study streak still compounds faster than sporadic long sessions."
                                />
                                <SuggestionItem
                                    icon={<Presentation size={14} weight="bold" />}
                                    title="Peer Learning"
                                    desc="Benchmarking against top performers helps reveal whether the gap is speed, coverage, or accuracy."
                                />
                            </div>

                            <Link
                                href={isTeacherOrAdmin ? "/teacher/dashboard" : "/student/dashboard"}
                                className="student-button-secondary mt-6 flex h-11 w-full items-center justify-center rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                            >
                                Go to Dashboard
                            </Link>
                        </div>
                    </aside>
                </div>
            </main>

            <Footer />
        </div>
    );
}

function ChampionCard({
    student,
    rank,
    variant,
    featured = false
}: {
    student: LeaderboardStudent;
    rank: number;
    variant: "gold" | "silver" | "bronze";
    featured?: boolean;
}) {
    const config = {
        gold: {
            border: "border-[var(--student-support-soft-strong)]",
            halo: "shadow-[0_0_46px_-18px_rgba(183,121,31,0.34)]",
            icon: Trophy,
            iconColor: "text-[var(--student-support)]",
            badgeBg: "bg-[var(--student-support)]",
            tileBg: "bg-[var(--student-support-soft)]",
            title: "Scholar Gold"
        },
        silver: {
            border: "border-[#d8ddd9]",
            halo: "shadow-[0_0_46px_-18px_rgba(102,115,112,0.26)]",
            icon: Medal,
            iconColor: "text-[var(--student-muted-strong)]",
            badgeBg: "bg-[var(--student-muted-strong)]",
            tileBg: "bg-[var(--student-panel-muted)]",
            title: "Scholar Silver"
        },
        bronze: {
            border: "border-[var(--student-border-strong)]",
            halo: "shadow-[0_0_46px_-18px_rgba(183,121,31,0.28)]",
            icon: Medal,
            iconColor: "text-[var(--student-support)]",
            badgeBg: "bg-[var(--student-support)]",
            tileBg: "bg-[var(--student-support-soft)]",
            title: "Scholar Bronze"
        }
    } as const;

    const style = config[variant];
    const Icon = style.icon;

    return (
        <div
            className={cn(
                "student-surface relative rounded-lg p-6 transition-all duration-700",
                style.border,
                style.halo,
                featured && "md:-mt-2 md:scale-105 ring-4 ring-[var(--student-support-soft)]/60"
            )}
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className={cn("rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white", style.badgeBg)}>
                        Rank #{rank}
                    </div>
                    {featured && <Crown size={22} weight="fill" className="text-[var(--student-support)]" />}
                </div>

                <div className="flex flex-col items-center space-y-3 text-center">
                    <div className={cn("flex h-20 w-20 items-center justify-center rounded-lg shadow-inner", style.tileBg)}>
                        <Icon size={46} weight="duotone" className={style.iconColor} />
                    </div>
                    <div>
                        <h4 className="max-w-[160px] truncate text-xl font-black tracking-tight text-[var(--student-text)]">{student.fullName}</h4>
                        <div className="text-[9px] font-black uppercase tracking-widest text-[var(--student-muted)]">{style.title}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-lg border border-[var(--student-border)] bg-[var(--student-panel-muted)] p-3">
                        <div className="mb-1 text-[8px] font-black uppercase tracking-widest text-[var(--student-muted)]">Total XP</div>
                        <div className="font-mono text-base font-black tracking-tighter text-[var(--student-text)]">
                            {student.totalXP.toLocaleString()}
                        </div>
                    </div>
                    <div className="rounded-lg border border-[var(--student-border)] bg-[var(--student-panel-muted)] p-3">
                        <div className="mb-1 text-[8px] font-black uppercase tracking-widest text-[var(--student-muted)]">Level</div>
                        <div className="text-base font-black text-[var(--student-text)]">Lvl {student.level}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SuggestionItem({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
    return (
        <div className="rounded-lg p-3 transition-colors hover:bg-[var(--student-panel-muted)]/70">
            <div className="flex gap-4">
                <div className="student-icon-tile flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                    {icon}
                </div>
                <div className="space-y-1">
                    <h4 className="text-xs font-black uppercase tracking-wide text-[var(--student-text)]">{title}</h4>
                    <p className="text-[11px] font-medium leading-normal text-[var(--student-muted)]">{desc}</p>
                </div>
            </div>
        </div>
    );
}
