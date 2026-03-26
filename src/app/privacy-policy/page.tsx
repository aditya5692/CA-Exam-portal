import { GraduationCap } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export default function PrivacyPolicyPage() {
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
                    <h1 className="font-outfit text-4xl font-black tracking-tight text-[var(--landing-text)] mb-8">Privacy Policy</h1>
                    
                    <p className="text-[var(--landing-muted)] mb-8">
                        Last Updated: March 26, 2026
                    </p>

                    <section className="mb-10">
                        <h2 className="text-xl font-black text-[var(--landing-text)] mb-4">1. Information We Collect</h2>
                        <p className="text-[var(--landing-muted)] leading-relaxed mb-4">
                            We collect information you provide directly to us when you register for an account, such as your name, email address, phone number, CA level, and date of birth. We also collect usage data when you attempt mock tests or PYQs.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-xl font-black text-[var(--landing-text)] mb-4">2. How We Use Your Information</h2>
                        <p className="text-[var(--landing-muted)] leading-relaxed mb-4">
                            We use the collected information to:
                        </p>
                        <ul className="list-disc pl-6 text-[var(--landing-muted)] space-y-2">
                            <li>Provide, maintain, and improve our services.</li>
                            <li>Personalize your learning experience and analytics.</li>
                            <li>Process your transactions and send related information.</li>
                            <li>Send technical notices, updates, and security alerts.</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-xl font-black text-[var(--landing-text)] mb-4">3. Data Security</h2>
                        <p className="text-[var(--landing-muted)] leading-relaxed mb-4">
                            We implement commercially reasonable security measures to protect your personal information from unauthorized access, disclosure, or destruction. We use industry-standard encryption for all data transmissions.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-xl font-black text-[var(--landing-text)] mb-4">4. Payment Processing</h2>
                        <p className="text-[var(--landing-muted)] leading-relaxed mb-4">
                            We use Razorpay for payment processing. We do not store your credit card or debit card details on our servers. All payment information is processed securely by Razorpay in compliance with PCI-DSS standards.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-xl font-black text-[var(--landing-text)] mb-4">5. Contact Information</h2>
                        <p className="text-[var(--landing-muted)] leading-relaxed">
                            For any questions about this Privacy Policy, please contact us at <a href="mailto:support@financly.in" className="text-[var(--landing-accent)] font-bold">support@financly.in</a>.
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
