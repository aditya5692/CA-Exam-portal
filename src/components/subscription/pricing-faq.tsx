"use client";

import { cn } from "@/lib/utils";
import { 
    BookOpen, 
    ArrowsClockwise, 
    DeviceMobile, 
    CalendarCheck, 
    ShieldCheck,
    Exam
} from "@phosphor-icons/react";

const faqs = [
    {
        question: "Is the content updated for the latest ICAI 2024 New Scheme?",
        answer: "Yes, all mock tests and study materials are strictly aligned with the ICAI New Scheme of Education and Training. We update our question bank immediately after any official notification.",
        icon: <BookOpen className="w-6 h-6" />
    },
    {
        question: "How do the Mock Tests handle the 30:70 MCQ pattern?",
        answer: "Our assessment engine is designed to mirror the exact ICAI exam environment. While MCQs are auto-graded, we provide detailed model answers and marking schemes for descriptive questions.",
        icon: <Exam className="w-6 h-6" />
    },
    {
        question: "What happens if there are Law or Tax amendments?",
        answer: "CA exams are dynamic. Our 'Amendment Tracker' automatically flags and updates questions affected by the Finance Act or recent Case Law developments, ensuring you never practice outdated content.",
        icon: <ArrowsClockwise className="w-6 h-6" />
    },
    {
        question: "Can I access the platform on my mobile phone?",
        answer: "Yes! The CA Exam Portal is fully responsive. You can take MCQs, view analytics, and read study notes on any device—mobile, tablet, or desktop.",
        icon: <DeviceMobile className="w-6 h-6" />
    },
    {
        question: "How long is my subscription valid?",
        answer: "Validity depends on your chosen plan. Typically, a 'Mock Pass' lasts until the end of the next exam cycle (May/Nov). You can also opt for extended validity if needed.",
        icon: <CalendarCheck className="w-6 h-6" />
    },
    {
        question: "Is there a refund policy?",
        answer: "We provide a 24-hour 'No Questions Asked' refund for new subscriptions. We want you to be 100% confident in your preparation journey.",
        icon: <ShieldCheck className="w-6 h-6" />
    }
];

export function PricingFAQ() {
    return (
        <section className="py-24">
            <div className="text-center mb-16 space-y-4">
                <h2 className="text-3xl md:text-5xl font-extrabold text-slate-950">
                    Got questions? <span className="text-blue-600">We have answers.</span>
                </h2>
                <p className="text-slate-600 font-medium max-w-2xl mx-auto">
                    Everything you need to know about our plans, pricing, and how we help you clear your CA exams.
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {faqs.map((faq, index) => (
                    <div 
                        key={index}
                        className="group p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col items-start gap-5 hover:-translate-y-1"
                    >
                        <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                            {faq.icon}
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-xl font-bold text-slate-950 leading-tight group-hover:text-blue-700 transition-colors">
                                {faq.question}
                            </h3>
                            <p className="text-slate-600 text-sm font-medium leading-relaxed">
                                {faq.answer}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-20 p-12 rounded-[40px] bg-slate-950 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-1000"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4 max-w-2xl text-center md:text-left">
                        <h3 className="text-3xl md:text-4xl font-bold">Still have doubts?</h3>
                        <p className="text-slate-400 font-medium">
                            Our CA mentors are available on WhatsApp to guide you through your preparation and help you choose the right plan.
                        </p>
                    </div>
                    <a 
                        href="https://wa.me/91XXXXXXXXXX" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-8 py-4 rounded-2xl bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-lg transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(37,211,102,0.3)] hover:scale-105 active:scale-95"
                    >
                        Chat on WhatsApp
                    </a>
                </div>
            </div>
        </section>
    );
}
