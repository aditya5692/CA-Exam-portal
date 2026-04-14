"use client";

import { IdentificationCard, Quotes, Star } from "@phosphor-icons/react";

const TESTIMONIALS = [
    {
        name: "Sneha Kapur",
        rank: "AIR 12, CA Final",
        quote: "The analytics helped me narrow down weak Audit chapters quickly. Reattempting mocks without friction changed how I revised.",
        tone: {
            icon: "bg-[var(--landing-selection-bg)] text-[var(--landing-accent)]",
            rank: "text-[var(--landing-accent)]"
        }
    },
    {
        name: "Arjun Mehta",
        rank: "AIR 45, CA Inter",
        quote: "The exam view feels disciplined instead of flashy. That made practice more repeatable and far closer to how I actually study.",
        tone: {
            icon: "bg-[var(--landing-selection-bg)] text-[var(--landing-accent)]",
            rank: "text-[var(--landing-accent)]"
        }
    },
    {
        name: "Priyanka Roy",
        rank: "Cleared CA Foundation",
        quote: "Past papers, revision material, and progress checks are finally in one place. It cut a lot of wasted context switching.",
        tone: {
            icon: "bg-[var(--landing-selection-bg)] text-[var(--landing-accent)]",
            rank: "text-[var(--landing-accent)]"
        }
    }
];

export function Testimonials() {
    return (
        <section className="relative bg-white px-6 py-32 sm:px-12 overflow-hidden">
            {/* Technical Dot Grid Background */}
            <div className="absolute inset-0 bg-dot-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent)] pointer-events-none"></div>
            
            <div className="relative z-10 mx-auto max-w-7xl">
                <div className="mb-20 space-y-6 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                        <div className="flex text-amber-400">
                            {[...Array(5)].map((_, index) => <Star key={index} weight="fill" size={18} />)}
                        </div>
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 shadow-sm">
                            Real Results • Verified Proof
                        </span>
                    </div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-6xl max-w-4xl mx-auto leading-[1.1]">
                        Trusted by the <span className="text-blue-600">Next Generation</span> of CAs.
                    </h2>
                    <p className="mx-auto max-w-2xl text-lg font-medium leading-relaxed text-slate-500">
                        Join thousands of aspirants who have traded generic prep for structural discipline and high-yield analytics.
                    </p>
                </div>

                <div className="grid gap-10 md:grid-cols-3">
                    {TESTIMONIALS.map((testimonial) => (
                        <div
                            key={testimonial.name}
                            className="group relative rounded-2xl border border-slate-100 bg-white/80 backdrop-blur-sm p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_45px_100px_rgba(15,44,189,0.06)] hover:border-blue-600/10"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Quotes size={80} weight="fill" className="text-blue-600" />
                            </div>

                            <div className="relative z-10 space-y-8">
                                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 border border-blue-100/50 text-[9px] font-bold text-blue-600 uppercase tracking-widest">
                                    Verified Success
                                </div>

                                <p className="text-lg font-medium leading-relaxed text-slate-600 italic">
                                    &ldquo;{testimonial.quote}&rdquo;
                                </p>

                                <div className="flex items-center gap-5 pt-8 border-t border-slate-50">
                                    <div className="relative">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
                                            <IdentificationCard size={32} weight="duotone" />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-base font-bold text-slate-900">{testimonial.name}</div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600/80">
                                            {testimonial.rank}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-24 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 border-t border-slate-100 pt-12">
                    {["ICAI Pattern Aligned", "Timed Simulation", "Topic Mastery", "Security First", "Rank Analytics"].map((label) => (
                        <span key={label} className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 group cursor-default transition-colors hover:text-slate-900">
                            {label}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
}
