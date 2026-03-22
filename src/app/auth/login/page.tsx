"use client";

import { login } from "@/actions/auth-actions";
import {
    ArrowRight,
    ChalkboardTeacher,
    Envelope,
    GoogleLogo,
    GraduationCap,
    IdentificationBadge,
    Lock,
    ShieldCheck
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type LoginRole = "student" | "teacher";

const DEMO_ACCOUNT_CARDS = [
    { label: "teacher1 (Super Admin)", registrationNumber: "TCHR001", email: "teacher1@demo.local", role: "teacher" as LoginRole },
    { label: "teacher2", registrationNumber: "TCHR002", email: "teacher2@demo.local", role: "teacher" as LoginRole },
    { label: "student1", registrationNumber: "STUD001", email: "student1@demo.local", role: "student" as LoginRole },
    { label: "student2", registrationNumber: "STUD002", email: "student2@demo.local", role: "student" as LoginRole },
];

const ROLE_META: Record<LoginRole, { title: string; description: string; icon: typeof IdentificationBadge }> = {
    student: {
        title: "Student workspace",
        description: "Sign in to practice timed papers, revisit weak chapters, and keep revision material tied to real progress.",
        icon: IdentificationBadge
    },
    teacher: {
        title: "Teacher workspace",
        description: "Manage batches, publish materials, monitor attempts, and intervene where students are actually slipping.",
        icon: ChalkboardTeacher
    }
};

export default function LoginPage() {
    const router = useRouter();
    const [role, setRole] = useState<LoginRole>("student");
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const activeCards = useMemo(
        () => DEMO_ACCOUNT_CARDS.filter((account) => account.role === role),
        [role]
    );

    const activeMeta = ROLE_META[role];

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSubmitting(true);
        setErrorMessage("");

        const result = await login({
            identifier,
            password,
            role: role.toUpperCase() as "TEACHER" | "STUDENT",
        });

        setIsSubmitting(false);

        if (!result.success) {
            setErrorMessage(result.message);
            return;
        }

        const nextPath =
            typeof window === "undefined"
                ? ""
                : new URLSearchParams(window.location.search).get("next")?.trim() ?? "";
        const redirectTo =
            result.data?.redirectTo ??
            nextPath ??
            (role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");

        router.push(redirectTo);
        router.refresh();
    }

    return (
        <div className="min-h-screen overflow-x-hidden bg-[#f5efe5] px-4 py-4 text-[#1f2b2f] sm:px-8 sm:py-8 lg:px-10 lg:py-10">
            <div className="absolute left-[-10rem] top-[-8rem] h-80 w-80 rounded-full bg-[#f2e3c0] blur-3xl opacity-70" />
            <div className="absolute bottom-[-10rem] right-[-8rem] h-96 w-96 rounded-full bg-[#dcebe6] blur-3xl opacity-70" />

            <div className="relative mx-auto grid w-full max-w-6xl gap-5 lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[0.92fr_1.08fr] lg:gap-8">
                <div className="order-2 flex flex-col justify-between rounded-[32px] border border-[#314148] bg-[#223036] p-6 text-[#fff8f0] shadow-[0_30px_70px_rgba(24,31,34,0.16)] sm:p-8 lg:order-1 lg:rounded-[40px] lg:p-10">
                    <div className="space-y-8">
                        <Link href="/" className="inline-flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-[#f2e3c0]">
                                <GraduationCap size={26} weight="bold" />
                            </div>
                            <div>
                                <div className="font-outfit text-2xl font-black tracking-tight text-white">Financly</div>
                                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d9e8e3]">CA Exam Workspace</div>
                            </div>
                        </Link>

                        <div className="space-y-5">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#d9e8e3]">
                                Secure sign in
                            </div>
                            <h1 className="font-outfit text-4xl font-black leading-[0.98] tracking-[-0.05em] text-white sm:text-5xl">
                                Enter the workspace without the usual dashboard noise
                            </h1>
                            <p className="max-w-xl text-base font-medium leading-relaxed text-[#d0d9d6]">
                                Choose the role you need, sign in with registration number or email, and continue directly into the correct exam workflow.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            {[
                                { value: "3", label: "Access roles" },
                                { value: "Timed", label: "Exam workflows" },
                                { value: "Demo", label: "Credentials ready" }
                            ].map((metric) => (
                                <div key={metric.label} className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-4 sm:rounded-[24px] sm:py-5">
                                    <div className="font-outfit text-3xl font-black tracking-tight text-white">{metric.value}</div>
                                    <div className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#d9e8e3]">{metric.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 sm:mt-10">
                        <div className="sm:hidden rounded-[22px] border border-[#c5ddd5] bg-[#dcebe6] px-5 py-4 text-[#1f5c50]">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#1f5c50] shadow-sm">
                                    <activeMeta.icon size={20} weight="bold" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.18em]">{activeMeta.title}</div>
                                    <div className="mt-1 text-sm font-medium leading-relaxed">{activeMeta.description}</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 hidden space-y-4 sm:block">
                            {(["student", "teacher"] as LoginRole[]).map((itemRole) => {
                                const meta = ROLE_META[itemRole];
                                const Icon = meta.icon;
                                const isActive = itemRole === role;

                                return (
                                    <div
                                        key={itemRole}
                                        className={`rounded-[24px] border px-5 py-4 transition-all ${
                                            isActive
                                                ? "border-[#c5ddd5] bg-[#dcebe6] text-[#1f5c50]"
                                                : "border-white/10 bg-white/5 text-[#d0d9d6]"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${isActive ? "bg-white text-[#1f5c50]" : "bg-white/10 text-[#f2e3c0]"}`}>
                                                <Icon size={20} weight="bold" />
                                            </div>
                                            <div>
                                                <div className={`text-[10px] font-black uppercase tracking-[0.18em] ${isActive ? "text-[#1f5c50]" : "text-[#d9e8e3]"}`}>
                                                    {meta.title}
                                                </div>
                                                <div className={`mt-1 text-sm font-medium leading-relaxed ${isActive ? "text-[#1f5c50]" : "text-[#d0d9d6]"}`}>
                                                    {meta.description}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="order-1 rounded-[32px] border border-[#e6dccd] bg-[rgba(255,253,249,0.94)] p-5 shadow-[0_28px_60px_rgba(55,48,38,0.08)] backdrop-blur-md sm:p-8 lg:order-2 lg:rounded-[40px] lg:p-10">
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#667370]">Role-based access</div>
                            <h2 className="mt-3 font-outfit text-4xl font-black tracking-tight text-[#1f2b2f]">
                                Welcome back
                            </h2>
                        </div>
                        <Link href="/" className="text-sm font-bold text-[#1f5c50] transition-colors hover:text-[#18493f]">
                            Back to homepage
                        </Link>
                    </div>

                    <div className="mb-6 rounded-[22px] border border-[#e6dccd] bg-[#f4ede2] p-2 sm:mb-8 sm:rounded-[24px]">
                        <div className="grid grid-cols-2 gap-2">
                            {([
                                { value: "student", label: "Student", icon: IdentificationBadge },
                                { value: "teacher", label: "Teacher", icon: ChalkboardTeacher }
                            ] as const).map((item) => {
                                const Icon = item.icon;
                                const isActive = role === item.value;

                                return (
                                    <button
                                        key={item.value}
                                        type="button"
                                        onClick={() => setRole(item.value)}
                                        className={`flex items-center justify-center gap-1.5 rounded-[16px] px-2 py-3 text-[10px] font-black uppercase tracking-[0.12em] transition-all sm:gap-2 sm:rounded-[18px] sm:text-[11px] sm:tracking-[0.16em] ${
                                            isActive
                                                ? "border border-[#c5ddd5] bg-white text-[#1f5c50] shadow-[0_10px_20px_rgba(55,48,38,0.05)]"
                                                : "text-[#667370] hover:text-[#1f5c50]"
                                        }`}
                                    >
                                        <Icon size={18} weight={isActive ? "fill" : "bold"} />
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mb-6 rounded-[22px] border border-[#c5ddd5] bg-[#dcebe6] px-4 py-4 sm:rounded-[24px] sm:px-5">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#1f5c50] shadow-sm">
                                <activeMeta.icon size={20} weight="bold" />
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1f5c50]">{activeMeta.title}</div>
                                <p className="mt-1 text-sm font-medium leading-relaxed text-[#1f5c50]">
                                    {activeMeta.description}
                                </p>
                            </div>
                        </div>
                    </div>

                    <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-3">
                            <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#667370]">Credentials</label>
                            <div className="relative group">
                                <Envelope size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#8b9693] transition-colors group-focus-within:text-[#1f5c50]" weight="bold" />
                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={(event) => setIdentifier(event.target.value)}
                                    placeholder="TCHR001 / STUD001 or email"
                                    className="w-full rounded-[22px] border border-[#e6dccd] bg-[#f4ede2] py-4 pl-14 pr-6 text-sm font-medium text-[#1f2b2f] outline-none transition-all placeholder:text-[#8b9693] focus:border-[#c5ddd5] focus:bg-white focus:ring-4 focus:ring-[#dcebe6]"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#667370]">Security key</label>
                                <Link href="#" className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1f5c50] hover:underline">
                                    Forgot?
                                </Link>
                            </div>
                            <div className="relative group">
                                <Lock size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#8b9693] transition-colors group-focus-within:text-[#1f5c50]" weight="bold" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="Enter password"
                                    className="w-full rounded-[22px] border border-[#e6dccd] bg-[#f4ede2] py-4 pl-14 pr-6 text-sm font-medium text-[#1f2b2f] outline-none transition-all placeholder:text-[#8b9693] focus:border-[#c5ddd5] focus:bg-white focus:ring-4 focus:ring-[#dcebe6]"
                                    required
                                />
                            </div>
                        </div>

                        {errorMessage ? (
                            <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                                {errorMessage}
                            </div>
                        ) : null}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex w-full items-center justify-center gap-3 rounded-[20px] border border-[#1f5c50] bg-[#1f5c50] py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-[0_16px_34px_rgba(31,92,80,0.14)] transition-all duration-300 hover:bg-[#18493f] active:scale-95 disabled:opacity-70 sm:rounded-[22px]"
                        >
                            {isSubmitting ? "Authenticating..." : "Sign in securely"}
                            <ArrowRight size={18} weight="bold" />
                        </button>
                    </form>

                    <div className="mt-8 rounded-[24px] border border-[#e6dccd] bg-[#f4ede2] p-4 sm:rounded-[28px] sm:p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#667370]">Demo access</div>
                                <div className="mt-1 text-sm font-medium text-[#4f5b58]">
                                    Use password <span className="font-bold text-[#1f5c50]">demo123</span> for all demo accounts.
                                </div>
                            </div>
                            <div className="rounded-full border border-[#d7c5a9] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#b7791f]">
                                {role}
                            </div>
                        </div>

                        <div className="mt-4 grid gap-3">
                            {activeCards.map((account) => (
                                <button
                                    key={account.label}
                                    type="button"
                                    onClick={() => {
                                        setRole(account.role);
                                        setIdentifier(account.registrationNumber);
                                        setPassword("demo123");
                                        setErrorMessage("");
                                    }}
                                    className="rounded-[22px] border border-[#e6dccd] bg-white px-4 py-3 text-left transition-all hover:border-[#c5ddd5] hover:bg-[#fcfaf6]"
                                >
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <div className="text-sm font-bold text-[#1f2b2f]">{account.label}</div>
                                            <div className="text-xs font-medium text-[#667370]">{account.registrationNumber}</div>
                                        </div>
                                        <div className="text-xs font-medium text-[#1f5c50]">{account.email}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8">
                        <div className="relative mb-7">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[#e6dccd]" />
                            </div>
                            <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.3em] text-[#8b9693]">
                                <span className="bg-[rgba(255,253,249,0.94)] px-5">Third-party auth</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="group flex w-full items-center justify-center gap-3 rounded-[22px] border border-[#e6dccd] bg-[#f4ede2] py-4 text-[10px] font-black uppercase tracking-[0.16em] text-[#4f5b58] transition-all active:scale-95"
                        >
                            <GoogleLogo size={20} weight="bold" className="text-rose-500 transition-transform group-hover:scale-110" />
                            Continue with Google
                        </button>
                    </div>

                    <p className="mt-8 text-center text-[10px] font-black uppercase tracking-[0.14em] text-[#8b9693] sm:tracking-[0.16em]">
                        Do not have an account?{" "}
                        <Link href="/auth/signup" className="text-[#1f5c50] transition-colors hover:text-[#18493f]">
                            Create for free
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
