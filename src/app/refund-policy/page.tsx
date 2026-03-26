import { GraduationCap } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export default function RefundPolicyPage() {
    return (
        <div className="min-h-screen bg-[var(--landing-bg)] text-[var(--landing-text)] font-medium selection:bg-[var(--landing-selection-bg)] selection:text-[var(--landing-accent)]">
            <header className="sticky top-0 z-50 border-b border-[var(--landing-border)] bg-[var(--landing-panel)]/80 backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--landing-text)] text-[var(--landing-warm)]">
                            <GraduationCap size={22} weight="bold" />
                        </div>
                        <div>
                            <div className="font-outfit text-xl font-black tracking-tight text-[var(--landing-text)]">Financly</div>
                            <div className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--landing-muted)]">CA Exam Workspace</div>
                        </div>
                    </Link>
                    <Link href="/auth/login" className="text-sm font-bold text-[var(--landing-accent)] hover:underline">
                        Sign In
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-3xl px-6 py-16">
                <article className="prose prose-slate max-w-none">
                    <h1 className="font-outfit text-4xl font-black tracking-tight text-[var(--landing-text)] mb-8">Refund & Cancellation Policy</h1>
                    
                    <p className="text-[var(--landing-muted)] mb-8">
                        Last Updated: March 26, 2026
                    </p>

                    <section className="mb-10">
                        <h2 className="text-xl font-black text-[var(--landing-text)] mb-4">1. No Refund Policy</h2>
                        <p className="text-[var(--landing-muted)] leading-relaxed mb-4">
                            Due to the digital nature of our CA exam materials and immediate access provided to premium features, payments made for subscriptions or individual materials are generally <strong className="text-[var(--landing-text)]">non-refundable</strong>.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-xl font-black text-[var(--landing-text)] mb-4">2. Cancellation of Subscription</h2>
                        <p className="text-[var(--landing-muted)] leading-relaxed mb-4">
                            You may cancel your recurring subscription at any time. Upon cancellation, you will continue to have access to premium features until the end of your current billing period. No partial refunds will be issued for the remaining time in the billing cycle.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-xl font-black text-[var(--landing-text)] mb-4">3. Exceptional Cases</h2>
                        <p className="text-[var(--landing-muted)] leading-relaxed mb-4">
                            In exceptional cases, such as technical failures where the material remains inaccessible after multiple support attempts, or accidental double payments, we may consider refund requests at our sole discretion.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-xl font-black text-[var(--landing-text)] mb-4">4. Refund Processing Time</h2>
                        <p className="text-[var(--landing-muted)] leading-relaxed mb-4">
                            If a refund is approved, it will be processed through the same payment method (Razorpay) originally used. It typically takes <strong className="text-[var(--landing-text)]">5-7 business days</strong> for the amount to reflect in your account.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-xl font-black text-[var(--landing-text)] mb-4">5. Contact Support</h2>
                        <p className="text-[var(--landing-muted)] leading-relaxed">
                            For any refund or cancellation queries, please write to us at <a href="mailto:support@financly.in" className="text-[var(--landing-accent)] font-bold">support@financly.in</a>.
                        </p>
                    </section>
                </article>
            </main>

            <footer className="border-t border-[var(--landing-border)] bg-[var(--landing-panel)] py-12">
                <div className="mx-auto max-w-7xl px-6 text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--landing-muted-light)]">
                        © {new Date().getFullYear()} Financly CA Exam Workspace.
                    </p>
                </div>
            </footer>
        </div>
    );
}
