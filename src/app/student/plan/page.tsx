import { getMySubscription } from "@/actions/subscription-actions";
import { cancelRecurringSubscription } from "@/actions/razorpay-subscription-actions";
import { PricingCards } from "@/components/subscription/pricing-cards";
import { getSessionPayload } from "@/lib/auth/session";
import { buildPlanSummary, getCurrentUserPlanSummary, planIncludesAtLeast, resolvePlanEntitlement } from "@/lib/server/plan-entitlements";
import { CheckCircle, Clock, RefreshCw, ShieldCheck, Sparkle, XCircle } from "lucide-react";
import { redirect } from "next/navigation";

function formatDate(date: Date | null) {
    if (!date) {
        return null;
    }

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

export default async function StudentPlanPage() {
    const session = await getSessionPayload();
    if (!session || session.role !== "STUDENT") redirect("/auth/login");

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

    const subscriptionResponse = await getMySubscription().catch(() => null);
    const latestSubscription = subscriptionResponse?.success ? subscriptionResponse.data : null;

    const subscriptionExpiresAt = latestSubscription ? new Date(latestSubscription.expiresAt) : null;
    const currentPeriodEnd = latestSubscription?.currentPeriodEnd
        ? new Date(latestSubscription.currentPeriodEnd)
        : null;
    const isExpired = subscriptionExpiresAt ? subscriptionExpiresAt < new Date() : false;
    const hasPremiumAccess = planSummary.isPremium && !isExpired;
    const hasProAccess = planIncludesAtLeast(planSummary.plan, session.role, "PRO");
    const recurringSubscriptionId = latestSubscription?.razorpaySubscriptionId ?? null;
    const isRecurringSubscription = Boolean(recurringSubscriptionId);
    const isCancellationScheduled = Boolean(
        latestSubscription?.cancelAtPeriodEnd &&
        currentPeriodEnd &&
        currentPeriodEnd > new Date(),
    );
    const showRetryPayment = Boolean(
        latestSubscription &&
        !hasPremiumAccess &&
        ["FAILED", "PENDING", "CANCELLED"].includes(latestSubscription.status),
    );
    async function cancelAction(subscriptionId: string) {
        "use server";

        await cancelRecurringSubscription(subscriptionId);
    }

    const expiryDate = formatDate(subscriptionExpiresAt);
    const startDate = latestSubscription ? formatDate(new Date(latestSubscription.startedAt)) : null;
    const currentPeriodEndDate = formatDate(currentPeriodEnd);
    const recommendedPlanName = planSummary.recommendedPlan
        ? resolvePlanEntitlement(planSummary.recommendedPlan, session.role).displayName
        : null;

    return (
        <div className="mx-auto max-w-7xl animate-in space-y-12 p-8 fade-in duration-500 pb-24">
            <div>
                <h1 className="mb-2 text-3xl font-bold text-gray-900">My Subscription</h1>
                <p className="text-gray-500">Manage your billing status and unlock premium features.</p>
            </div>

            {planStatusNotice && (
                <div className="rounded-lg border border-amber-100 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-700">
                    {planStatusNotice}
                </div>
            )}

            {latestSubscription?.status === "FAILED" && (
                <div className="rounded-lg border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
                    Your last payment attempt failed. You can retry below without creating a new account.
                </div>
            )}

            {latestSubscription?.status === "PENDING" && (
                <div className="rounded-lg border border-sky-100 bg-sky-50 px-5 py-4 text-sm font-semibold text-sky-700">
                    Payment authorization is still in progress. If you closed checkout midway, you can retry below.
                </div>
            )}

            {isCancellationScheduled && currentPeriodEndDate && (
                <div className="rounded-lg border border-amber-100 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-700">
                    Your subscription will cancel at the end of the current billing cycle. Premium access remains active until {currentPeriodEndDate}.
                </div>
            )}

            <div
                className={`rounded-lg border p-6 ${
                    hasPremiumAccess
                        ? "border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50"
                        : "border-gray-200 bg-gray-50"
                }`}
            >
                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                    <div className="flex items-center gap-4">
                        <div
                            className={`flex h-14 w-14 items-center justify-center rounded-lg shadow-md ${
                                hasPremiumAccess ? "bg-indigo-600 text-white" : "bg-gray-400 text-white"
                            }`}
                        >
                            {hasPremiumAccess
                                ? <Sparkle className="h-7 w-7 animate-pulse" />
                                : <ShieldCheck className="h-7 w-7" />}
                        </div>
                        <div>
                            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-500">Current Status</p>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {hasPremiumAccess
                                    ? `${planSummary.displayName} - Active`
                                    : latestSubscription?.status === "FAILED"
                                        ? "Payment Failed"
                                        : latestSubscription?.status === "PENDING"
                                            ? "Payment Pending"
                                            : isExpired
                                                ? `${planSummary.displayName} - Expired`
                                                : "Free Plan"}
                            </h2>
                            {latestSubscription && (
                                <div className="mt-2 flex flex-wrap items-center gap-4">
                                    {startDate && (
                                        <span className="text-xs font-medium text-gray-500">
                                            Started: {startDate}
                                        </span>
                                    )}
                                    {expiryDate && (
                                        <span className={`flex items-center gap-1 text-xs font-bold ${isExpired ? "text-red-600" : "text-emerald-600"}`}>
                                            {isExpired ? <XCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                                            {isCancellationScheduled && currentPeriodEndDate
                                                ? `Access until ${currentPeriodEndDate}`
                                                : isExpired
                                                    ? `Expired on ${expiryDate}`
                                                    : `Active until ${expiryDate}`}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {hasPremiumAccess && (
                            <div className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-white px-5 py-2.5 text-sm font-bold text-indigo-700 shadow-sm">
                                <CheckCircle className="h-4 w-4" /> {hasProAccess ? "Full Access Active" : "Premium Access Active"}
                            </div>
                        )}

                        {showRetryPayment && (
                            <a
                                href="#plans"
                                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-700 active:scale-95"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Retry Payment
                            </a>
                        )}

                        {!showRetryPayment && (
                            <a
                                href="#plans"
                                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-700 active:scale-95"
                            >
                                <RefreshCw className="h-4 w-4" />
                                {!hasPremiumAccess
                                    ? (isExpired ? "Renew or Upgrade" : "Compare Plans")
                                    : planSummary.canUpgrade && recommendedPlanName
                                        ? `Move to ${recommendedPlanName}`
                                        : "Renew Early"}
                            </a>
                        )}

                        {hasPremiumAccess && isRecurringSubscription && !latestSubscription?.cancelAtPeriodEnd && recurringSubscriptionId && (
                            <form action={cancelAction.bind(null, recurringSubscriptionId)}>
                                <button
                                    type="submit"
                                    className="rounded-lg border border-rose-200 bg-white px-6 py-2.5 text-sm font-bold text-rose-600 transition-all hover:bg-rose-50"
                                >
                                    Cancel Subscription
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Plan Summary</p>
                    <div className="mt-5 grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-slate-50 p-4">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Storage Used</div>
                            <div className="mt-2 text-2xl font-bold text-slate-900">{Math.round(planSummary.storageUsed / 1024 / 1024)} MB</div>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-4">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Plan Limit</div>
                            <div className="mt-2 text-2xl font-bold text-slate-900">{Math.round(planSummary.storageLimit / 1024 / 1024)} MB</div>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-4">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Support Tier</div>
                            <div className="mt-2 text-lg font-bold text-slate-900">{planSummary.supportTier}</div>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-4">
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

                <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">What This Plan Unlocks</p>
                    <div className="mt-5 space-y-3">
                        {planSummary.featureHighlights.map((feature) => (
                            <div key={feature} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                                {feature}
                            </div>
                        ))}
                        {planSummary.restrictions.length > 0 && planSummary.restrictions.map((restriction) => (
                            <div key={restriction} className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                                {restriction}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div id="plans">
                <h3 className="mb-6 text-xl font-bold text-gray-900">Available Plans</h3>
                <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm md:p-10">
                    <PricingCards userPlan={planSummary.plan} userRole={session.role} />
                </div>
            </div>
        </div>
    );
}
