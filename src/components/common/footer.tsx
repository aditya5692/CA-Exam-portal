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
        <footer className="border-t border-slate-200 bg-white px-6 pb-12 pt-20 sm:px-12">
            <div className="mx-auto max-w-7xl">
                <div className="grid grid-cols-1 gap-12 pb-16 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f2cbd] text-white shadow-lg shadow-blue-500/20 transition-transform duration-300 group-hover:scale-110">
                                <GraduationCap size={22} weight="bold" />
                            </div>
                            <div>
                                <div className="  text-xl font-bold tracking-tight text-slate-900">Financly</div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-[#0f2cbd]/60">CA Test Series</div>
                            </div>
                        </Link>

                        <p className="max-w-sm text-sm font-medium leading-relaxed text-slate-500">
                            A calmer workspace for CA preparation with timed exams, revision materials, past papers, and progress visibility in one place.
                        </p>

                        <div className="flex items-center gap-4">
                            {SOCIALS.map((Icon, index) => (
                                <Link
                                    key={index}
                                    href="#"
                                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-all hover:bg-[#0f2cbd] hover:text-white hover:border-[#0f2cbd] hover:shadow-lg hover:shadow-blue-500/10"
                                >
                                    <Icon size={18} weight="fill" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-slate-900">Exam Tracks</h4>
                        <ul className="space-y-3">
                            <li><Link href="/student/exams" className="text-sm font-medium text-slate-500 transition-colors hover:text-blue-600">CA Foundation</Link></li>
                            <li><Link href="/student/exams" className="text-sm font-medium text-slate-500 transition-colors hover:text-blue-600">CA Intermediate</Link></li>
                            <li><Link href="/student/exams" className="text-sm font-medium text-slate-500 transition-colors hover:text-blue-600">CA Final</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-slate-900">Company</h4>
                        <ul className="space-y-3">
                            <li><Link href="/" className="text-sm font-bold text-slate-500 transition-colors hover:text-blue-600">About Us</Link></li>
                            <li><Link href="/pricing" className="text-sm font-bold text-slate-500 transition-colors hover:text-blue-600">Plans & Pricing</Link></li>
                            <li><Link href="/contact" className="text-sm font-bold text-slate-500 transition-colors hover:text-blue-600">Technical Support</Link></li>
                            <li><Link href="/privacy-policy" className="text-sm font-bold text-slate-500 transition-colors hover:text-blue-600">Privacy & Terms</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-slate-900">Weekly Notes</h4>
                        <p className="mb-5 text-sm font-medium leading-relaxed text-slate-500">
                            Get exam windows, revision cues, and new practice releases without the noise.
                        </p>
                        <div className="relative">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-5 pr-14 text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                            />
                            <button className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white transition-all active:scale-95 hover:bg-blue-700 shadow-md">
                                <PaperPlaneTilt size={20} weight="bold" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 md:flex-row">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
                        © 2026 Financly. Built for High-Integrity Prep.
                    </p>
                    <div className="flex items-center gap-6">
                        <Link href="/terms-and-conditions" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-900">Terms</Link>
                        <Link href="/privacy-policy" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-900">Privacy</Link>
                        <Link href="/refund-policy" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-900">Refunds</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
