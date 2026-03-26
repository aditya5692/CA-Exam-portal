import { Envelope, MapPin, Phone, GraduationCap } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-[var(--landing-bg)] text-[var(--landing-text)] font-medium selection:bg-[var(--landing-accent)] selection:text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-[var(--landing-border)] bg-[var(--landing-panel)]/80 backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--landing-text)] text-[var(--landing-warm)] shadow-[var(--landing-shadow-sm)] transition-transform group-hover:scale-105">
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

            <main className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
                <div className="text-center mb-16">
                    <h1 className="font-outfit text-5xl font-black tracking-tight text-[var(--landing-text)] mb-4">Contact Us</h1>
                    <p className="text-lg text-[var(--landing-muted)] max-w-2xl mx-auto">
                        Have questions about our CA exam materials or your subscription? We're here to help you succeed.
                    </p>
                </div>

                <div className="grid gap-8 sm:grid-cols-3">
                    <div className="rounded-[32px] border border-[var(--landing-border)] bg-[var(--landing-panel)] p-8 text-center shadow-sm">
                        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--landing-selection-bg)] text-[var(--landing-accent)]">
                            <Envelope size={28} weight="bold" />
                        </div>
                        <h3 className="font-outfit text-xl font-black mb-2">Email Us</h3>
                        <p className="text-sm text-[var(--landing-muted)] mb-4">Response within 24 hours</p>
                        <a href="mailto:support@financly.in" className="text-sm font-bold text-[var(--landing-accent)] hover:underline">
                            support@financly.in
                        </a>
                    </div>

                    <div className="rounded-[32px] border border-[var(--landing-border)] bg-[var(--landing-panel)] p-8 text-center shadow-sm">
                        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--landing-warm)] text-[var(--landing-accent)]">
                            <Phone size={28} weight="bold" />
                        </div>
                        <h3 className="font-outfit text-xl font-black mb-2">Call Us</h3>
                        <p className="text-sm text-[var(--landing-muted)] mb-4">Mon-Fri, 10am - 6pm IST</p>
                        <a href="tel:+910000000000" className="text-sm font-bold text-[var(--landing-accent)] hover:underline">
                            +91 XXXXX XXXXX
                        </a>
                    </div>

                    <div className="rounded-[32px] border border-[var(--landing-border)] bg-[var(--landing-panel)] p-8 text-center shadow-sm">
                        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--landing-warm)] text-[var(--landing-accent)]">
                            <MapPin size={28} weight="bold" />
                        </div>
                        <h3 className="font-outfit text-xl font-black mb-2">Our Office</h3>
                        <p className="text-sm text-[var(--landing-muted)] mb-4">Operational Address</p>
                        <p className="text-xs font-bold leading-relaxed">
                            [Your Registered Business address],<br />
                            Mumbai, Maharashtra, India
                        </p>
                    </div>
                </div>

                <div className="mt-20 rounded-[40px] border border-[var(--landing-border-dark)] bg-gradient-to-br from-[var(--landing-panel-dark)] to-[var(--landing-bg-dark)] p-10 text-white shadow-[var(--landing-shadow-dark-lg)]">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="font-outfit text-3xl font-black mb-4">Business Information</h2>
                            <p className="text-white/70 leading-relaxed mb-6">
                                For Razorpay compliance and official records, here is our registered entity information.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-2 w-2 rounded-full bg-[var(--landing-selection-bg)]" />
                                    <span className="text-sm font-medium"><strong className="text-white">Legal Name:</strong> [Enter Your Registered Name]</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="h-2 w-2 rounded-full bg-[var(--landing-warm)]" />
                                    <span className="text-sm font-medium"><strong className="text-white">Website:</strong> www.financly.in</span>
                                </div>
                            </div>
                        </div>
                        <div className="aspect-video rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
                             <GraduationCap size={64} weight="thin" className="text-white/20" />
                        </div>
                    </div>
                </div>
            </main>

            <footer className="border-t border-[var(--landing-border)] bg-[var(--landing-panel)] py-12">
                <div className="mx-auto max-w-7xl px-6 text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--landing-muted-light)]">
                        © {new Date().getFullYear()} Financly CA Exam Workspace. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
