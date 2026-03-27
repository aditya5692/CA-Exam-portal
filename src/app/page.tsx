import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
import { cn } from "@/lib/utils";
import { Testimonials } from "@/components/common/testimonials";
import { getSessionPayload } from "@/lib/auth/session";
import {
    CaretRight,
    ChalkboardTeacher,
    ChartLineUp,
    CheckCircle,
    Exam,
    GraduationCap,
    Play,
    ShieldCheck,
    Sparkle,
    Timer
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";

const FEATURE_CARDS = [
    {
        title: "Exam-grade simulation",
        description: "Timed practice, answer discipline, and review cues designed around the pace students actually need.",
        icon: Exam,
        color: "blue"
    },
    {
        title: "Mentor-led clarity",
        description: "Teachers can publish updates, materials, and focused interventions without a cluttered handoff between tools.",
        icon: ChalkboardTeacher,
        color: "emerald"
    },
    {
        title: "Progress with context",
        description: "Analytics stay useful because they are tied to chapters, attempts, and revision decisions instead of vanity charts.",
        icon: ChartLineUp,
        color: "indigo"
    }
];

export default async function Home() {
    const session = await getSessionPayload();

    if (session) {
        if (session.role === "ADMIN") redirect("/admin/dashboard");
        if (session.role === "TEACHER") redirect("/teacher/dashboard");
        redirect("/student/dashboard");
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
            <Navbar user={session} />

            <div className="pt-20">
                <div className="bg-slate-900 px-6 py-3 text-white sm:px-12 border-b border-white/5">
                    <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-3">
                            <Sparkle size={16} weight="fill" className="text-emerald-400" />
                            <p className="text-sm font-medium text-slate-300">
                                <span className="font-bold text-white">May 2026 Cycle:</span> Mocks, PYQs, and revision material in one workspace.
                            </p>
                        </div>
                        <Link
                            href="/pricing"
                            className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-white hover:text-emerald-400 transition-colors"
                        >
                            View Plans
                            <CaretRight size={14} weight="bold" />
                        </Link>
                    </div>
                </div>
            </div>

            <main>
                <section className="px-6 pb-20 pt-16 sm:px-12 sm:pb-24 sm:pt-20 bg-white">
                    <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-bold text-slate-600">
                                <ShieldCheck size={16} weight="bold" className="text-emerald-500" />
                                Built for disciplined CA prep
                            </div>

                            <div className="space-y-6">
                                <h1 className="max-w-3xl font-outfit text-5xl font-bold leading-tight tracking-tight text-slate-900 md:text-7xl">
                                    A calmer workspace for
                                    <span className="text-indigo-600 block sm:inline"> serious CA preparation</span>
                                </h1>
                                <p className="max-w-2xl text-lg font-medium leading-relaxed text-slate-600 sm:text-xl">
                                    Run mocks, revisit weak chapters, sort past papers, and stay aligned with your next attempt without bouncing between disconnected tools.
                                </p>
                            </div>

                            <div className="flex flex-col gap-4 sm:flex-row pt-4">
                                <Link
                                    href="/student/exams"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-8 py-4 text-base font-bold text-white shadow-lg shadow-slate-900/10 transition-all hover:bg-slate-800 active:scale-95"
                                >
                                    Enter Mock Exams
                                    <Play size={18} weight="fill" />
                                </Link>
                                <Link
                                    href="/pricing"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-8 py-4 text-base font-bold text-slate-900 transition-all hover:bg-slate-50 active:scale-95"
                                >
                                    Explore Pass Pro
                                </Link>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3 pt-6">
                                {[
                                    { value: "18k+", label: "Practice papers" },
                                    { value: "Full-Stack", label: "Review depth" },
                                    { value: "Unified", label: "One Workspace" }
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="rounded-xl border border-slate-100 bg-slate-50/50 p-6"
                                    >
                                        <div className="font-outfit text-2xl font-bold tracking-tight text-slate-900">{item.value}</div>
                                        <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">{item.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                                <div className="rounded-xl bg-slate-900 p-8 text-white">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Control deck</div>
                                            <h2 className="mt-2 font-outfit text-2xl font-bold tracking-tight text-white leading-tight">
                                                Everything you need to keep pace with the next paper
                                            </h2>
                                        </div>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-emerald-400">
                                            <GraduationCap size={20} weight="bold" />
                                        </div>
                                    </div>

                                    <div className="mt-8 space-y-4">
                                        <div className="rounded-lg bg-white/5 p-5 border border-white/5">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                                                    <Timer size={20} weight="bold" />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-bold uppercase text-white/40">Today's Goal</div>
                                                    <div className="text-base font-bold text-white">3-hour mock window</div>
                                                </div>
                                            </div>
                                            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                                                <div className="h-full w-[72%] rounded-full bg-emerald-500" />
                                            </div>
                                        </div>

                                        <div className="rounded-lg bg-white/5 p-5 border border-white/5">
                                            <div className="flex items-center gap-4 text-sm font-medium text-white/70">
                                                <div className="h-2 w-2 rounded-full bg-indigo-500" />
                                                <span>Revision stack prepared for Accounts, Law, and Taxation.</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-end">
                                        <Link
                                            href="/student/analytics"
                                            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors"
                                        >
                                            See analytics
                                            <CaretRight size={16} weight="bold" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="px-6 pb-24 pt-16 sm:px-12 bg-slate-50">
                    <div className="mx-auto max-w-7xl">
                        <div className="mb-12 text-center space-y-4">
                            <h2 className="font-outfit text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                                Built for focus, not just features
                            </h2>
                            <p className="max-w-2xl mx-auto text-base font-medium text-slate-500 leading-relaxed">
                                Our platform is designed to reduce noise. The value comes from repeatability, clarity, and cleaner transitions between study tasks.
                            </p>
                        </div>

                        <div className="grid gap-8 lg:grid-cols-3">
                            {FEATURE_CARDS.map((feature) => (
                                <div
                                    key={feature.title}
                                    className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
                                >
                                    <div className={cn(
                                        "mb-6 flex h-12 w-12 items-center justify-center rounded-xl",
                                        feature.color === "blue" ? "bg-blue-50 text-blue-600" :
                                        feature.color === "emerald" ? "bg-emerald-50 text-emerald-600" :
                                        "bg-indigo-50 text-indigo-600"
                                    )}>
                                        <feature.icon size={24} weight="bold" />
                                    </div>
                                    <h3 className="font-outfit text-xl font-bold tracking-tight text-slate-900">
                                        {feature.title}
                                    </h3>
                                    <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
                                        {feature.description}
                                    </p>
                                    <Link
                                        href="/pricing"
                                        className="mt-6 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors"
                                    >
                                        Learn more
                                        <CaretRight size={14} weight="bold" />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <Testimonials />

                <section className="px-6 py-24 sm:px-12 bg-white">
                    <div className="mx-auto max-w-6xl rounded-2xl bg-slate-900 p-10 text-white sm:p-16 shadow-2xl">
                        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-white/80">
                                    <CheckCircle size={16} weight="bold" className="text-emerald-400" />
                                    Start with the basics, scale when needed
                                </div>
                                <h2 className="max-w-3xl font-outfit text-4xl font-bold tracking-tight text-white md:text-5xl leading-tight">
                                    Build momentum first. Upgrade only when you need it.
                                </h2>
                                <p className="max-w-2xl text-lg font-medium text-white/60">
                                    Use the core workspace for mock practice and revision, then move into premium analytics when your preparation actually needs it.
                                </p>
                            </div>

                            <div className="flex flex-col gap-4 min-w-[240px]">
                                <Link
                                    href="/auth/signup"
                                    className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-8 py-4 text-base font-bold text-slate-900 transition-all hover:bg-emerald-400 active:scale-95 shadow-xl shadow-emerald-500/20"
                                >
                                    Create free account
                                </Link>
                                <Link
                                    href="/pricing"
                                    className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-base font-bold text-white transition-all hover:bg-white/10 active:scale-95"
                                >
                                    Compare plans
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
