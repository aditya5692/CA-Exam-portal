import { SubscriptionManager } from "@/components/teacher/subscription-manager";
import { getSessionPayload } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function AdminSubscriptionsPage() {
    const session = await getSessionPayload();
    if (!session || (session.role !== "ADMIN" && !session.isSuperAdmin)) {
        redirect("/teacher/dashboard");
    }

    return (
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8">
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Admin Panel</p>
                <h1 className="text-2xl font-black text-slate-900">Subscription Management</h1>
                <p className="text-sm text-slate-500 mt-1">
                    View all subscriptions, cancel access, and manually grant plans.
                </p>
            </div>

            <SubscriptionManager />
        </div>
    );
}
