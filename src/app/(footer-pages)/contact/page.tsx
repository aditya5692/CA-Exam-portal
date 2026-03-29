import { Envelope, MapPin, Phone, ShieldCheck } from "@phosphor-icons/react/dist/ssr";

const CONTACT_CARDS = [
    {
        title: "Email Support",
        helper: "Response target: within 24 hours",
        value: "support@financly.in",
        href: "mailto:support@financly.in",
        icon: Envelope,
    },
    {
        title: "Phone Support",
        helper: "Mon-Fri, 10 AM to 6 PM IST",
        value: "+91 XXXXX XXXXX",
        href: "tel:+910000000000",
        icon: Phone,
    },
    {
        title: "Business Address",
        helper: "Use your registered office details here",
        value: "[Your Registered Business Address], Mumbai, Maharashtra, India",
        href: null,
        icon: MapPin,
    },
];

export default function ContactPage() {
    return (
        <div className="space-y-10">
            <section className="rounded-[40px] border border-[var(--landing-border)] bg-[var(--landing-panel)] p-8 shadow-sm sm:p-12">
                <div className="space-y-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--landing-muted)]">
                        Contact and support
                    </div>
                    <h1 className="font-outfit text-4xl font-black tracking-tight text-[var(--landing-text)] sm:text-5xl">
                        Reach the Financly team
                    </h1>
                    <p className="max-w-3xl text-base leading-8 text-[var(--landing-muted)]">
                        Keep this page aligned with your live support and compliance details so payment, refund,
                        and verification queries always route to the right contact point.
                    </p>
                </div>
            </section>

            <section className="grid gap-6 md:grid-cols-3">
                {CONTACT_CARDS.map((card) => (
                    <div
                        key={card.title}
                        className="rounded-[32px] border border-[var(--landing-border)] bg-[var(--landing-panel)] p-8 shadow-sm"
                    >
                        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--landing-selection-bg)] text-[var(--landing-accent)]">
                            <card.icon size={28} weight="bold" />
                        </div>
                        <h2 className="font-outfit text-2xl font-black tracking-tight text-[var(--landing-text)]">
                            {card.title}
                        </h2>
                        <p className="mt-2 text-sm leading-7 text-[var(--landing-muted)]">{card.helper}</p>
                        <div className="mt-5 text-sm font-bold leading-7 text-[var(--landing-text)]">
                            {card.href ? (
                                <a href={card.href} className="text-[var(--landing-accent)] hover:underline">
                                    {card.value}
                                </a>
                            ) : (
                                card.value
                            )}
                        </div>
                    </div>
                ))}
            </section>

            <section className="rounded-[40px] border border-[var(--landing-border-dark)] bg-gradient-to-br from-[var(--landing-panel-dark)] to-[var(--landing-bg-dark)] p-8 text-white shadow-[var(--landing-shadow-dark-lg)] sm:p-12">
                <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                            <ShieldCheck size={16} weight="bold" />
                            Payment compliance
                        </div>
                        <h2 className="font-outfit text-3xl font-black tracking-tight">
                            Business details used for Razorpay verification
                        </h2>
                        <p className="text-sm leading-7 text-white/70">
                            Keep your legal entity name, operational email, and website details current here so the
                            public support pages stay consistent with the details you submit during gateway verification.
                        </p>
                    </div>

                    <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
                        <div className="space-y-4 text-sm leading-7 text-white/80">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Legal name</div>
                                <div className="mt-1 font-semibold text-white">[Enter Your Registered Name]</div>
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Website</div>
                                <div className="mt-1 font-semibold text-white">www.financly.in</div>
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Support email</div>
                                <div className="mt-1 font-semibold text-white">support@financly.in</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
