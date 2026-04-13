"use client";

import { 
    loginAsDemoUser, 
    verifyFirebaseTokenAndLogin 
} from "@/actions/auth-actions";
import { 
    getGlobalLeaderboard, 
    LeaderboardEntry 
} from "@/actions/leaderboard-actions";
import { 
    getPublicMockExams 
} from "@/actions/publish-exam-actions";
import { 
    ArrowRight, 
    ChalkboardTeacher, 
    GraduationCap, 
    IdentificationBadge, 
    Envelope,
    Lock,
    Spinner, 
    CheckCircle,
    TrendUp,
    Users,
    Sparkle,
    CaretRight,
    Certificate,
    Lightbulb,
    GoogleLogo
} from "@phosphor-icons/react";
import { useEffect } from "react";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { Lexend } from "next/font/google";
import { trackLogin, setUserId } from "@/lib/analytics-utils";
import { 
    auth, 
    googleProvider, 
} from "@/lib/firebase";
import { 
    signInWithEmailAndPassword, 
    signInWithPopup,
} from "firebase/auth";


const lexend = Lexend({
    subsets: ["latin"],
    display: "swap",
});

type LoginRole = "student" | "teacher";

const DEMO_ACCOUNT_CARDS = [
    { label: "teacher1 (Super Admin)", registrationNumber: "TCHR001", email: "teacher1@demo.local", role: "teacher" as LoginRole },
    { label: "teacher2", registrationNumber: "TCHR002", email: "teacher2@demo.local", role: "teacher" as LoginRole },
    { label: "student1", registrationNumber: "STUD001", email: "student1@demo.local", role: "student" as LoginRole },
    { label: "student2", registrationNumber: "STUD002", email: "student2@demo.local", role: "student" as LoginRole },
];

type AuthState = "IDLE" | "VERIFYING" | "FINALIZING" | "SUCCESS";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [authState, setAuthState] = useState<AuthState>("IDLE");
    const [errorMessage, setErrorMessage] = useState("");

    const activeCards = DEMO_ACCOUNT_CARDS;

    const [trendingExams, setTrendingExams] = useState<any[]>([]);
    const [topAspirants, setTopAspirants] = useState<LeaderboardEntry[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);

    const hostname = useSyncExternalStore(
        () => () => undefined,
        () => typeof window !== "undefined" ? window.location.hostname : "",
        () => "",
    );

    useEffect(() => {
        async function loadPulseData() {
            try {
                const [examsRes, leaderboardRes] = await Promise.all([
                    getPublicMockExams(),
                    getGlobalLeaderboard(3)
                ]);
                if (examsRes.success && examsRes.data) setTrendingExams(examsRes.data.slice(0, 3));
                if (leaderboardRes.success && leaderboardRes.data) setTopAspirants(leaderboardRes.data);
            } catch (err) {
                console.error("Pulse: Data fetch failed", err);
            } finally {
                setIsDataLoading(false);
            }
        }
        void loadPulseData();
    }, []);

    async function handleGoogleLogin() {
        if (!auth) return;
        setErrorMessage("");
        setAuthState("VERIFYING");
        trackLogin("google_auth_attempt");

        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();
            await handleAuthSuccess(idToken);
        } catch (err: any) {
            console.error("LoginPage: Google Login Error", err);
            setErrorMessage(err.message || "Google authentication failed.");
            setAuthState("IDLE");
        }
    }

    async function handleEmailLogin(event: React.FormEvent) {
        event.preventDefault();
        if (!auth) return;
        if (!email || !password) {
            setErrorMessage("Please enter both email and password.");
            return;
        }

        setErrorMessage("");
        setAuthState("VERIFYING");
        trackLogin("email_login_attempt");

        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await result.user.getIdToken();
            await handleAuthSuccess(idToken);
        } catch (err: any) {
            console.error("LoginPage: Email Login Error", err);
            let msg = "Invalid email or password.";
            if (err.code === "auth/user-not-found") msg = "No account found with this email.";
            if (err.code === "auth/wrong-password") msg = "Incorrect password.";
            setErrorMessage(msg);
            setAuthState("IDLE");
        }
    }

    async function handleAuthSuccess(accessToken: string) {
        if (!accessToken) {
            setErrorMessage("Failed to acquire a secure verification token. Please try again.");
            setAuthState("IDLE");
            return;
        }

        setAuthState("FINALIZING");
        console.log("LoginPage: Starting server-side verification...");

        try {
            const result = await verifyFirebaseTokenAndLogin(accessToken);
            console.log("LoginPage: Server verification result:", result);
            
            if (!result.success) {
                setErrorMessage(result.message);
                setAuthState("IDLE");
                return;
            }

            setAuthState("SUCCESS");
            
            if (result.success && result.data && 'user' in result.data) {
                setUserId(result.data.user.registrationNumber);
                trackLogin("otp_verify_success");
            }

            if ('needsRegistration' in result.data! && result.data.needsRegistration) {
                window.sessionStorage.setItem("pending-firebase-token", accessToken);
                console.log("LoginPage: New user detected. Redirecting to signup.");
                window.location.assign(`/auth/signup?email=${encodeURIComponent(email)}&verified=true`);
                return;
            }

            const redirectTo = "redirectTo" in result.data
                ? result.data.redirectTo
                : "/student/dashboard";

            console.log(`LoginPage: Login successful. Redirecting to ${redirectTo}`);
            window.location.assign(redirectTo);
        } catch (err: any) {
            console.error("LoginPage: Finalization Error", err);
            setErrorMessage(err.message || "An unexpected error occurred during finalization.");
            setAuthState("IDLE");
        }
    }

    return (
        <div className={cn(lexend.className, "min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900 lg:grid lg:grid-cols-[1.1fr_1fr]")}>
            
            {/* PULSE SIDEBAR - INDUSTRIAL VALUE PROPOSITION */}
            <div className="relative hidden lg:flex flex-col bg-[#020617] p-12 xl:p-20 overflow-hidden isolate">
                {/* Modern Abstract Graphics */}
                <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none -z-10" />
                <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none -z-10" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

                <div className="mb-16">
                    <Link href="/" className="flex items-center gap-4 group">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xl shadow-blue-900/20 group-hover:scale-105 transition-transform">
                            <GraduationCap size={28} weight="bold" />
                        </div>
                        <div>
                            <div className="text-xl font-extrabold text-white tracking-tight italic">Financly</div>
                            <div className="text-[9px] font-bold uppercase tracking-[0.4em] text-blue-400">Flagship Intelligence</div>
                        </div>
                    </Link>
                </div>

                <div className="flex-1 space-y-12 max-w-lg">
                    <div className="space-y-4">
                        <h2 className="text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-[1.1]">
                            The pulse of <span className="text-blue-500">CA preparation</span> is right here.
                        </h2>
                        <p className="text-slate-400 font-medium leading-relaxed max-w-sm">
                            Join 12,000+ CA aspirants achieving their attempt goals through 
                            data-driven simulation and archive intelligence.
                        </p>
                    </div>

                    <div className="space-y-8">
                        {/* Real-time Data Section: Trending Simulations */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-blue-400">
                                <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest">
                                    <TrendUp size={16} weight="bold" /> Trending Simulations
                                </div>
                                <div className="h-px flex-1 mx-4 bg-white/5" />
                                <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">Live</div>
                            </div>
                            
                            <div className="grid gap-3">
                                {isDataLoading ? (
                                    [1, 2].map(i => (
                                        <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" />
                                    ))
                                ) : (
                                    trendingExams.map((exam) => (
                                        <div key={exam.id} className="group flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 p-4 rounded-lg transition-all cursor-default">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-400">
                                                    < Sparkle size={20} weight="bold" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-extrabold text-white tracking-tight">{exam.title}</div>
                                                    <div className="text-[9px] text-slate-500 font-bold uppercase mt-1">
                                                        {exam.attemptCount} Active Attempts This Week
                                                    </div>
                                                </div>
                                            </div>
                                            <CaretRight size={14} className="text-slate-700 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Social Proof Section: Global Aspirants */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-emerald-400">
                                <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest">
                                    <Users size={16} weight="bold" /> Global Aspirants
                                </div>
                                <div className="h-px flex-1 mx-4 bg-white/5" />
                            </div>

                            <div className="flex -space-x-3 overflow-hidden p-1">
                                {topAspirants.map((asp, i) => (
                                    <div key={asp.studentId} className={cn(
                                        "inline-block h-10 w-10 rounded-lg ring-4 ring-[#020617] bg-white/10 flex items-center justify-center text-[11px] font-extrabold text-white border border-white/10",
                                        i === 0 && "bg-blue-600 border-blue-400",
                                        i === 1 && "bg-emerald-600 border-emerald-400",
                                        i === 2 && "bg-amber-600 border-amber-400"
                                    )}>
                                        {asp.fullName.charAt(0)}
                                    </div>
                                ))}
                                <div className="h-10 w-10 rounded-lg ring-4 ring-[#020617] bg-white/5 border border-white/5 flex items-center justify-center text-[9px] font-bold text-slate-500">
                                    +12k
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-loose">
                                Average cohort accuracy: <span className="text-emerald-400">74%</span> • 
                                Peer goal streak: <span className="text-amber-400">8 days</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-10 flex items-center gap-8 text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-600">
                    <div className="flex items-center gap-2">
                        <Certificate size={16} weight="bold" className="text-blue-500" /> Authorized Prep
                    </div>
                    <div className="flex items-center gap-2">
                        <Lightbulb size={16} weight="bold" className="text-amber-500" /> AI Insights
                    </div>
                </div>
            </div>

            {/* AUTHENTICATION PORTAL */}
            <div className="relative flex flex-col items-center justify-center p-6 sm:p-12 lg:p-24 xl:p-32 bg-white">
                
                {/* Mobile Header Branding */}
                <div className="lg:hidden mb-12 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                    <Link href="/" className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#0f2cbd] text-white shadow-2xl shadow-blue-600/30">
                        <GraduationCap size={28} weight="bold" />
                    </Link>
                    <div className="text-center">
                        <h1 className="text-xl font-extrabold tracking-tighter text-slate-950 italic">Financly</h1>
                        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#0f2cbd]/60">CA Test Series</p>
                    </div>
                </div>

                <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-1000">
                    <div className="mb-10 space-y-3">
                        <h2 className="text-3xl font-extrabold text-slate-950 tracking-tighter">
                            {authState === "IDLE" ? "Enter Workspace" : "Security Check"}
                        </h2>
                        <p className="text-sm font-medium text-slate-500">
                            {authState === "IDLE" ? "Identify yourself to continue preparation." : "Please complete the verification flow."}
                        </p>
                    </div>

                    <div className="min-h-[200px] flex flex-col">
                        {authState === "IDLE" ? (
                            <div className="space-y-8">
                                <form className="space-y-6" onSubmit={handleEmailLogin}>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 px-1">Email Address</label>
                                            <div className="relative group">
                                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0f2cbd] transition-colors">
                                                    <Envelope size={22} weight="bold" />
                                                </span>
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(event) => setEmail(event.target.value)}
                                                    placeholder="Enter your email"
                                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-5 pl-14 pr-6 text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-[#0f2cbd] focus:bg-white focus:ring-4 focus:ring-blue-100/50"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 px-1">Password</label>
                                            <div className="relative group">
                                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0f2cbd] transition-colors">
                                                    <Lock size={22} weight="bold" />
                                                </span>
                                                <input
                                                    type="password"
                                                    value={password}
                                                    onChange={(event) => setPassword(event.target.value)}
                                                    placeholder="Enter your password"
                                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-5 pl-14 pr-6 text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-[#0f2cbd] focus:bg-white focus:ring-4 focus:ring-blue-100/50"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="brand-button-primary w-full !py-4.5 !text-base shadow-[0_25px_60px_-15px_rgba(15,44,189,0.3)] flex items-center justify-center gap-3"
                                    >
                                        <span>Sign In Now</span>
                                        <ArrowRight size={20} weight="bold" className="transition-transform group-hover:translate-x-1" />
                                    </button>
                                </form>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-100"></div>
                                    </div>
                                    <div className="relative flex justify-center text-[10px] font-extrabold uppercase tracking-widest">
                                        <span className="bg-white px-4 text-slate-400">Or continue with</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    className="w-full py-4.5 rounded-lg border border-slate-200 font-bold text-slate-700 flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                                >
                                    <GoogleLogo size={22} weight="bold" className="text-[#4285F4]" />
                                    <span>Google Sign In</span>
                                </button>
                            </div>
                        ) : authState === "VERIFYING" ? (
                            <div className="flex flex-col items-center justify-center space-y-6 py-12 animate-in fade-in duration-500">
                                <div className="relative">
                                    <div className="h-20 w-20 rounded-full border-4 border-slate-100 border-t-[#0f2cbd] animate-spin" />
                                    <Lock className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#0f2cbd]" size={28} weight="fill" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-extrabold text-slate-950 tracking-tight">Securing Session</h3>
                                    <p className="text-sm font-medium text-slate-500 mt-2">Authenticating credentials with Firebase...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center space-y-6 py-12 animate-in fade-in duration-500">
                                <div className="relative">
                                    <div className="h-20 w-20 rounded-full border-4 border-slate-100 border-t-[#0f2cbd] animate-spin" />
                                    <CheckCircle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#0f2cbd]" size={28} weight="fill" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-extrabold text-slate-950 tracking-tight">Verified Successfully</h3>
                                    <p className="text-sm font-medium text-slate-500 mt-2">Establishing your secure prep session...</p>
                                </div>
                            </div>
                        )}

                        {errorMessage && (
                            <div className="mt-8 rounded-lg bg-rose-50 border border-rose-100 p-5 text-xs font-bold text-rose-600 animate-in shake duration-300 flex items-center gap-3">
                                <div className="size-2 rounded-full bg-rose-600 animate-pulse"></div>
                                {errorMessage}
                            </div>
                        )}
                    </div>

                    {/* Quick Portal Access */}
                    {authState === "IDLE" && (
                        <div className="mt-12 pt-10 border-t border-slate-100">
                            <div className="grid gap-3">
                                {activeCards.map((account) => (
                                    <button
                                        key={account.label}
                                        onClick={async () => {
                                            setAuthState("FINALIZING");
                                            const res = await loginAsDemoUser(account.registrationNumber);
                                            if (res.success && res.data && 'redirectTo' in res.data) {
                                                setUserId(account.registrationNumber);
                                                trackLogin("demo_account");
                                                window.location.assign(res.data.redirectTo);
                                            } else {
                                                setErrorMessage(res.message || "Login failed.");
                                                setAuthState("IDLE");
                                            }
                                        }}
                                        className="group flex items-center justify-between bg-slate-50 border border-slate-200/50 p-4 rounded-lg hover:border-[#0f2cbd] hover:bg-[#0f2cbd]/5 transition-all text-left"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#0f2cbd] font-bold shadow-sm group-hover:bg-[#0f2cbd] group-hover:text-white transition-all text-xs">
                                                {account.label.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-xs font-extrabold text-slate-900 uppercase tracking-tight">{account.label}</div>
                                                <div className="text-[9px] text-slate-400 font-extrabold uppercase mt-0.5">{account.role} Protocol</div>
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-extrabold text-blue-600/0 group-hover:text-blue-600 transition-all uppercase tracking-widest">Sign In</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <p className="mt-10 text-center text-xs font-bold text-slate-400 tracking-tight">
                        Don&apos;t have an account?{" "}
                        <Link href="/auth/signup" className="text-[#0f2cbd] hover:underline underline-offset-4 decoration-blue-100 font-extrabold decoration-4">
                            Claim access for free
                        </Link>
                    </p>

                    <div className="mt-12 pt-12 border-t border-slate-100 flex flex-wrap justify-between gap-4 text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-300">
                        <div className="flex gap-6">
                            <Link href="/privacy-policy" className="hover:text-slate-950 transition-colors">Security</Link>
                            <Link href="/terms-and-conditions" className="hover:text-slate-950 transition-colors">Terms</Link>
                        </div>
                        <div className="text-slate-400">© 2026 Financly</div>
                    </div>
                </div>
            </div>

        </div>
    );
}
