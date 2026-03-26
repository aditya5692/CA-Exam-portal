import { GraduationCap } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export default function TermsAndConditionsPage() {
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
                    <h1 className="font-outfit text-4xl font-black tracking-tight text-[var(--landing-text)] mb-8">Terms & Conditions</h1>
                    
                    <p className="text-[var(--landing-muted)] mb-8">
                        Effective Date: March 26, 2026
                    </p>

                    <section className="mb-10">
                        <h2 className="text-xl font-black text-[var(--landing-text)] mb-4">1. Use of Service</h2>
                        <p className="text-[var(--landing-muted)] leading-relaxed mb-4">
                            By accessing or using the Financly CA Exam Workspace, you agree to comply with and be bound by these Terms and Conditions. This platform is designed for CA students and educators.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-xl font-black text-[var(--landing-text)] mb-4">2. Account Registration</h2>
                        <p className="text-[var(--landing-muted)] leading-relaxed mb-4">
                            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information during registration.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-xl font-black text-[var(--landing-text)] mb-4">3. Prohibited Conduct</h2>
                        <p className="text-[var(--landing-muted)] leading-relaxed mb-4">
                            You agree not to:
                        </p>
                        <ul className="list-disc pl-6 text-[var(--landing-muted)] space-y-2">
                            <li>Circumvent or attempt to circumvent security measures.</li>
                            <li>Download or distribute copyrighted study materials without authorization.</li>
                            <li>Use the service for any illegal or unauthorized purpose.</li>
                            <li>Interfere with the proper functioning of the workspace.</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-xl font-black text-[var(--landing-text)] mb-4">4. Intellectual Property</h2>
                        <p className="text-[var(--landing-muted)] leading-relaxed mb-4">
                            All content provided on Financly, including mock tests, PYQs, and educational materials, is the property of Financly or its content providers and is protected by intellectual property laws.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-xl font-black text-[var(--landing-text)] mb-4">5. Limitation of Liability</h2>
                        <p className="text-[var(--landing-muted)] leading-relaxed mb-4">
                            Financly provides the service on an "as is" basis. We do not guarantee that the service will be uninterrupted or error-free. To the maximum extent permitted by law, we shall not be liable for any indirect or consequential damages.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-xl font-black text-[var(--landing-text)] mb-4">6. Jurisdiction</h2>
                        <p className="text-[var(--landing-muted)] leading-relaxed">
                            These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Mumbai.
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
