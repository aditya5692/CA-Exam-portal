"use client";

import { verifyOtpAndRegister } from "@/actions/auth-actions";
import { 
    getGlobalLeaderboard, 
    LeaderboardEntry 
} from "@/actions/leaderboard-actions";
import { 
    getPublicMockExams 
} from "@/actions/publish-exam-actions";
import { 
    ArrowRight, 
    CheckCircle, 
    DeviceMobile, 
    Envelope, 
    GraduationCap, 
    Lock, 
    Sparkle, 
    User,
    Spinner,
    TrendUp,
    Users,
    CaretRight,
    Certificate,
    Lightbulb,
    Calendar,
    GoogleLogo,
    MapPin,
    Briefcase,
    Atom,
    Buildings
} from "@phosphor-icons/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { trackSignUp, setUserId } from "@/lib/analytics-utils";
import { 
    auth, 
    googleProvider, 
} from "@/lib/firebase";
import { 
    createUserWithEmailAndPassword, 
    signInWithPopup,
    sendEmailVerification
} from "firebase/auth";
import { Lexend } from "next/font/google";

const lexend = Lexend({
    subsets: ["latin"],
    display: "swap",
});

function SignupFormContent() {
    const searchParams = useSearchParams();
    const searchEmail = searchParams.get("email") ?? "";
    const searchRole = searchParams.get("role")?.toUpperCase();
    const initialRole = searchRole === "TEACHER" || searchRole === "STUDENT" ? searchRole : "STUDENT";
    
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState(searchEmail);
    const [phone, setPhone] = useState("");
    const [dob, setDob] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<"STUDENT" | "TEACHER">(initialRole);
    const [department, setDepartment] = useState("");
    const [caLevel, setCaLevel] = useState<"foundation" | "ipc" | "final">("final");
    const [attemptMonth, setAttemptMonth] = useState("5"); 
    const [attemptYear, setAttemptYear] = useState(new Date().getFullYear().toString());
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [experienceYears, setExperienceYears] = useState("");
    const [articleshipFirmType, setArticleshipFirmType] = useState("");
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [trendingExams, setTrendingExams] = useState<{ id: string; title: string; attemptCount: number }[]>([]);
    const [topAspirants, setTopAspirants] = useState<LeaderboardEntry[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);

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

    function clearPendingVerification() {
        if (typeof window !== "undefined") {
            window.sessionStorage.removeItem("pending-firebase-token");
        }
    }

    async function handleGoogleSignup() {
        if (!auth) return;
        setErrorMessage("");
        setIsSubmitting(true);
        trackSignUp("google_auth_attempt");

        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            
            // Pre-fill some fields if possible
            if (user.displayName) setFullName(user.displayName);
            if (user.email) setEmail(user.email);
            
            setIsSubmitting(false);
            setErrorMessage("Google account linked. Please complete the remaining fields below.");
        } catch (err: unknown) {
            const error = err as Error;
            console.error("SignupPage: Google Signup Error", error);
            setErrorMessage(error.message || "Google authentication failed.");
            setIsSubmitting(false);
        }
    }

    async function handleRegister(event: React.FormEvent) {
        event.preventDefault();
        if (!auth) return;
        
        console.log("SignupPage: Starting manual registration...");
        setIsSubmitting(true);
        setErrorMessage("");

        try {
            // 1. Create User in Firebase
            let firebaseToken: string;
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await sendEmailVerification(userCredential.user);
                firebaseToken = await userCredential.user.getIdToken();
            } catch (err: unknown) {
                const firebaseError = err as { code: string; message: string };
                if (firebaseError.code === "auth/email-already-in-use") {
                    // Maybe they just need to log in, but let's try to get a token if they are currently logged in
                    if (auth.currentUser && auth.currentUser.email === email) {
                        firebaseToken = await auth.currentUser.getIdToken();
                    } else {
                        throw err;
                    }
                } else {
                    throw err;
                }
            }

            // 2. Register in our Database
            const result = await verifyOtpAndRegister({
                phone,
                otp: "VERIFIED",
                token: firebaseToken,
                fullName,
                email,
                password,
                role,
                dob,
                department: role === "TEACHER" ? department : undefined,
                examTargetLevel: role === "STUDENT" ? caLevel : undefined,
                examTargetMonth: role === "STUDENT" ? parseInt(attemptMonth) : undefined,
                examTargetYear: role === "STUDENT" ? parseInt(attemptYear) : undefined,
                city,
                state,
                experienceYears: role === "TEACHER" ? parseInt(experienceYears) : undefined,
                articleshipFirmType: (role === "STUDENT" && caLevel === "final") ? articleshipFirmType : undefined,
                expertise: role === "TEACHER" ? department : undefined
            });

            setIsSubmitting(false);

            if (!result.success) {
                setErrorMessage(result.message);
                return;
            }

            if (result.success && result.data && 'user' in result.data) {
                setUserId(result.data.user.registrationNumber);
                trackSignUp("registration_complete");
            }

            window.location.assign(result.data?.redirectTo || "/student/dashboard");
        } catch (err: unknown) {
            const error = err as { code?: string; message: string };
            console.error("SignupPage: Registration Error", error);
            let msg = "Failed to create account. Please check your details.";
            if (error.code === "auth/weak-password") msg = "Password is too weak.";
            if (error.code === "auth/email-already-in-use") msg = "This email is already registered.";
            setErrorMessage(msg);
            setIsSubmitting(false);
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
                            Claim your <span className="text-blue-500">free workspace</span> today.
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

            {/* INDUSTRIAL PORTAL */}
            <div className="relative flex flex-col items-center justify-center p-6 sm:p-12 lg:p-24 xl:p-32 bg-white overflow-y-auto">
                
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

                <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-1000">
                    <div className="mb-10 space-y-3">
                        <h2 className="text-3xl font-extrabold text-slate-950 tracking-tighter">
                            Create Workspace
                        </h2>
                        <p className="text-sm font-medium text-slate-500">
                           Identify yourself as a aspirant  to stay aligned.
                        </p>
                    </div>

                    <div className="mb-12">
                         <button
                            type="button"
                            onClick={handleGoogleSignup}
                            className="w-full py-4.5 rounded-lg border border-slate-200 font-bold text-slate-700 flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                        >
                            <GoogleLogo size={22} weight="bold" className="text-[#4285F4]" />
                            <span>Quick Join with Google</span>
                        </button>
                        
                        <div className="relative mt-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-100"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px] font-extrabold uppercase tracking-widest">
                                <span className="bg-white px-4 text-slate-400">Or establish credentials</span>
                            </div>
                        </div>
                    </div>

                    <form className="space-y-8" onSubmit={handleRegister}>
                        {/* Mandatory Role Identification */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#0f2cbd] px-1">I am registering as a...</label>
                            <div className="grid grid-cols-2 gap-4">
                                {(["STUDENT", "TEACHER"] as const).map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setRole(r)}
                                        className={cn(
                                            "flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all font-bold text-sm",
                                            role === r
                                                ? "border-[#0f2cbd] bg-blue-50 text-[#0f2cbd]"
                                                : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                                        )}
                                    >
                                        <div className={cn("size-2.5 rounded-full", role === r ? "bg-[#0f2cbd] shadow-[0_0_10px_rgba(15,44,189,0.4)]" : "bg-slate-200")}></div>
                                        {r.charAt(0) + r.slice(1).toLowerCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 px-1">Full Name</label>
                                <div className="relative group">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0f2cbd] transition-colors">
                                        <User size={20} weight="bold" />
                                    </span>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(event) => setFullName(event.target.value)}
                                        placeholder="Enter your name"
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-4 pl-14 pr-6 text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-[#0f2cbd] focus:bg-white focus:ring-4 focus:ring-blue-100/50"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 px-1">Email Address</label>
                                <div className="relative group">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0f2cbd] transition-colors">
                                        <Envelope size={20} weight="bold" />
                                    </span>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        placeholder="Enter your email"
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-4 pl-14 pr-6 text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-[#0f2cbd] focus:bg-white focus:ring-4 focus:ring-blue-100/50"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 px-1">Mobile Number</label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0f2cbd] transition-colors text-sm font-bold">
                                        +91
                                    </span>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(event) => setPhone(event.target.value)}
                                        placeholder="Enter 10-digit number"
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-4 pl-14 pr-6 text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-[#0f2cbd] focus:bg-white focus:ring-4 focus:ring-blue-100/50"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 px-1">Date of Birth</label>
                                <div className="relative group">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0f2cbd] transition-colors">
                                        <Calendar size={20} weight="bold" />
                                    </span>
                                    <input
                                        type="date"
                                        value={dob}
                                        onChange={(event) => setDob(event.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-4 pl-14 pr-6 text-sm font-bold text-slate-900 outline-none transition-all focus:border-[#0f2cbd] focus:bg-white focus:ring-4 focus:ring-blue-100/50"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 px-1">City</label>
                                <div className="relative group">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0f2cbd] transition-colors">
                                        <MapPin size={20} weight="bold" />
                                    </span>
                                    <input
                                        type="text"
                                        value={city}
                                        onChange={(event) => setCity(event.target.value)}
                                        placeholder="e.g. Mumbai"
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-4 pl-14 pr-6 text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-[#0f2cbd] focus:bg-white focus:ring-4 focus:ring-blue-100/50"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 px-1">State</label>
                                <div className="relative group">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0f2cbd] transition-colors">
                                        <MapPin size={20} weight="bold" />
                                    </span>
                                    <input
                                        type="text"
                                        value={state}
                                        onChange={(event) => setState(event.target.value)}
                                        placeholder="e.g. Maharashtra"
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-4 pl-14 pr-6 text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-[#0f2cbd] focus:bg-white focus:ring-4 focus:ring-blue-100/50"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {role === "STUDENT" ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 px-1">CA Level</label>
                                    <select
                                        value={caLevel}
                                        onChange={(e) => setCaLevel(e.target.value as "foundation" | "ipc" | "final")}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-4 px-6 text-sm font-bold text-slate-900 outline-none focus:border-[#0f2cbd] focus:bg-white cursor-pointer appearance-none shadow-sm focus:ring-4 focus:ring-blue-100/50"
                                        required
                                    >
                                        <option value="foundation">CA Foundation</option>
                                        <option value="ipc">CA Intermediate</option>
                                        <option value="final">CA Final</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 px-1">Attempt Target</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <select
                                            value={attemptMonth}
                                            onChange={(e) => setAttemptMonth(e.target.value)}
                                            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-4 px-6 text-sm font-bold text-slate-900 outline-none focus:border-[#0f2cbd] focus:bg-white cursor-pointer appearance-none shadow-sm focus:ring-4 focus:ring-blue-100/50"
                                            required
                                        >
                                            <option value="5">May</option>
                                            <option value="11">Nov</option>
                                        </select>
                                        <select
                                            value={attemptYear}
                                            onChange={(e) => setAttemptYear(e.target.value)}
                                            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-4 px-6 text-sm font-bold text-slate-900 outline-none focus:border-[#0f2cbd] focus:bg-white cursor-pointer appearance-none shadow-sm focus:ring-4 focus:ring-blue-100/50"
                                            required
                                        >
                                            {[2024, 2025, 2026, 2027].map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 px-1">Subject Expertise</label>
                                    <div className="relative group">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0f2cbd] transition-colors">
                                            <Atom size={20} weight="bold" />
                                        </span>
                                        <input
                                            type="text"
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                            placeholder="e.g. Taxation"
                                            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-4 pl-14 pr-6 text-sm font-bold text-slate-900 outline-none focus:border-[#0f2cbd] focus:bg-white transition-all shadow-sm focus:ring-4 focus:ring-blue-100/50"
                                            required={role === "TEACHER"}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 px-1">Experience (Years)</label>
                                    <div className="relative group">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0f2cbd] transition-colors">
                                            <Briefcase size={20} weight="bold" />
                                        </span>
                                        <input
                                            type="number"
                                            value={experienceYears}
                                            onChange={(e) => setExperienceYears(e.target.value)}
                                            placeholder="e.g. 5"
                                            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-4 pl-14 pr-6 text-sm font-bold text-slate-900 outline-none focus:border-[#0f2cbd] focus:bg-white transition-all shadow-sm focus:ring-4 focus:ring-blue-100/50"
                                            required={role === "TEACHER"}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {role === "STUDENT" && caLevel === "final" && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 px-1">Articleship at</label>
                                <div className="relative group">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0f2cbd] transition-colors pointer-events-none z-10">
                                        <Buildings size={20} weight="bold" />
                                    </span>
                                    <select
                                        value={articleshipFirmType}
                                        onChange={(e) => setArticleshipFirmType(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-4 pl-14 pr-6 text-sm font-bold text-slate-900 outline-none focus:border-[#0f2cbd] focus:bg-white cursor-pointer appearance-none shadow-sm focus:ring-4 focus:ring-blue-100/50"
                                        required
                                    >
                                        <option value="">Select Firm Tier</option>
                                        <option value="BIG4">Big 4</option>
                                        <option value="BIG6">Big 6</option>
                                        <option value="TOP10">Top 10</option>
                                        <option value="TOP30">Top 30</option>
                                        <option value="OTHERS">Others</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 px-1">Secure Password</label>
                            <div className="relative group">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0f2cbd] transition-colors">
                                    <Lock size={20} weight="bold" />
                                </span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="Minimum 8 characters"
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-4 pl-14 pr-6 text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-[#0f2cbd] focus:bg-white focus:ring-4 focus:ring-blue-100/50"
                                    required
                                />
                            </div>
                        </div>

                        {errorMessage && (
                            <div className="rounded-lg bg-rose-50 border border-rose-100 p-5 text-xs font-bold text-rose-600 animate-in shake duration-300 flex items-center gap-3 shadow-sm">
                                <div className="size-2 rounded-full bg-rose-600 animate-pulse"></div>
                                {errorMessage}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="brand-button-primary w-full !py-5 !text-base shadow-[0_25px_60px_-15px_rgba(15,44,189,0.3)] flex items-center justify-center gap-3"
                        >
                            {isSubmitting ? (
                                <Spinner className="animate-spin" size={24} weight="bold" />
                            ) : (
                                <>
                                    <span>Establish Profile Node</span>
                                    <ArrowRight size={20} weight="bold" className="transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-12 text-center text-xs font-bold text-slate-400 tracking-tight">
                        Already have an account?{" "}
                        <Link href="/auth/login" className="text-[#0f2cbd] hover:underline underline-offset-4 decoration-blue-100 font-extrabold decoration-4">
                            Sign in to workspace
                        </Link>
                    </p>

                    <div className="mt-12 pt-12 border-t border-slate-100 flex flex-wrap justify-between gap-4 text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-300">
                        <div className="flex gap-6">
                            <Link href="/privacy-policy" className="hover:text-slate-950 transition-colors">Security Infrastructure</Link>
                            <Link href="/terms-and-conditions" className="hover:text-slate-950 transition-colors">Terms of Prep</Link>
                        </div>
                        <div className="text-slate-400">© 2026 Financly</div>
                    </div>
                </div>
            </div>
            
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Spinner className="animate-spin text-slate-900" size={32} weight="bold" />
            </div>
        }>
            <SignupFormContent />
        </Suspense>
    );
}
