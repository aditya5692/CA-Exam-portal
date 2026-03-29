const POLICY_POINTS = [
    "Digital subscription and content purchases are generally non-refundable once access is granted.",
    "Recurring subscriptions can be cancelled before the next cycle, but the active billing period remains usable until it ends.",
    "Exceptional cases like duplicate charges or persistent technical inaccessibility may be reviewed manually.",
    "Approved refunds should be routed back through the original payment method and may take 5 to 7 business days to reflect.",
];

export default function RefundPolicyPage() {
    return (
        <div className="space-y-8">
            <section className="rounded-[40px] border border-[var(--landing-border)] bg-[var(--landing-panel)] p-8 shadow-sm sm:p-12">
                <div className="space-y-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--landing-muted)]">
                        Refund and cancellation policy
                    </div>
                    <h1 className="font-outfit text-4xl font-black tracking-tight text-[var(--landing-text)] sm:text-5xl">
                        Refund expectations for digital access
                    </h1>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--landing-muted)]">
                        Last updated: March 29, 2026
                    </p>
                </div>
            </section>

            <section className="grid gap-5">
                {POLICY_POINTS.map((point, index) => (
                    <div
                        key={point}
                        className="rounded-[32px] border border-[var(--landing-border)] bg-[var(--landing-panel)] p-6 shadow-sm sm:p-8"
                    >
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--landing-muted)]">
                            Clause {index + 1}
                        </div>
                        <p className="mt-3 max-w-4xl text-sm leading-8 text-[var(--landing-muted)]">
                            {point}
                        </p>
                    </div>
                ))}
            </section>
        </div>
    );
}
