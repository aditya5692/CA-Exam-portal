import { PricingCards } from "@/components/subscription/pricing-cards";
import { getSessionPayload } from "@/lib/auth/session";
import { buildPlanSummary,getCurrentUserPlanSummary } from "@/lib/server/plan-entitlements";
import { CheckCircle,ShieldCheck,Sparkle } from "lucide-react";
import { redirect } from "next/navigation";

export default async function StudentPlanPage() {
    const session = await getSessionPayload();
    if (!session || session.role !== "STUDENT") redirect("/auth/login");

    const isPro = session.plan === "PRO";
    let planSummary = buildPlanSummary({
        plan: session.plan,
        role: session.role,
        storageUsed: 0,
        storageLimit: 0,
    });
    let planStatusNotice: string | null = null;

    try {
        planSummary = await getCurrentUserPlanSummary(session.userId);
    } catch (error) {
        console.error("StudentPlanPage: failed to load live plan summary", error);
        planStatusNotice = "Live plan metrics are temporarily unavailable. You can still review and activate plans below.";
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500 pb-24">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    My Subscription Plan
                </h1>
                <p className="text-gray-500">
                    Manage your current billing status and unlock premium features.
                </p>
            </div>

            {planStatusNotice && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-700">
                    {planStatusNotice}
                </div>
            )}

            {/* Status Banner */}
            <div className={`p-6 rounded-2xl border ${isPro ? "bg-indigo-50 border-indigo-100" : "bg-gray-50 border-gray-200"} flex items-center justify-between`}>
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isPro ? "bg-indigo-600 text-white" : "bg-gray-400 text-white"}`}>
                        {isPro ? <Sparkle className="w-6 h-6 animate-pulse" /> : <ShieldCheck className="w-6 h-6" />}
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Current Status</p>
                        <h2 className="text-xl font-bold text-gray-900">
                            {isPro ? "CA Pass PRO Active" : "Basic Free Access"}
                        </h2>
                    </div>
                </div>
                {isPro && (
                    <div className="flex items-center gap-2 text-indigo-700 bg-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm border border-indigo-100">
                        <CheckCircle className="w-4 h-4" /> Fully Unlocked
                    </div>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Plan Summary</p>
                    <div className="mt-5 grid grid-cols-2 gap-4">
                        <div className="rounded-2xl bg-slate-50 p-4">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Storage Used</div>
                            <div className="mt-2 text-2xl font-bold text-slate-900">{Math.round(planSummary.storageUsed / 1024 / 1024)} MB</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Plan Limit</div>
                            <div className="mt-2 text-2xl font-bold text-slate-900">{Math.round(planSummary.storageLimit / 1024 / 1024)} MB</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Support Tier</div>
                            <div className="mt-2 text-lg font-bold text-slate-900">{planSummary.supportTier}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Entitled Floor</div>
                            <div className="mt-2 text-lg font-bold text-slate-900">{Math.round(planSummary.entitledStorageLimit / 1024 / 1024)} MB</div>
                        </div>
                    </div>
                    <div className="mt-5">
                        <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            <span>Storage Utilization</span>
                            <span>{planSummary.storageUsagePercent}%</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-indigo-600" style={{ width: `${planSummary.storageUsagePercent}%` }} />
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">What This Plan Unlocks</p>
                    <div className="mt-5 space-y-3">
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

            {/* Pricing / Upgrade Component */}
            <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Available Plans</h3>
                <div className="bg-white rounded-3xl p-6 md:p-10 border border-gray-100 shadow-sm">
                    <PricingCards userPlan={session.plan} userRole={session.role} />
                </div>
            </div>
        </div>
    );
}
