"use client";

import Link from "next/link";
import { AtSign,Briefcase,Database,GraduationCap,Mail,Phone } from "lucide-react";

interface InfoCardsProps {
    batch: string | null;
    attemptDue: string | null;
    location: string | null;
    dob: string | null;
    plan: string | null;
    firm: string | null;
    firmRole: string | null;
    articleshipYear: number | null;
    articleshipTotal: number | null;
    email: string | null;
    phone: string | null;
    storageUsed: number;
    storageLimit: number;
}

export function InfoCards(props: InfoCardsProps) {
    const articleshipProgress = props.articleshipYear && props.articleshipTotal 
        ? Math.round((props.articleshipYear / props.articleshipTotal) * 100) 
        : 0;
    
    const storageProgress = props.storageLimit > 0 
        ? Math.round((props.storageUsed / props.storageLimit) * 100) 
        : 0;
    const normalizedPlan = props.plan?.trim().toUpperCase() || "FREE";
    const planStatusLabel = normalizedPlan === "PRO"
        ? "Premium"
        : normalizedPlan === "ELITE"
            ? "Elite"
            : normalizedPlan === "ENTERPRISE"
                ? "Enterprise"
                : "Free";
    const planStatusActionLabel = normalizedPlan === "FREE" ? "View Pricing" : "Manage Plan";

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-outfit">
            {/* Student Details */}
            <Card icon={<GraduationCap className="w-5 h-5" />} title="Student Details">
                <DetailItem label="Batch" value={props.batch || "Not Set"} />
                <DetailItem label="Attempt Due" value={props.attemptDue || "Not Set"} />
                <DetailItem label="Location" value={props.location || "Not Set"} />
                <DetailItem label="DOB" value={props.dob || "Not Set"} />
            </Card>

            {/* Professional Info */}
            <Card icon={<Briefcase className="w-5 h-5" />} title="Professional Info">
                <DetailItem label="Firm" value={props.firm || "Not Set"} />
                <DetailItem label="Role" value={props.firmRole || "Not Set"} />
                <div className="pt-4 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Articleship</span>
                        <span className="text-slate-900">Year {props.articleshipYear || 0} of {props.articleshipTotal || 3}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-50 rounded-full border border-slate-100 overflow-hidden">
                        <div 
                            className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                            style={{ width: `${articleshipProgress}%` }}
                        />
                    </div>
                </div>
            </Card>

            {/* Contact */}
            <Card icon={<AtSign className="w-5 h-5" />} title="Contact">
                <div className="space-y-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Email</p>
                        <a href={`mailto:${props.email}`} className="text-indigo-600 font-bold hover:underline break-all block">{props.email}</a>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Phone</p>
                        <p className="text-slate-900 font-bold">{props.phone}</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">
                            <Mail className="w-4 h-4" />
                        </button>
                        <button className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">
                            <Phone className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </Card>

            {/* Storage Details */}
            <Card icon={<Database className="w-5 h-5" />} title="Storage Detail">
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Usage</p>
                            <p className="text-2xl font-black text-slate-900 tracking-tighter">{storageProgress}%</p>
                        </div>
                        <p className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 uppercase tracking-widest">
                            {props.storageUsed < props.storageLimit * 0.9 ? "Active" : "Full"}
                        </p>
                    </div>
                    <div className="h-2 w-full bg-slate-50 rounded-full border border-slate-100 overflow-hidden shadow-inner">
                        <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-1000"
                            style={{ width: `${storageProgress}%` }}
                        />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {Math.round(props.storageUsed / 1024 / 1024)}MB / {Math.round(props.storageLimit / 1024 / 1024)}MB Available
                    </p>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Plan Status</p>
                                <p className="mt-1 text-sm font-black tracking-tight text-slate-900">{planStatusLabel}</p>
                            </div>
                            <span className="rounded-full border border-indigo-100 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-500">
                                {normalizedPlan}
                            </span>
                        </div>
                        <Link
                            href="/pricing"
                            className="mt-4 inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-indigo-700"
                        >
                            {planStatusActionLabel}
                        </Link>
                    </div>
                </div>
            </Card>
        </div>
    );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col gap-6 group hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                    {icon}
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">{title}</h3>
            </div>
            <div className="flex-1 space-y-4">
                {children}
            </div>
        </div>
    );
}

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-center py-0.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
            <span className="text-slate-900 font-bold text-sm tracking-tight">{value}</span>
        </div>
    );
}
