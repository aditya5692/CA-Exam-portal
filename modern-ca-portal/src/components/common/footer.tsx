"use client";

import Link from "next/link";
import { GraduationCap, FacebookLogo, TwitterLogo, InstagramLogo, LinkedinLogo, YoutubeLogo, PaperPlaneTilt } from "@phosphor-icons/react";

export function EliteFooter() {
    return (
        <footer className="bg-white border-t border-gray-100 pt-24 pb-12 px-6 sm:px-12 overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <GraduationCap size={24} weight="bold" className="text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900 tracking-tight font-outfit">Financly</span>
                        </Link>
                        <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                            India&apos;s most sophisticated CA exam preparation platform. Empowering students with data-driven insights and premium mock tests.
                        </p>
                        <div className="flex items-center gap-4">
                            {[FacebookLogo, TwitterLogo, InstagramLogo, LinkedinLogo, YoutubeLogo].map((Icon, i) => (
                                <Link key={i} href="#" className="w-9 h-9 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all">
                                    <Icon size={18} weight="fill" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-bold text-gray-900 mb-6 uppercase tracking-widest text-xs">Exams</h4>
                        <ul className="space-y-4">
                            <li><Link href="/student/exams" className="text-gray-500 hover:text-indigo-600 transition-colors text-sm font-medium">CA Foundation</Link></li>
                            <li><Link href="/student/exams" className="text-gray-500 hover:text-indigo-600 transition-colors text-sm font-medium">CA Intermediate</Link></li>
                            <li><Link href="/student/exams" className="text-gray-500 hover:text-indigo-600 transition-colors text-sm font-medium">CA Final</Link></li>
                            <li><Link href="/student/exams" className="text-gray-500 hover:text-indigo-600 transition-colors text-sm font-medium">NISM Certifications</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="font-bold text-gray-900 mb-6 uppercase tracking-widest text-xs">Company</h4>
                        <ul className="space-y-4">
                            <li><Link href="/about" className="text-gray-500 hover:text-indigo-600 transition-colors text-sm font-medium">About Us</Link></li>
                            <li><Link href="/pricing" className="text-gray-500 hover:text-indigo-600 transition-colors text-sm font-medium">Our Plans</Link></li>
                            <li><Link href="/contact" className="text-gray-500 hover:text-indigo-600 transition-colors text-sm font-medium">Contact Support</Link></li>
                            <li><Link href="/privacy" className="text-gray-500 hover:text-indigo-600 transition-colors text-sm font-medium">Privacy Policy</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 className="font-bold text-gray-900 mb-6 uppercase tracking-widest text-xs">Newsletter</h4>
                        <p className="text-gray-500 text-sm mb-6">Stay updated with latest CA exam dates and tips.</p>
                        <div className="relative group">
                            <input
                                type="email"
                                placeholder="Email Address"
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-4 pr-12 text-sm focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/50 transition-all outline-none"
                            />
                            <button className="absolute right-2 top-2 w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform">
                                <PaperPlaneTilt size={18} weight="bold" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-12 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                        © 2026 Financly Exam Studio. All rights reserved.
                    </p>
                    <div className="flex items-center gap-8">
                        <Link href="#" className="text-xs text-gray-400 font-bold uppercase tracking-widest hover:text-gray-900 transition-colors">Terms of Service</Link>
                        <Link href="#" className="text-xs text-gray-400 font-bold uppercase tracking-widest hover:text-gray-900 transition-colors">Security</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
