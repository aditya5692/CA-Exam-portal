"use client";

import { Star, Quotes, IdentificationCard } from "@phosphor-icons/react";

const TESTIMONIALS = [
    {
        name: "Sneha Kapur",
        rank: "AIR 12, CA Final",
        quote: "The Pro analytics helped me identify exactly which chapters in Audit I was weak in. The unlimited reattempts for mock tests were a game changer.",
        color: "bg-indigo-50",
        textColor: "text-indigo-600"
    },
    {
        name: "Arjun Mehta",
        rank: "AIR 45, CA Inter",
        quote: "Financly&apos;s interface is so clean. It feels like the actual exam environment. The topic-wise analysis is better than any coaching center&apos;s portal.",
        color: "bg-emerald-50",
        textColor: "text-emerald-600"
    },
    {
        name: "Priyanka Roy",
        rank: "Cleared CA Foundation",
        quote: "Highly recommend the CA Pass Pro. The previous year papers are sorted so well, making revision extremely efficient and targeted.",
        color: "bg-amber-50",
        textColor: "text-amber-600"
    }
];

export function Testimonials() {
    return (
        <section className="py-24 px-6 sm:px-12 bg-[#fafafa]">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16 space-y-4">
                    <div className="flex justify-center items-center gap-2">
                        <div className="flex text-amber-500">
                            {[...Array(5)].map((_, i) => <Star key={i} weight="fill" size={16} />)}
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Industry Favorite</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 font-outfit tracking-tight">Trusted by Rankers</h2>
                    <p className="text-gray-500 text-lg font-medium max-w-2xl mx-auto">
                        Join thousands of successful aspirants who achieved their CA dreams with our premium preparation tools.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {TESTIMONIALS.map((t, i) => (
                        <div
                            key={i}
                            className="p-10 rounded-[32px] bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative group hover:shadow-xl hover:-translate-y-2 transition-all duration-500"
                        >
                            <div className={`w-12 h-12 rounded-2xl ${t.color} ${t.textColor} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                                <Quotes size={24} weight="fill" />
                            </div>
                            <p className="text-gray-600 text-lg italic leading-relaxed mb-8">
                                &quot;{t.quote}&quot;
                            </p>
                            <div className="flex items-center gap-4 pt-6 border-t border-gray-50">
                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                    <IdentificationCard size={28} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{t.name}</h4>
                                    <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">{t.rank}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Trust bar */}
                <div className="mt-24 pt-12 border-t border-gray-100 flex flex-wrap justify-center items-center gap-12 opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700">
                    {["ICAI Pattern", "ISO Certified", "Secure Checkout", "NISM Partner", "UPSC Tier"].map((text, i) => (
                        <span key={i} className="text-sm font-bold text-gray-400 uppercase tracking-[0.3em]">{text}</span>
                    ))}
                </div>
            </div>
        </section>
    );
}
