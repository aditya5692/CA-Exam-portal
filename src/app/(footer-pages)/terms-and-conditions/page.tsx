const TERMS = [
    {
        title: "Use of Service",
        body: "By accessing the platform, users agree to use it only for legitimate CA learning, teaching, and subscription workflows supported by the application.",
    },
    {
        title: "Account Responsibility",
        body: "Each user is responsible for the confidentiality of their credentials, OTP access, and all activity performed through their account.",
    },
    {
        title: "Content and Intellectual Property",
        body: "Mock tests, PYQs, notes, premium resources, and platform materials remain protected content and should not be redistributed without authorization.",
    },
    {
        title: "Payments and Access",
        body: "Paid plans unlock additional product capabilities for the purchased term. Access, cancellation, and renewal behavior should align with the live billing settings configured in the platform.",
    },
    {
        title: "Jurisdiction",
        body: "These terms are governed by the laws of India, and disputes should follow the jurisdiction details maintained by the business operating this platform.",
    },
];

export default function TermsAndConditionsPage() {
    return (
        <div className="space-y-8">
            <section className="rounded-[40px] border border-[var(--landing-border)] bg-[var(--landing-panel)] p-8 shadow-sm sm:p-12">
                <div className="space-y-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--landing-muted)]">
                        Terms and conditions
                    </div>
                    <h1 className="  text-4xl font-black tracking-tight text-[var(--landing-text)] sm:text-5xl">
                        Conditions for using the workspace
                    </h1>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--landing-muted)]">
                        Effective date: March 29, 2026
                    </p>
                </div>
            </section>

            <section className="rounded-[36px] border border-[var(--landing-border)] bg-[var(--landing-panel)] p-8 shadow-sm sm:p-10">
                <div className="space-y-8">
                    {TERMS.map((term, index) => (
                        <div key={term.title} className="space-y-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--landing-muted)]">
                                Clause {index + 1}
                            </div>
                            <h2 className="  text-2xl font-black tracking-tight text-[var(--landing-text)]">
                                {term.title}
                            </h2>
                            <p className="max-w-4xl text-sm leading-8 text-[var(--landing-muted)]">
                                {term.body}
                            </p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
