import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
import { PricingCards } from "@/components/subscription/pricing-cards";
import { PricingFAQ } from "@/components/subscription/pricing-faq";
import { WhatsAppButton } from "@/components/common/whatsapp-button";
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
                <div className="text-center space-y-6 mb-20 animate-in fade-in slide-in-from-top-12 duration-700">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/10 text-blue-600 text-[10px] font-bold tracking-widest uppercase mb-4">
                        Investment in your future
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-950">
                        The definitive <span className="text-blue-600">Mock Pass</span>.
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
                        The most comprehensive CA preparation platform designed specifically for the latest ICAI pattern. No fluff, just results.
                    </p>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-12 duration-1,000 delay-200">
                    <PricingCards userPlan={session?.plan} userRole={session?.role} />
                </div>

                {/* FAQ Grid Section */}
                <div className="mt-32 border-t border-slate-200 pt-24">
                    <PricingFAQ />
                </div>
            </main>

            <WhatsAppButton />
            <Footer />
        </div>
    );
}
