import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
import { PricingCards } from "@/components/subscription/pricing-cards";
import { getSessionPayload } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { Lexend } from "next/font/google";
import { redirect } from "next/navigation";

const lexend = Lexend({
    subsets: ["latin"],
    display: "swap",
});

export default async function PricingPage() {
    const session = await getSessionPayload();

    if (session) {
        if (session.role === "ADMIN") redirect("/admin/dashboard");
        if (session.role === "TEACHER") redirect("/teacher/plan");
    }

    return (
        <div className={cn("min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden", lexend.className)}>
            <Navbar user={session} />

            <main className="max-w-7xl mx-auto px-6 py-24 sm:py-32">
                <div className="text-center space-y-6 mb-20">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0f2cbd]/10 text-[#0f2cbd] text-xs font-bold tracking-widest uppercase mb-4">
                        Investment in your future
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-950">
                        The definitive <span className="text-blue-600">Mock Pass</span>.
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
                        The most comprehensive CA preparation platform designed specifically for the latest ICAI pattern. No fluff, just results.
                    </p>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                    <PricingCards userPlan={session?.plan} userRole={session?.role} />
                </div>

                {/* FAQ / Trust Section */}
                <div className="mt-32 border-t border-slate-200 pt-24">
                    <div className="grid md:grid-cols-3 gap-16">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-[#0f2cbd] uppercase tracking-widest">Secure Checkout</h4>
                            <h3 className="text-2xl font-bold text-slate-950 leading-tight">Instant Access</h3>
                            <p className="text-slate-600 text-sm font-medium leading-relaxed">
                                Get immediate access to all mock tests and premium features upon successful payment. All transactions are secure and encrypted.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-[#0f2cbd] uppercase tracking-widest">Upgrade Anytime</h4>
                            <h3 className="text-2xl font-bold text-slate-950 leading-tight">Flexible Scaling</h3>
                            <p className="text-slate-600 text-sm font-medium leading-relaxed">
                                Start with Basic and upgrade to Pass Pro as you move closer to your exams. We offer prorated credits for your existing subscription.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-[#0f2cbd] uppercase tracking-widest">24/7 Support</h4>
                            <h3 className="text-2xl font-bold text-slate-950 leading-tight">Dedicated Help</h3>
                            <p className="text-slate-600 text-sm font-medium leading-relaxed">
                                Our support team is always available to help you with technical or billing questions via WhatsApp and live chat.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
