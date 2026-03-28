import { getSessionPayload } from "@/lib/auth/session";
import { ArrowRight, CheckCircle, Rocket, Star } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

type PaymentSuccessPageProps = {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readSingleParam(value: string | string[] | undefined, fallback: string) {
    if (Array.isArray(value)) {
        return value[0] ?? fallback;
    }

    return value ?? fallback;
}

export default async function PaymentSuccessPage({ searchParams }: PaymentSuccessPageProps) {
    const params = searchParams ? await searchParams : {};
    const session = await getSessionPayload();
    const planName = readSingleParam(params.plan, "your selected plan");
    const dashboardHref = session?.role === "TEACHER" ? "/teacher/dashboard" : "/student/dashboard";
    const workspaceHref = session?.role === "TEACHER" ? "/teacher/plan" : "/exam/war-room";
    const workspaceLabel = session?.role === "TEACHER" ? "Open Billing Hub" : "Explore War Room";

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-6">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-emerald-100/30 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-emerald-100/30 blur-[120px]" />
            </div>

            <div className="relative w-full max-w-2xl">
                <div className="group relative overflow-hidden rounded-[48px] bg-white p-12 text-center shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent opacity-0 transition-opacity duration-1000 group-hover:opacity-100" />

                    <div className="relative mb-10 inline-block">
                        <div className="flex h-24 w-24 items-center justify-center rounded-[32px] bg-emerald-500 text-white shadow-[0_20px_40px_-5px_rgba(16,185,129,0.3)]">
                            <CheckCircle size={48} weight="bold" />
                        </div>
                        <div className="absolute -right-4 -top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-500 shadow-lg">
                            <Star size={20} weight="fill" />
                        </div>
                    </div>

                    <div className="relative mb-12 space-y-4">
                        <h1 className="font-outfit text-4xl font-black tracking-tighter text-slate-900 md:text-5xl">
                            Payment <span className="text-emerald-500">Authorized</span>
                        </h1>
                        <p className="mx-auto max-w-md text-lg font-medium text-slate-500">
                            Welcome to <span className="font-bold text-slate-900">{planName}</span>. Your workspace access has been updated.
                        </p>
                    </div>

                    <div className="relative mb-12 grid gap-6 md:grid-cols-3">
                        <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
                            <Rocket size={24} weight="bold" className="mx-auto mb-3 text-emerald-500" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Activation Queued</p>
                        </div>
                        <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
                            <CheckCircle size={24} weight="bold" className="mx-auto mb-3 text-emerald-500" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Premium Tools</p>
                        </div>
                        <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
                            <Star size={24} weight="bold" className="mx-auto mb-3 text-emerald-500" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Webhook Sync</p>
                        </div>
                    </div>

                    <div className="relative flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Link
                            href={dashboardHref}
                            className="group flex w-full items-center justify-center gap-3 rounded-[24px] bg-slate-900 px-10 py-5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-slate-200 transition-all hover:bg-slate-800 sm:w-auto"
                        >
                            Enter Dashboard
                            <ArrowRight size={20} weight="bold" className="transition-transform group-hover:translate-x-1" />
                        </Link>
                        <Link
                            href={workspaceHref}
                            className="w-full rounded-[24px] border border-slate-200 bg-white px-10 py-5 text-xs font-black uppercase tracking-[0.2em] text-slate-600 transition-all hover:bg-slate-50 sm:w-auto"
                        >
                            {workspaceLabel}
                        </Link>
                    </div>
                </div>

                <div className="mt-10 space-y-2 text-center opacity-50">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Transaction Secured by Razorpay</p>
                    <p className="text-[10px] font-bold text-slate-400">Webhook confirmation refreshes premium access automatically.</p>
                </div>
            </div>
        </div>
    );
}
