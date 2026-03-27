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
                        <Link href="/" className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg">
                                <GraduationCap size={22} weight="bold" />
                            </div>
                            <div>
                                <div className="font-outfit text-xl font-bold tracking-tight text-slate-900">Financly</div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">CA Exam Workspace</div>
                            </div>
                        </Link>

                        <p className="max-w-sm text-sm font-medium leading-relaxed text-slate-500">
                            A calmer workspace for CA preparation with timed exams, revision materials, past papers, and progress visibility in one place.
                        </p>

                        <div className="flex items-center gap-3">
                            {SOCIALS.map((Icon, index) => (
                                <Link
                                    key={index}
                                    href="#"
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-all hover:bg-slate-900 hover:text-white hover:border-slate-900"
                                >
                                    <Icon size={16} weight="fill" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-slate-900">Exam Tracks</h4>
                        <ul className="space-y-3">
                            <li><Link href="/student/exams" className="text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600">CA Foundation</Link></li>
                            <li><Link href="/student/exams" className="text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600">CA Intermediate</Link></li>
                            <li><Link href="/student/exams" className="text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600">CA Final</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-slate-900">Company</h4>
                        <ul className="space-y-3">
                            <li><Link href="/" className="text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600">About Us</Link></li>
                            <li><Link href="/pricing" className="text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600">Plans</Link></li>
                            <li><Link href="/contact" className="text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600">Support</Link></li>
                            <li><Link href="/privacy-policy" className="text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600">Privacy Policy</Link></li>
                            <li><Link href="/refund-policy" className="text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600">Refund Policy</Link></li>
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
                                placeholder="Email address"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-12 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                            />
                            <button className="absolute right-1.5 top-1.5 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white transition-all active:scale-95 hover:bg-slate-800">
                                <PaperPlaneTilt size={18} weight="bold" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 md:flex-row">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        © 2026 Financly Exam Workspace.
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
