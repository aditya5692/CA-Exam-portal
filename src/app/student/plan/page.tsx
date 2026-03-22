import { PricingCards } from "@/components/subscription/pricing-cards";
import { getSessionPayload } from "@/lib/auth/session";
import { buildPlanSummary, getCurrentUserPlanSummary } from "@/lib/server/plan-entitlements";
import { getMySubscription } from "@/actions/subscription-actions";
import { CheckCircle, Clock, RefreshCw, ShieldCheck, Sparkle, XCircle } from "lucide-react";
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
        planStatusNotice = "Live plan metrics are temporarily unavailable.";
    }

    // Fetch live subscription via action (safe with adapter-based prisma)
    const subRes = await getMySubscription().catch(() => null);
    const activeSub = subRes?.success ? subRes.data : null;

    const isExpired = activeSub ? new Date(activeSub.expiresAt) < new Date() : false;
    const expiryDate = activeSub
        ? new Date(activeSub.expiresAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
        })
        : null;
    const startDate = activeSub
        ? new Date(activeSub.startedAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
        })
        : null;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500 pb-24">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">My Subscription</h1>
                <p className="text-gray-500">Manage your billing status and unlock premium features.</p>
            </div>

            {planStatusNotice && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-700">
                    {planStatusNotice}
                </div>
            )}

            {/* Live Subscription Status Card */}
            <div className={`rounded-2xl border p-6 ${
                isPro && !isExpired
                    ? "bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200"
                    : "bg-gray-50 border-gray-200"
            }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${
                            isPro && !isExpired ? "bg-indigo-600 text-white" : "bg-gray-400 text-white"
                        }`}>
                            {isPro && !isExpired
                                ? <Sparkle className="w-7 h-7 animate-pulse" />
                                : <ShieldCheck className="w-7 h-7" />}
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Current Status</p>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {isPro && !isExpired ? "CA Pass PRO — Active" : isPro && isExpired ? "CA Pass PRO — Expired" : "Free Plan"}
                            </h2>
                            {activeSub && (
                                <div className="flex items-center gap-4 mt-2">
                                    {startDate && (
                                        <span className="text-xs font-medium text-gray-500">
                                            Started: {startDate}
                                        </span>
                                    )}
                                    {expiryDate && (
                                        <span className={`flex items-center gap-1 text-xs font-bold ${isExpired ? "text-red-600" : "text-emerald-600"}`}>
                                            {isExpired ? <XCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                            {isExpired ? `Expired on ${expiryDate}` : `Active until ${expiryDate}`}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isPro && !isExpired && (
                            <div className="flex items-center gap-2 text-indigo-700 bg-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm border border-indigo-100">
                                <CheckCircle className="w-4 h-4" /> Fully Unlocked
                            </div>
                        )}
                        {/* Renew / Upgrade button — shown when expired or never subscribed */}
                        {(!isPro || isExpired) && (
                            <a
                                href="#plans"
                                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                            >
                                <RefreshCw className="w-4 h-4" />
                                {isExpired ? "Renew Plan" : "Upgrade to PRO"}
                            </a>
                        )}
                        {isPro && !isExpired && (
                            <a
                                href="#plans"
                                className="flex items-center gap-2 bg-white text-indigo-600 border border-indigo-200 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-all"
                            >
                                <RefreshCw className="w-4 h-4" /> Renew Early
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Plan Summary Grid */}
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
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Entitled Storage</div>
                            <div className="mt-2 text-lg font-bold text-slate-900">{Math.round(planSummary.entitledStorageLimit / 1024 / 1024)} MB</div>
                        </div>
                    </div>
                    <div className="mt-5">
                        <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            <span>Storage Utilization</span>
                            <span>{planSummary.storageUsagePercent}%</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-indigo-600 transition-all duration-700" style={{ width: `${planSummary.storageUsagePercent}%` }} />
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
            <div id="plans">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Available Plans</h3>
                <div className="bg-white rounded-3xl p-6 md:p-10 border border-gray-100 shadow-sm">
                    <PricingCards userPlan={session.plan} userRole={session.role} />
                </div>
            </div>
        </div>
    );
}
