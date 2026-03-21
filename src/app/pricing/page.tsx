import { PricingCards } from "@/components/subscription/pricing-cards";
import { ShieldCheck, CheckCircle, Question, Info } from "@phosphor-icons/react/dist/ssr";
import { Navbar } from "@/components/common/navbar";
import { Footer } from "@/components/common/footer";
import { getSessionPayload } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function PricingPage() {
    const session = await getSessionPayload();

    if (session) {
        if (session.role === "ADMIN") redirect("/admin/dashboard");
        if (session.role === "TEACHER") redirect("/teacher/plan");
        redirect("/student/plan");
    }

    return (
        <div className="min-h-screen bg-white selection:bg-indigo-100 selection:text-indigo-900">
            <Navbar user={session} />

            <main className="max-w-7xl mx-auto px-6 py-32 sm:py-48">
                <div className="text-center space-y-4 mb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <h1 className="text-5xl md:text-7xl font-bold font-outfit tracking-tight text-gray-900">
                        Invest in your <span className="text-indigo-600">success</span>.
                    </h1>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium">
                        The most comprehensive CA preparation platform designed specifically for the latest ICAI pattern.
                    </p>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                    <PricingCards userPlan={undefined} userRole={undefined} />
                </div>

                {/* FAQ / Trust Section */}
                <div className="mt-32 border-t border-gray-100 pt-20 animate-in fade-in duration-1000 delay-500">
                    <div className="grid md:grid-cols-3 gap-12">
                        <div>
                            <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-4">Secure Checkout</h4>
                            <h3 className="text-xl font-bold text-gray-900 font-outfit mb-4">Instant Access</h3>
                            <p className="text-gray-500 text-sm font-medium leading-relaxed">
                                Get immediate access to all mock tests and premium features upon successful payment. All transactions are ₹ secured.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-4">Upgrade Anytime</h4>
                            <h3 className="text-xl font-bold text-gray-900 font-outfit mb-4">Flexible Scaling</h3>
                            <p className="text-gray-500 text-sm font-medium leading-relaxed">
                                Start with Basic and upgrade to Pass Pro as you move closer to your exams. We offer prorated credits.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-4">24/7 Support</h4>
                            <h3 className="text-xl font-bold text-gray-900 font-outfit mb-4">Dedicated Help</h3>
                            <p className="text-gray-500 text-sm font-medium leading-relaxed">
                                Our support team is always available to help you with technical or billing questions via live chat.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
