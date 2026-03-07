import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-height-100vh flex items-center justify-center bg-linear-to-br from-[#08122d] via-[#0a1738] to-[#0f2148] p-6 relative overflow-hidden">
            {/* Dynamic Background elements */}
            <div className="absolute -left-30 -bottom-35 w-90 h-90 rounded-full bg-radial from-blue-600/30 to-transparent blur-xl pointer-events-none" />
            <div className="absolute -right-28 -top-30 w-85 h-85 rounded-full bg-radial from-cyan-500/30 to-transparent blur-xl pointer-events-none" />

            <div className="relative z-10 w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-[1.08fr_0.92fr] rounded-3xl overflow-hidden border border-white/10 backdrop-blur-md bg-white/5 shadow-2xl">
                {/* Left Side: Brand & Value Prop */}
                <div className="p-8 lg:p-12 text-white bg-linear-to-br from-blue-700/40 to-blue-900/40 relative overflow-hidden flex flex-col justify-center">
                    <div className="absolute -right-12 -bottom-14 w-48 h-48 rounded-full bg-white/10 blur-2xl" />

                    <div className="inline-flex px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] uppercase tracking-widest font-bold mb-4 w-fit">
                        CA Student Access
                    </div>

                    <h1 className="text-3xl lg:text-4xl font-bold font-outfit leading-tight mb-4">
                        Empower Your CA Journey
                    </h1>

                    <p className="text-white/80 text-sm lg:text-base leading-relaxed mb-8 max-w-md">
                        Sign in to access your personalized dashboard, track your progress, and excel in your exams with premium tools.
                    </p>

                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {[
                            { label: "Learners", value: "18.4K+" },
                            { label: "Daily Attempts", value: "62K+" },
                            { label: "Avg. Completion", value: "84%" }
                        ].map(metric => (
                            <div key={metric.label} className="p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
                                <div className="font-bold text-lg">{metric.value}</div>
                                <div className="text-[10px] text-white/60">{metric.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4">
                        {[
                            "ICAI-style registration number sign-in",
                            "Verify profile and focused study plans",
                            "Start tests with real-time analytics"
                        ].map((step, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-white/10 bg-white/5">
                                <span className="w-6 h-6 rounded-full bg-white text-blue-900 flex items-center justify-center text-xs font-bold shrink-0">
                                    {i + 1}
                                </span>
                                <p className="text-xs text-white/90">{step}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side: Form Content */}
                <div className="p-8 lg:p-12 bg-[#101b34]/80 backdrop-blur-xl">
                    {children}
                </div>
            </div>
        </div>
    );
}
