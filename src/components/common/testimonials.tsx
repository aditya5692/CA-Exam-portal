"use client";

import { IdentificationCard, Quotes, Star } from "@phosphor-icons/react";

const TESTIMONIALS = [
    {
        name: "Sneha Kapur",
        rank: "AIR 12, CA Final",
        quote: "The analytics helped me narrow down weak Audit chapters quickly. Reattempting mocks without friction changed how I revised.",
        tone: {
            icon: "bg-[#dcebe6] text-[#1f5c50]",
            rank: "text-[#1f5c50]"
        }
    },
    {
        name: "Arjun Mehta",
        rank: "AIR 45, CA Inter",
        quote: "The exam view feels disciplined instead of flashy. That made practice more repeatable and far closer to how I actually study.",
        tone: {
            icon: "bg-[#e5f0e9] text-[#2f7d55]",
            rank: "text-[#2f7d55]"
        }
    },
    {
        name: "Priyanka Roy",
        rank: "Cleared CA Foundation",
        quote: "Past papers, revision material, and progress checks are finally in one place. It cut a lot of wasted context switching.",
        tone: {
            icon: "bg-[#f2e3c0] text-[#b7791f]",
            rank: "text-[#b7791f]"
        }
    }
];

export function Testimonials() {
    return (
        <section className="bg-[#efe5d6] px-6 py-24 sm:px-12">
            <div className="mx-auto max-w-7xl">
                <div className="mb-16 space-y-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <div className="flex text-[#b7791f]">
                            {[...Array(5)].map((_, index) => <Star key={index} weight="fill" size={16} />)}
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#667370]">Used by rank holders</span>
                    </div>
                    <h2 className="font-outfit text-4xl font-black tracking-tight text-[#1f2b2f] md:text-5xl">
                        Proof from people who actually sat the papers
                    </h2>
                    <p className="mx-auto max-w-2xl text-lg font-medium leading-relaxed text-[#667370]">
                        Less noise, better revision loops, and a cleaner picture of what needs work before the next attempt.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    {TESTIMONIALS.map((testimonial) => (
                        <div
                            key={testimonial.name}
                            className="rounded-[32px] border border-[#e6dccd] bg-[rgba(255,253,249,0.94)] p-9 shadow-[0_18px_40px_rgba(55,48,38,0.05)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(55,48,38,0.08)]"
                        >
                            <div className={`mb-8 flex h-12 w-12 items-center justify-center rounded-2xl ${testimonial.tone.icon}`}>
                                <Quotes size={24} weight="fill" />
                            </div>

                            <p className="mb-8 text-base font-medium leading-relaxed text-[#4f5b58]">
                                "{testimonial.quote}"
                            </p>

                            <div className="flex items-center gap-4 border-t border-[#e6dccd] pt-6">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f4ede2] text-[#8b9693]">
                                    <IdentificationCard size={28} />
                                </div>
                                <div>
                                    <div className="font-bold text-[#1f2b2f]">{testimonial.name}</div>
                                    <div className={`text-[10px] font-black uppercase tracking-[0.18em] ${testimonial.tone.rank}`}>
                                        {testimonial.rank}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-20 flex flex-wrap items-center justify-center gap-8 border-t border-[#dccfbf] pt-10">
                    {["ICAI aligned", "Timed mocks", "Topic review", "Secure checkout", "Mentor workflows"].map((label) => (
                        <span key={label} className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8b9693]">
                            {label}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
}
