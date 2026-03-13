import { getSessionPayload } from "@/lib/auth/session";
import { PricingCards } from "@/components/subscription/pricing-cards";
import { redirect } from "next/navigation";
import { ShieldCheck, Sparkle, CheckCircle } from "lucide-react";

export default async function TeacherPlanPage() {
    const session = await getSessionPayload();
    if (!session || session.role !== "TEACHER") redirect("/auth/login");

    const isPro = session.plan === "PRO";

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500 pb-24">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    My Subscription Plan
                </h1>
                <p className="text-gray-500">
                    Manage your current billing status and unlock premium educator features.
                </p>
            </div>

            {/* Status Banner */}
            <div className={`p-6 rounded-2xl border ${isPro ? "bg-indigo-50 border-indigo-100" : "bg-gray-50 border-gray-200"} flex items-center justify-between`}>
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isPro ? "bg-indigo-600 text-white" : "bg-gray-400 text-white"}`}>
                        {isPro ? <Sparkle className="w-6 h-6 animate-pulse" /> : <ShieldCheck className="w-6 h-6" />}
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Current Status</p>
                        <h2 className="text-xl font-bold text-gray-900">
                            {isPro ? "Educator PRO Active" : "Basic Free Access"}
                        </h2>
                    </div>
                </div>
                {isPro && (
                    <div className="flex items-center gap-2 text-indigo-700 bg-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm border border-indigo-100">
                        <CheckCircle className="w-4 h-4" /> Fully Unlocked
                    </div>
                )}
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
