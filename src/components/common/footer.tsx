"use client";

import {
    FacebookLogo,
    GraduationCap,
    InstagramLogo,
    LinkedinLogo,
    PaperPlaneTilt,
    TwitterLogo,
    YoutubeLogo
} from "@phosphor-icons/react";
import Link from "next/link";

const SOCIALS = [FacebookLogo, TwitterLogo, InstagramLogo, LinkedinLogo, YoutubeLogo];

export function Footer() {
    return (
        <footer className="overflow-hidden border-t border-[var(--landing-border)] bg-[var(--landing-panel)] px-6 pb-12 pt-20 sm:px-12">
            <div className="mx-auto max-w-7xl">
                <div className="grid grid-cols-1 gap-12 pb-16 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--landing-selection-bg)] bg-[var(--landing-selection-bg)] text-[var(--landing-accent)] shadow-[var(--landing-shadow-accent)]">
                                <GraduationCap size={24} weight="bold" />
                            </div>
                            <div>
                                <div className="font-outfit text-xl font-black tracking-tight text-[var(--landing-text)]">Financly</div>
                                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--landing-muted)]">CA Exam Workspace</div>
                            </div>
                        </Link>

                        <p className="max-w-sm text-sm font-medium leading-relaxed text-[var(--landing-muted)]">
                            A calmer workspace for CA preparation with timed exams, revision materials, past papers, and progress visibility in one place.
                        </p>

                        <div className="flex items-center gap-3">
                            {SOCIALS.map((Icon, index) => (
                                <Link
                                    key={index}
                                    href="#"
                                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--landing-border)] bg-[var(--landing-bg)] text-[var(--landing-muted)] transition-all hover:border-[var(--landing-selection-bg)] hover:bg-[var(--landing-selection-bg)] hover:text-[var(--landing-accent)]"
                                >
                                    <Icon size={18} weight="fill" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="mb-5 text-[11px] font-black uppercase tracking-[0.22em] text-[var(--landing-text)]">Exam Tracks</h4>
                        <ul className="space-y-3">
                            <li><Link href="/student/exams" className="text-sm font-medium text-[var(--landing-muted)] transition-colors hover:text-[var(--landing-accent)]">CA Foundation</Link></li>
                            <li><Link href="/student/exams" className="text-sm font-medium text-[var(--landing-muted)] transition-colors hover:text-[var(--landing-accent)]">CA Intermediate</Link></li>
                            <li><Link href="/student/exams" className="text-sm font-medium text-[var(--landing-muted)] transition-colors hover:text-[var(--landing-accent)]">CA Final</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-5 text-[11px] font-black uppercase tracking-[0.22em] text-[var(--landing-text)]">Company</h4>
                        <ul className="space-y-3">
                            <li><Link href="/" className="text-sm font-medium text-[var(--landing-muted)] transition-colors hover:text-[var(--landing-accent)]">About Us</Link></li>
                            <li><Link href="/pricing" className="text-sm font-medium text-[var(--landing-muted)] transition-colors hover:text-[var(--landing-accent)]">Plans</Link></li>
                            <li><Link href="/contact" className="text-sm font-medium text-[var(--landing-muted)] transition-colors hover:text-[var(--landing-accent)]">Support</Link></li>
                            <li><Link href="/privacy-policy" className="text-sm font-medium text-[var(--landing-muted)] transition-colors hover:text-[var(--landing-accent)]">Privacy Policy</Link></li>
                            <li><Link href="/refund-policy" className="text-sm font-medium text-[var(--landing-muted)] transition-colors hover:text-[var(--landing-accent)]">Refund Policy</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-5 text-[11px] font-black uppercase tracking-[0.22em] text-[var(--landing-text)]">Weekly Notes</h4>
                        <p className="mb-5 text-sm font-medium leading-relaxed text-[var(--landing-muted)]">
                            Get exam windows, revision cues, and new practice releases without the noise.
                        </p>
                        <div className="relative">
                            <input
                                type="email"
                                placeholder="Email address"
                                className="w-full rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg)] py-3 pl-4 pr-14 text-sm font-medium text-[var(--landing-text)] outline-none transition-all placeholder:text-[var(--landing-muted-light)] focus:border-[var(--landing-selection-bg)] focus:bg-white focus:ring-4 focus:ring-[var(--landing-selection-bg)]"
                            />
                            <button className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--landing-accent)] bg-[var(--landing-accent)] text-white shadow-[var(--landing-shadow-accent)] transition-all active:scale-95">
                                <PaperPlaneTilt size={18} weight="bold" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-between gap-4 border-t border-[var(--landing-border)] pt-8 md:flex-row">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--landing-muted-light)]">
                        Copyright 2026 Financly Exam Workspace.
                    </p>
                    <div className="flex items-center gap-6">
                        <Link href="/terms-and-conditions" className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--landing-muted-light)] transition-colors hover:text-[var(--landing-text)]">Terms</Link>
                        <Link href="/privacy-policy" className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--landing-muted-light)] transition-colors hover:text-[var(--landing-text)]">Privacy</Link>
                        <Link href="/refund-policy" className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--landing-muted-light)] transition-colors hover:text-[var(--landing-text)]">Refunds</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
