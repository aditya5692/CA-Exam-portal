import { PricingCards } from "@/components/subscription/pricing-cards";
import { getSessionPayload } from "@/lib/auth/session";
import { getCurrentUserPlanSummary } from "@/lib/server/plan-entitlements";
import { CheckCircle,CreditCard,Crown,Info,ShieldCheck,Sparkle } from "@phosphor-icons/react/dist/ssr";
import { redirect } from "next/navigation";

export default async function TeacherPlanPage() {
    const session = await getSessionPayload();
    if (!session || session.role !== "TEACHER") redirect("/auth/login");

    const isPro = session.plan === "PRO";
    const planSummary = await getCurrentUserPlanSummary(session.userId);

    return (
        <div className="space-y-10 pb-24 w-full max-w-[1280px] mx-auto font-outfit animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.2)]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Subscription Ledger</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tighter text-slate-900">Educator Plan</h1>
                    <p className="text-slate-500 font-medium text-sm font-sans max-w-2xl leading-relaxed">
                        Manage your licensing, billing cycles, and premium feature access protocols. Unlock mission-critical tools for high-performance instruction.
                    </p>
                </div>
            </div>

            {/* Status Banner - Premium Card */}
            <div className="relative overflow-hidden rounded-[32px] bg-slate-900 p-8 text-white shadow-2xl group border border-slate-800">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none transition-all duration-1000 group-hover:bg-indigo-500/20" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-8">
                        <div className={cn(
                            "w-20 h-20 rounded-[28px] flex items-center justify-center shadow-2xl relative transition-transform group-hover:scale-110 duration-500",
                            isPro ? "bg-indigo-600 text-white shadow-indigo-500/20" : "bg-slate-800 text-slate-400 border border-slate-700"
                        )}>
                            {isPro ? (
                                <>
                                    <Crown size={40} weight="fill" className="absolute -top-2 -right-2 text-amber-400 animate-bounce" />
                                    <Sparkle size={36} weight="bold" className="animate-pulse" />
                                </>
                            ) : (
                                <ShieldCheck size={36} weight="bold" />
                            )}
                        </div>
                        
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Current License Status</p>
                            <h2 className="text-3xl font-bold tracking-tighter">
                                {isPro ? "Educator PRO Protocol" : "Standard Entry License"}
                            </h2>
                            <p className="text-slate-400 font-medium text-sm max-w-md">
                                {isPro 
                                    ? "Full spectrum access enabled. All AI-extraction and analytics modules active." 
                                    : "Limited resource allocation active. Upgrade to PRO for neural extraction and unlimited segments."}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center md:items-end gap-3">
                         {isPro ? (
                             <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-black text-[10px] uppercase tracking-widest backdrop-blur-md">
                                 <CheckCircle size={18} weight="bold" /> Access: Fully Tokenized
                             </div>
                         ) : (
                             <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-[10px] uppercase tracking-widest backdrop-blur-md">
                                 <Info size={18} weight="bold" /> Expansion Required
                             </div>
                         )}
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Billing Cycle: Active Monthly</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
                <div className="rounded-[32px] border border-slate-100 bg-white/80 p-8 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Capacity Envelope</p>
                    <div className="mt-6 grid grid-cols-2 gap-4">
                        <div className="rounded-2xl bg-slate-50 p-4">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Storage Used</div>
                            <div className="mt-2 text-2xl font-black tracking-tight text-slate-900">{Math.round(planSummary.storageUsed / 1024 / 1024)} MB</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Storage Limit</div>
                            <div className="mt-2 text-2xl font-black tracking-tight text-slate-900">{Math.round(planSummary.storageLimit / 1024 / 1024)} MB</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Support Tier</div>
                            <div className="mt-2 text-lg font-black tracking-tight text-slate-900">{planSummary.supportTier}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Entitled Floor</div>
                            <div className="mt-2 text-lg font-black tracking-tight text-slate-900">{Math.round(planSummary.entitledStorageLimit / 1024 / 1024)} MB</div>
                        </div>
                    </div>
                    <div className="mt-6">
                        <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>Utilization</span>
                            <span>{planSummary.storageUsagePercent}%</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-indigo-600" style={{ width: `${planSummary.storageUsagePercent}%` }} />
                        </div>
                    </div>
                </div>

                <div className="rounded-[32px] border border-slate-100 bg-white/80 p-8 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Deployment Entitlements</p>
                    <div className="mt-6 space-y-3">
                        {planSummary.featureHighlights.map((feature) => (
                            <div key={feature} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                                {feature}
                            </div>
                        ))}
                        {planSummary.restrictions.length > 0 && planSummary.restrictions.map((restriction) => (
                            <div key={restriction} className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                                {restriction}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Pricing / Upgrade Component Section */}
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                         <CreditCard size={20} weight="bold" />
                     </div>
                     <h3 className="text-2xl font-bold tracking-tighter text-slate-900">Available Deployments</h3>
                </div>
                
                <div className="bg-white/80 backdrop-blur-md rounded-[32px] p-8 lg:p-10 border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
                    <PricingCards userPlan={session.plan} userRole={session.role} />
                </div>
            </div>
        </div>
    );
}

const cn = (...args: Array<string | false | null | undefined>) => args.filter(Boolean).join(" ");
