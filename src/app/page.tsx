import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
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
        tone: "accent"
    },
    {
        title: "Mentor-led clarity",
        description: "Teachers can publish updates, materials, and focused interventions without a cluttered handoff between tools.",
        icon: ChalkboardTeacher,
        tone: "warm"
    },
    {
        title: "Progress with context",
        description: "Analytics stay useful because they are tied to chapters, attempts, and revision decisions instead of vanity charts.",
        icon: ChartLineUp,
        tone: "success"
    }
];

const FEATURE_TONES = {
    accent: {
        panel: "bg-[#dcebe6] text-[#1f5c50] border-[#c5ddd5]",
        link: "text-[#1f5c50]"
    },
    warm: {
        panel: "bg-[#f2e3c0] text-[#b7791f] border-[#e5d2a3]",
        link: "text-[#b7791f]"
    },
    success: {
        panel: "bg-[#e5f0e9] text-[#2f7d55] border-[#cfe0d5]",
        link: "text-[#2f7d55]"
    }
} as const;

export default async function Home() {
    const session = await getSessionPayload();

    if (session) {
        if (session.role === "ADMIN") redirect("/admin/dashboard");
        if (session.role === "TEACHER") redirect("/teacher/dashboard");
        redirect("/student/dashboard");
    }

    return (
        <div className="min-h-screen bg-[#f5efe5] text-[#1f2b2f] selection:bg-[#dcebe6] selection:text-[#1f5c50]">
            <Navbar user={session} />

            <div className="pt-24 sm:pt-28">
                <div className="border-y border-[#314148] bg-[#223036] px-6 py-4 text-[#fff8f0] sm:px-12">
                    <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                                <Sparkle size={16} weight="fill" className="text-[#f2e3c0]" />
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d9e8e3]">Preparation window</div>
                                <div className="text-sm font-semibold text-white">Mocks, PYQs, and revision material in one workspace for the May 2026 cycle.</div>
                            </div>
                        </div>
                        <Link
                            href="/pricing"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-all hover:bg-white/15"
                        >
                            View Plans
                            <CaretRight size={14} weight="bold" />
                        </Link>
                    </div>
                </div>
            </div>

            <main>
                <section className="relative overflow-hidden px-6 pb-24 pt-16 sm:px-12 sm:pb-28 sm:pt-20">
                    <div className="absolute left-[-12rem] top-[-8rem] h-80 w-80 rounded-full bg-[#f2e3c0] blur-3xl opacity-70" />
                    <div className="absolute right-[-10rem] top-10 h-96 w-96 rounded-full bg-[#dcebe6] blur-3xl opacity-70" />

                    <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 rounded-full border border-[#d7c5a9] bg-[rgba(255,253,249,0.82)] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#4f5b58] shadow-[0_10px_20px_rgba(55,48,38,0.05)]">
                                <ShieldCheck size={14} weight="bold" className="text-[#1f5c50]" />
                                Built for disciplined CA prep
                            </div>

                            <div className="space-y-5">
                                <h1 className="max-w-3xl font-outfit text-5xl font-black leading-[0.95] tracking-[-0.05em] text-[#1f2b2f] md:text-7xl">
                                    A calmer workspace for
                                    <span className="text-[#1f5c50]"> serious CA preparation</span>
                                </h1>
                                <p className="max-w-2xl text-lg font-medium leading-relaxed text-[#667370] sm:text-xl">
                                    Run mocks, revisit weak chapters, sort past papers, and stay aligned with your next attempt without bouncing between disconnected tools.
                                </p>
                            </div>

                            <div className="flex flex-col gap-4 sm:flex-row">
                                <Link
                                    href="/student/exams"
                                    className="inline-flex items-center justify-center gap-3 rounded-2xl border border-[#1f5c50] bg-[#1f5c50] px-7 py-4 text-base font-bold text-white shadow-[0_16px_34px_rgba(31,92,80,0.16)] transition-all hover:bg-[#18493f] active:scale-95"
                                >
                                    Enter Mock Exams
                                    <Play size={18} weight="fill" />
                                </Link>
                                <Link
                                    href="/pricing"
                                    className="inline-flex items-center justify-center gap-3 rounded-2xl border border-[#d7c5a9] bg-[rgba(255,253,249,0.86)] px-7 py-4 text-base font-bold text-[#1f2b2f] shadow-[0_10px_22px_rgba(55,48,38,0.05)] transition-all hover:bg-white active:scale-95"
                                >
                                    Explore Pass Pro
                                </Link>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                {[
                                    { value: "18,000+", label: "Practice papers" },
                                    { value: "Topic-wise", label: "Review depth" },
                                    { value: "3 roles", label: "Student, teacher, admin" }
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="rounded-[26px] border border-[#e6dccd] bg-[rgba(255,253,249,0.84)] px-5 py-6 shadow-[0_14px_32px_rgba(55,48,38,0.05)]"
                                    >
                                        <div className="font-outfit text-3xl font-black tracking-tight text-[#1f2b2f]">{item.value}</div>
                                        <div className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#667370]">{item.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="rounded-[40px] border border-[#e6dccd] bg-[rgba(255,253,249,0.88)] p-5 shadow-[0_28px_60px_rgba(55,48,38,0.08)] backdrop-blur-md sm:p-6">
                                <div className="rounded-[34px] border border-[#314148] bg-[#223036] p-6 text-[#fff8f0] shadow-[0_24px_56px_rgba(24,31,34,0.16)]">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d9e8e3]">Control deck</div>
                                            <h2 className="mt-3 font-outfit text-3xl font-black tracking-tight text-white">
                                                One place to keep pace with the next paper
                                            </h2>
                                        </div>
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                                            <GraduationCap size={24} weight="bold" className="text-[#f2e3c0]" />
                                        </div>
                                    </div>

                                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                                        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e5d2a3] bg-[#f2e3c0] text-[#b7791f]">
                                                    <Timer size={20} weight="bold" />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d9e8e3]">Today&apos;s focus</div>
                                                    <div className="text-lg font-bold text-white">3-hour mock window</div>
                                                </div>
                                            </div>
                                            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                                                <div className="h-full w-[72%] rounded-full bg-[#f2e3c0]" />
                                            </div>
                                            <div className="mt-3 text-sm font-medium text-[#d0d9d6]">
                                                Revision stack prepared for Accounts, Law, and Taxation.
                                            </div>
                                        </div>

                                        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#c5ddd5] bg-[#dcebe6] text-[#1f5c50]">
                                                    <ChartLineUp size={20} weight="bold" />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d9e8e3]">Cohort pulse</div>
                                                    <div className="text-lg font-bold text-white">Capital gains still weak</div>
                                                </div>
                                            </div>
                                            <div className="mt-5 space-y-3">
                                                <div className="flex items-center justify-between text-sm font-medium text-[#d0d9d6]">
                                                    <span>Engagement</span>
                                                    <span className="font-bold text-white">84%</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm font-medium text-[#d0d9d6]">
                                                    <span>Mastery</span>
                                                    <span className="font-bold text-white">62%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d9e8e3]">What the workflow looks like</div>
                                                <div className="mt-2 text-base font-medium leading-relaxed text-[#d0d9d6]">
                                                    Start with a timed paper, review mistakes chapter by chapter, then move straight into revision material without leaving the workspace.
                                                </div>
                                            </div>
                                            <Link
                                                href="/student/analytics"
                                                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-all hover:bg-white/15"
                                            >
                                                See analytics
                                                <CaretRight size={14} weight="bold" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="px-6 pb-24 sm:px-12">
                    <div className="mx-auto max-w-7xl">
                        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div className="space-y-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#667370]">What makes it usable</div>
                                <h2 className="max-w-3xl font-outfit text-4xl font-black tracking-tight text-[#1f2b2f]">
                                    Designed to reduce noise, not just add features
                                </h2>
                            </div>
                            <p className="max-w-xl text-sm font-medium leading-relaxed text-[#667370]">
                                The visual direction is quieter on purpose. The value comes from repeatability, clarity, and cleaner transitions between study tasks.
                            </p>
                        </div>

                        <div className="grid gap-8 lg:grid-cols-3">
                            {FEATURE_CARDS.map((feature) => {
                                const tone = FEATURE_TONES[feature.tone as keyof typeof FEATURE_TONES];

                                return (
                                    <div
                                        key={feature.title}
                                        className="flex h-full flex-col rounded-[32px] border border-[#e6dccd] bg-[rgba(255,253,249,0.88)] p-8 shadow-[0_18px_40px_rgba(55,48,38,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(55,48,38,0.08)]"
                                    >
                                        <div className={`mb-8 flex h-16 w-16 items-center justify-center rounded-[24px] border ${tone.panel}`}>
                                            <feature.icon size={30} weight="bold" />
                                        </div>
                                        <h3 className="font-outfit text-2xl font-black tracking-tight text-[#1f2b2f]">
                                            {feature.title}
                                        </h3>
                                        <p className="mt-4 text-sm font-medium leading-relaxed text-[#667370]">
                                            {feature.description}
                                        </p>
                                        <Link
                                            href="/pricing"
                                            className={`mt-8 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] ${tone.link}`}
                                        >
                                            Learn more
                                            <CaretRight size={14} weight="bold" />
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <Testimonials />

                <section className="px-6 py-24 sm:px-12">
                    <div className="mx-auto max-w-7xl rounded-[40px] border border-[#314148] bg-[#223036] p-10 text-white shadow-[0_30px_70px_rgba(24,31,34,0.16)] sm:p-14">
                        <div className="grid gap-10 lg:grid-cols-[1fr_280px] lg:items-end">
                            <div className="space-y-5">
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#d9e8e3]">
                                    <CheckCircle size={14} weight="bold" className="text-[#f2e3c0]" />
                                    Start with the basics, scale when needed
                                </div>
                                <h2 className="max-w-3xl font-outfit text-4xl font-black tracking-tight text-white md:text-5xl">
                                    Build momentum first. Upgrade only when the extra depth becomes useful.
                                </h2>
                                <p className="max-w-2xl text-lg font-medium leading-relaxed text-[#d0d9d6]">
                                    Use the core workspace for mock practice and revision, then move into premium analytics and expanded libraries when your preparation actually needs it.
                                </p>
                            </div>

                            <div className="flex flex-col gap-4">
                                <Link
                                    href="/auth/signup"
                                    className="inline-flex items-center justify-center gap-3 rounded-2xl border border-[#1f5c50] bg-[#1f5c50] px-6 py-4 text-base font-bold text-white shadow-[0_14px_28px_rgba(31,92,80,0.2)] transition-all hover:bg-[#18493f] active:scale-95"
                                >
                                    Create free account
                                </Link>
                                <Link
                                    href="/pricing"
                                    className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-6 py-4 text-base font-bold text-white transition-all hover:bg-white/15 active:scale-95"
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
