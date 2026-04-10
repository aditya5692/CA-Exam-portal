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
        <section className="bg-[var(--landing-bg)] px-6 py-20 sm:px-12">
            <div className="mx-auto max-w-7xl">
                <div className="mb-16 space-y-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <div className="flex text-[var(--landing-accent)]">
                            {[...Array(5)].map((_, index) => <Star key={index} weight="fill" size={16} />)}
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--landing-muted)]">Used by rank holders</span>
                    </div>
                    <h2 className="  text-4xl font-black tracking-tight text-[var(--landing-text)] md:text-5xl">
                        Proof from people who actually sat the papers
                    </h2>
                    <p className="mx-auto max-w-2xl text-lg font-medium leading-relaxed text-[var(--landing-muted)]">
                        Less noise, better revision loops, and a cleaner picture of what needs work before the next attempt.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    {TESTIMONIALS.map((testimonial) => (
                        <div
                            key={testimonial.name}
                            className="rounded-[32px] border border-[var(--landing-border)] bg-[var(--landing-panel)]/94 p-9 shadow-[var(--landing-shadow)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[var(--landing-shadow-lg)]"
                        >
                            <div className={`mb-8 flex h-12 w-12 items-center justify-center rounded-2xl ${testimonial.tone.icon}`}>
                                <Quotes size={24} weight="fill" />
                            </div>

                            <p className="mb-8 text-base font-medium leading-relaxed text-[var(--landing-muted)]">
                                &ldquo;{testimonial.quote}&rdquo;
                            </p>

                            <div className="flex items-center gap-4 border-t border-[var(--landing-border)] pt-6">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--landing-panel-muted)] text-[var(--landing-muted)]">
                                    <IdentificationCard size={28} />
                                </div>
                                <div>
                                    <div className="font-bold text-[var(--landing-text)]">{testimonial.name}</div>
                                    <div className={`text-[10px] font-black uppercase tracking-[0.18em] ${testimonial.tone.rank}`}>
                                        {testimonial.rank}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-20 flex flex-wrap items-center justify-center gap-8 border-t border-[var(--landing-border)] pt-10">
                    {["ICAI aligned", "Timed mocks", "Topic review", "Secure checkout", "Mentor workflows"].map((label) => (
                        <span key={label} className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--landing-muted)]">
                            {label}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
}
