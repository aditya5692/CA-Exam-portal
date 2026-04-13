const SECTIONS = [
    {
        title: "Information We Collect",
        body: "We collect the information you provide during registration and course usage, including profile details, phone number, email address, exam preferences, and test-attempt activity generated inside the platform.",
    },
    {
        title: "How We Use Information",
        body: "We use this information to authenticate users, personalize learning workflows, process subscriptions, improve the product, and communicate operational or security updates related to your account.",
    },
    {
        title: "Payments and Third Parties",
        body: "Payments are processed through Razorpay and OTP verification flows may rely on MSG91. Sensitive payment credentials are not stored as raw card data in this application.",
    },
    {
        title: "Data Security",
        body: "We apply reasonable security controls to protect platform data in transit and at rest, including authenticated access controls, session handling, and provider-backed payment or verification channels.",
    },
    {
        title: "Support Contact",
        body: "If you need clarification about privacy or data-handling practices, contact support@financly.in and keep this page updated with your official grievance or support contact details.",
    },
];

export default function PrivacyPolicyPage() {
    return (
        <div className="space-y-8">
            <section className="rounded-lg border border-[var(--landing-border)] bg-[var(--landing-panel)] p-8 shadow-sm sm:p-12">
                <div className="space-y-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--landing-muted)]">
                        Privacy policy
                    </div>
                    <h1 className="  text-4xl font-black tracking-tight text-[var(--landing-text)] sm:text-5xl">
                        How platform data is handled
                    </h1>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--landing-muted)]">
                        Last updated: March 29, 2026
                    </p>
                </div>
            </section>

            <section className="rounded-lg border border-[var(--landing-border)] bg-[var(--landing-panel)] p-8 shadow-sm sm:p-10">
                <div className="space-y-8">
                    {SECTIONS.map((section, index) => (
                        <div key={section.title} className="space-y-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--landing-muted)]">
                                Section {index + 1}
                            </div>
                            <h2 className="  text-2xl font-black tracking-tight text-[var(--landing-text)]">
                                {section.title}
                            </h2>
                            <p className="max-w-4xl text-sm leading-8 text-[var(--landing-muted)]">
                                {section.body}
                            </p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
