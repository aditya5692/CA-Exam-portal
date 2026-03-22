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
        <footer className="overflow-hidden border-t border-[#e6dccd] bg-[#fffdfa] px-6 pb-12 pt-20 sm:px-12">
            <div className="mx-auto max-w-7xl">
                <div className="grid grid-cols-1 gap-12 pb-16 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#c5ddd5] bg-[#dcebe6] text-[#1f5c50] shadow-[0_12px_28px_rgba(31,92,80,0.12)]">
                                <GraduationCap size={24} weight="bold" />
                            </div>
                            <div>
                                <div className="font-outfit text-xl font-black tracking-tight text-[#1f2b2f]">Financly</div>
                                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[#667370]">CA Exam Workspace</div>
                            </div>
                        </Link>

                        <p className="max-w-sm text-sm font-medium leading-relaxed text-[#667370]">
                            A calmer workspace for CA preparation with timed exams, revision materials, past papers, and progress visibility in one place.
                        </p>

                        <div className="flex items-center gap-3">
                            {SOCIALS.map((Icon, index) => (
                                <Link
                                    key={index}
                                    href="#"
                                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e6dccd] bg-[#f4ede2] text-[#667370] transition-all hover:border-[#c5ddd5] hover:bg-[#dcebe6] hover:text-[#1f5c50]"
                                >
                                    <Icon size={18} weight="fill" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="mb-5 text-[11px] font-black uppercase tracking-[0.22em] text-[#1f2b2f]">Exam Tracks</h4>
                        <ul className="space-y-3">
                            <li><Link href="/student/exams" className="text-sm font-medium text-[#667370] transition-colors hover:text-[#1f5c50]">CA Foundation</Link></li>
                            <li><Link href="/student/exams" className="text-sm font-medium text-[#667370] transition-colors hover:text-[#1f5c50]">CA Intermediate</Link></li>
                            <li><Link href="/student/exams" className="text-sm font-medium text-[#667370] transition-colors hover:text-[#1f5c50]">CA Final</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-5 text-[11px] font-black uppercase tracking-[0.22em] text-[#1f2b2f]">Company</h4>
                        <ul className="space-y-3">
                            <li><Link href="/about" className="text-sm font-medium text-[#667370] transition-colors hover:text-[#1f5c50]">About Us</Link></li>
                            <li><Link href="/pricing" className="text-sm font-medium text-[#667370] transition-colors hover:text-[#1f5c50]">Plans</Link></li>
                            <li><Link href="/contact" className="text-sm font-medium text-[#667370] transition-colors hover:text-[#1f5c50]">Support</Link></li>
                            <li><Link href="/privacy" className="text-sm font-medium text-[#667370] transition-colors hover:text-[#1f5c50]">Privacy</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-5 text-[11px] font-black uppercase tracking-[0.22em] text-[#1f2b2f]">Weekly Notes</h4>
                        <p className="mb-5 text-sm font-medium leading-relaxed text-[#667370]">
                            Get exam windows, revision cues, and new practice releases without the noise.
                        </p>
                        <div className="relative">
                            <input
                                type="email"
                                placeholder="Email address"
                                className="w-full rounded-2xl border border-[#e6dccd] bg-[#f4ede2] py-3 pl-4 pr-14 text-sm font-medium text-[#1f2b2f] outline-none transition-all placeholder:text-[#8b9693] focus:border-[#c5ddd5] focus:bg-white focus:ring-4 focus:ring-[#dcebe6]"
                            />
                            <button className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-xl border border-[#1f5c50] bg-[#1f5c50] text-white shadow-[0_12px_24px_rgba(31,92,80,0.14)] transition-all active:scale-95">
                                <PaperPlaneTilt size={18} weight="bold" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-between gap-4 border-t border-[#e6dccd] pt-8 md:flex-row">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8b9693]">
                        Copyright 2026 Financly Exam Workspace.
                    </p>
                    <div className="flex items-center gap-6">
                        <Link href="#" className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8b9693] transition-colors hover:text-[#1f2b2f]">Terms</Link>
                        <Link href="#" className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8b9693] transition-colors hover:text-[#1f2b2f]">Security</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
