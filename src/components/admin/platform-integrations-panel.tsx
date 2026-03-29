"use client";

import { savePlatformConfig } from "@/actions/platform-config-actions";
import { cn } from "@/lib/utils";
import {
    CheckCircle,
    Eye,
    EyeSlash,
    PlugsConnected,
    ShieldCheck,
    WarningCircle,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type PlatformConfigFieldStatus = {
    key: string;
    label: string;
    group: "MSG91" | "RAZORPAY";
    description: string;
    envKeys: readonly string[];
    isSecret: boolean;
    isPublicClientValue: boolean;
    requiredForRuntime: boolean;
    inputType?: "text" | "password";
    value: string;
    source: "database" | "env" | "missing";
    isConfigured: boolean;
};

function sourceBadgeClass(source: PlatformConfigFieldStatus["source"]) {
    if (source === "database") {
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (source === "env") {
        return "border-blue-200 bg-blue-50 text-blue-700";
    }

    return "border-amber-200 bg-amber-50 text-amber-700";
}

export function PlatformIntegrationsPanel({
    initialFields,
}: {
    initialFields: PlatformConfigFieldStatus[];
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});

    const groupedFields = useMemo(() => ({
        MSG91: initialFields.filter((field) => field.group === "MSG91"),
        RAZORPAY: initialFields.filter((field) => field.group === "RAZORPAY"),
    }), [initialFields]);

    const configuredRequiredCount = initialFields.filter((field) => field.requiredForRuntime && field.isConfigured).length;
    const totalRequiredCount = initialFields.filter((field) => field.requiredForRuntime).length;

    function toggleSecretVisibility(key: string) {
        setVisibleSecrets((current) => ({
            ...current,
            [key]: !current[key],
        }));
    }

    function handleSubmit(formData: FormData) {
        setError(null);
        setSuccess(null);

        startTransition(async () => {
            const result = await savePlatformConfig(formData);
            if (!result.success) {
                setError(result.message);
                return;
            }

            setSuccess(result.message || "Platform integrations saved.");
            router.refresh();
        });
    }

    return (
        <div className="space-y-8">
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[32px] border border-[var(--student-border)] bg-[var(--student-panel-muted)] p-6 lg:p-8">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--student-accent-soft)] text-[var(--student-accent-strong)]">
                            <PlugsConnected size={28} weight="bold" />
                        </div>
                        <div className="space-y-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--student-muted)]">
                                Runtime Integrations
                            </div>
                            <h2 className="font-outfit text-3xl font-black tracking-tight text-[var(--student-text)]">
                                Razorpay and MSG91 settings
                            </h2>
                            <p className="max-w-3xl text-sm leading-7 text-[var(--student-muted-strong)]">
                                Values saved here become the platform runtime source for login, signup, payment checkout,
                                and health checks. Existing `.env` values are still used as fallback until you save them into
                                the database once. Server-only secrets are encrypted before they are stored.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-[32px] border border-[var(--student-border)] bg-white p-6 lg:p-8">
                    <div className="flex items-center gap-3">
                        <ShieldCheck size={24} weight="fill" className="text-[var(--student-support)]" />
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--student-muted)]">
                                Runtime Readiness
                            </div>
                            <div className="mt-1 text-2xl font-black tracking-tight text-[var(--student-text)]">
                                {configuredRequiredCount}/{totalRequiredCount}
                            </div>
                        </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-[var(--student-muted-strong)]">
                        Required OTP and payment fields currently configured for runtime.
                    </p>
                    <div className="mt-5 h-3 overflow-hidden rounded-full bg-[var(--student-panel-muted)]">
                        <div
                            className="h-full rounded-full bg-[var(--student-accent-strong)] transition-all duration-500"
                            style={{ width: `${totalRequiredCount === 0 ? 0 : Math.round((configuredRequiredCount / totalRequiredCount) * 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {(error || success) && (
                <div className="space-y-3">
                    {error && (
                        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
                            <WarningCircle size={18} weight="fill" />
                            <span>{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
                            <CheckCircle size={18} weight="fill" />
                            <span>{success}</span>
                        </div>
                    )}
                </div>
            )}

            <form action={handleSubmit} className="space-y-8">
                {(["MSG91", "RAZORPAY"] as const).map((groupKey) => {
                    const fields = groupedFields[groupKey];

                    return (
                        <section key={groupKey} className="rounded-[36px] border border-[var(--student-border)] bg-white p-6 lg:p-8">
                            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                                <div className="space-y-2">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--student-muted)]">
                                        {groupKey === "MSG91" ? "Authentication Channel" : "Payments Channel"}
                                    </div>
                                    <h3 className="font-outfit text-2xl font-black tracking-tight text-[var(--student-text)]">
                                        {groupKey === "MSG91" ? "MSG91 Runtime Keys" : "Razorpay Runtime Keys"}
                                    </h3>
                                </div>
                                <div className="rounded-full border border-[var(--student-border)] bg-[var(--student-panel-muted)] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--student-muted)]">
                                    {fields.filter((field) => field.isConfigured).length}/{fields.length} configured
                                </div>
                            </div>

                            <div className="grid gap-5 lg:grid-cols-2">
                                {fields.map((field) => {
                                    const isSecretVisible = visibleSecrets[field.key];
                                    const inputType = field.isSecret && !isSecretVisible ? "password" : "text";

                                    return (
                                        <div
                                            key={field.key}
                                            className="rounded-[28px] border border-[var(--student-border)] bg-[var(--student-panel-muted)] p-5"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="space-y-2">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <label
                                                            htmlFor={field.key}
                                                            className="text-xs font-black tracking-tight text-[var(--student-text)]"
                                                        >
                                                            {field.label}
                                                        </label>
                                                        <span className={cn(
                                                            "rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em]",
                                                            sourceBadgeClass(field.source),
                                                        )}>
                                                            {field.source}
                                                        </span>
                                                        {field.isPublicClientValue && (
                                                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-slate-600">
                                                                public
                                                            </span>
                                                        )}
                                                        {field.requiredForRuntime && (
                                                            <span className="rounded-full border border-[var(--student-support-soft-strong)] bg-[var(--student-support-soft)] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-[var(--student-support)]">
                                                                required
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm leading-6 text-[var(--student-muted-strong)]">
                                                        {field.description}
                                                    </p>
                                                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--student-muted)]">
                                                        Env fallback: {field.envKeys.join(" or ")}
                                                    </div>
                                                </div>
                                                {field.isSecret && (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleSecretVisibility(field.key)}
                                                        className="rounded-xl border border-[var(--student-border)] bg-white p-2 text-[var(--student-muted)] transition-colors hover:text-[var(--student-text)]"
                                                    >
                                                        {isSecretVisible ? <EyeSlash size={18} weight="bold" /> : <Eye size={18} weight="bold" />}
                                                    </button>
                                                )}
                                            </div>

                                            <div className="mt-4">
                                                <input
                                                    id={field.key}
                                                    name={field.key}
                                                    type={inputType}
                                                    defaultValue={field.value}
                                                    placeholder={`Enter ${field.label}`}
                                                    className="w-full rounded-2xl border border-[var(--student-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--student-text)] outline-none transition-all placeholder:text-[var(--student-muted)] focus:border-[var(--student-accent-soft-strong)] focus:ring-4 focus:ring-[var(--student-accent-soft)]/60"
                                                    autoComplete="off"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    );
                })}

                <div className="flex flex-col gap-4 rounded-[32px] border border-[var(--student-border)] bg-[var(--student-panel-muted)] p-6 lg:flex-row lg:items-center lg:justify-between">
                    <p className="max-w-3xl text-sm leading-7 text-[var(--student-muted-strong)]">
                        Saving here stores the current values into the application database. Once that row exists,
                        Dokploy no longer needs separate MSG91 and Razorpay runtime env entries for normal operation.
                        Keep env fallbacks available for disaster recovery and rotate any exposed live credentials immediately.
                    </p>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="rounded-2xl bg-[var(--student-accent-strong)] px-6 py-4 text-[10px] font-black uppercase tracking-[0.24em] text-white shadow-lg shadow-[var(--student-accent-strong)]/20 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
                    >
                        {isPending ? "Saving Runtime Config..." : "Save Runtime Config"}
                    </button>
                </div>
            </form>
        </div>
    );
}
