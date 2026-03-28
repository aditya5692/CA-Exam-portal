"use client";

import Link from "next/link";
import { AtSign, Briefcase, Database, GraduationCap, Mail, Phone } from "lucide-react";
import type { ReactNode } from "react";

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
    const publicPlanLabel = normalizedPlan === "BASIC"
        ? "Basic"
        : normalizedPlan === "PRO"
            ? "Pro"
            : normalizedPlan === "ELITE"
                ? "Pro"
                : normalizedPlan === "ENTERPRISE"
                    ? "Enterprise"
                    : "Free";
    const planStatusLabel = normalizedPlan === "PRO" || normalizedPlan === "ELITE"
        ? "Premium"
        : normalizedPlan === "BASIC"
            ? "Growth"
            : normalizedPlan === "ENTERPRISE"
                ? "Enterprise"
                : "Free";
    const planStatusActionLabel = normalizedPlan === "FREE" ? "View Pricing" : "Manage Plan";
    const storageStatus = props.storageUsed < props.storageLimit * 0.9 ? "Active" : "Full";

    return (
        <div className="grid grid-cols-1 gap-6 font-outfit md:grid-cols-2 lg:grid-cols-4">
            <Card icon={<GraduationCap className="h-5 w-5" />} title="Student Details" iconTone="accent">
                <DetailItem label="Batch" value={props.batch || "Not set"} />
                <DetailItem label="Attempt Due" value={props.attemptDue || "Not set"} />
                <DetailItem label="Location" value={props.location || "Not set"} />
                <DetailItem label="DOB" value={props.dob || "Not set"} />
            </Card>

            <Card icon={<Briefcase className="h-5 w-5" />} title="Professional Info" iconTone="warm">
                <DetailItem label="Firm" value={props.firm || "Not set"} />
                <DetailItem label="Role" value={props.firmRole || "Not set"} />
                <div className="space-y-2 pt-4">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[var(--student-muted)]">
                        <span>Articleship</span>
                        <span className="text-[var(--student-text)]">Year {props.articleshipYear || 0} of {props.articleshipTotal || 3}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full border border-[var(--student-border)] bg-[var(--student-panel-muted)]">
                        <div
                            className="h-full rounded-full bg-[var(--student-support)] transition-all duration-1000"
                            style={{ width: `${articleshipProgress}%` }}
                        />
                    </div>
                </div>
            </Card>

            <Card icon={<AtSign className="h-5 w-5" />} title="Contact" iconTone="accent">
                <div className="space-y-4">
                    <div>
                        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-[var(--student-muted)]">Email</p>
                        {props.email ? (
                            <a href={`mailto:${props.email}`} className="block break-all text-sm font-bold text-[var(--student-accent-strong)] hover:underline">
                                {props.email}
                            </a>
                        ) : (
                            <p className="text-sm font-bold text-[var(--student-text)]">Not set</p>
                        )}
                    </div>
                    <div>
                        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-[var(--student-muted)]">Phone</p>
                        <p className="text-sm font-bold text-[var(--student-text)]">{props.phone || "Not set"}</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button className="student-button-secondary flex h-10 w-10 items-center justify-center rounded-xl p-0 text-[var(--student-muted)] transition-colors hover:text-[var(--student-accent-strong)]">
                            <Mail className="h-4 w-4" />
                        </button>
                        <button className="student-button-secondary flex h-10 w-10 items-center justify-center rounded-xl p-0 text-[var(--student-muted)] transition-colors hover:text-[var(--student-accent-strong)]">
                            <Phone className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </Card>

            <Card icon={<Database className="h-5 w-5" />} title="Storage Detail" iconTone="success">
                <div className="space-y-4">
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-[var(--student-muted)]">Usage</p>
                            <p className="text-2xl font-black tracking-tighter text-[var(--student-text)]">{storageProgress}%</p>
                        </div>
                        <p className="rounded-full border border-[var(--student-support-soft-strong)] bg-[var(--student-support-soft)] px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--student-support)]">
                            {storageStatus}
                        </p>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full border border-[var(--student-border)] bg-[var(--student-panel-muted)] shadow-inner">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-[var(--student-accent)] to-[var(--student-support)] transition-all duration-1000"
                            style={{ width: `${storageProgress}%` }}
                        />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--student-muted)]">
                        {Math.round(props.storageUsed / 1024 / 1024)}MB / {Math.round(props.storageLimit / 1024 / 1024)}MB Available
                    </p>
                    <div className="rounded-2xl border border-[var(--student-border)] bg-[var(--student-panel-muted)] px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--student-muted)]">Plan Status</p>
                                <p className="mt-1 text-sm font-black tracking-tight text-[var(--student-text)]">{planStatusLabel}</p>
                            </div>
                            <span className="student-chip-accent rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest">
                                {publicPlanLabel.toUpperCase()}
                            </span>
                        </div>
                        <Link
                            href="/pricing"
                            className="student-button-primary mt-4 inline-flex items-center rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all"
                        >
                            {planStatusActionLabel}
                        </Link>
                    </div>
                </div>
            </Card>
        </div>
    );
}

function Card({
    icon,
    title,
    children,
    iconTone = "accent"
}: {
    icon: ReactNode;
    title: string;
    children: ReactNode;
    iconTone?: "accent" | "warm" | "success";
}) {
    const iconClasses = iconTone === "warm"
        ? "student-icon-tile-warm"
        : iconTone === "success"
            ? "student-icon-tile-success"
            : "student-icon-tile";

    return (
        <div className="student-surface flex flex-col gap-6 rounded-[32px] p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_22px_44px_rgba(55,48,38,0.08)]">
            <div className="flex items-center gap-4">
                <div className={`${iconClasses} flex h-10 w-10 items-center justify-center rounded-xl`}>
                    {icon}
                </div>
                <h3 className="text-lg font-black tracking-tight text-[var(--student-text)]">{title}</h3>
            </div>
            <div className="flex-1 space-y-4">
                {children}
            </div>
        </div>
    );
}

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between py-0.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--student-muted)]">{label}</span>
            <span className="text-right text-sm font-bold tracking-tight text-[var(--student-text)]">{value}</span>
        </div>
    );
}
