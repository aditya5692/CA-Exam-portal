"use client";

import { CaretLeft, CheckCircle, Question, Timer } from "@phosphor-icons/react";
import Link from "next/link";
import { useState, use, useEffect } from "react";

// Mock data based on the requested UI constraints
const MOCK_CASE_STUDY = {
    id: "cs-nov26-tx",
    title: "Taxation Liability of M/s Horizon Tech (Assessment Year 2025-26)",
    content: `M/s Horizon Tech is a domestic company engaged in software development, incorporated on 1st April 2021. For the previous year (PY) 2024-25, the company reported a net profit of ₹4.5 Crores as per its Statement of Profit and Loss.

During the statutory audit, you noticed the following transactions debited/credited to the P&L account:
1. Depreciation charged to P&L account is ₹45 Lakhs. However, depreciation allowable under Section 32 of the Income Tax Act is ₹62 Lakhs (which includes additional depreciation of ₹15 Lakhs on newly installed servers).
2. Penalty of ₹2 Lakhs paid to Customs Authorities for violation of import regulations.
3. Provision for Gratuity of ₹8 Lakhs was created, but actual payment made before the due date of filing ITR was only ₹3 Lakhs.
4. Dividend received from a foreign subsidiary (where Horizon holds 28% equity): ₹12 Lakhs.
5. CSR Expenditure incurred: ₹5 Lakhs.

The company has unabsorbed depreciation of ₹14 Lakhs from AY 2023-24. 
The management wants to know their Minimum Alternate Tax (MAT) liability under Section 115JB vs. normal tax provisions, assuming they have opted into the new tax regime (Section 115BAA).`,
    mcqs: [
        {
            id: "q1",
            text: "What is the allowable depreciation deduction while computing 'Profits and Gains from Business or Profession' (PGBP) assuming the company opts for Section 115BAA?",
            options: [
                { id: "a", text: "₹45 Lakhs (As per Books)" },
                { id: "b", text: "₹62 Lakhs (Including Additional Depreciation)" },
                { id: "c", text: "₹47 Lakhs (Normal Depreciation only, as Sec 115BAA restricts additional depreciation)" },
                { id: "d", text: "₹30 Lakhs" }
            ],
            correct: "c",
            explanation: "Under Section 115BAA, normal depreciation is allowed, but additional depreciation under Section 32(1)(iia) is not permissible. Normal = 62 - 15 = 47 Lakhs."
        },
        {
            id: "q2",
            text: "Which of the following items must be ADDED BACK to the net profit while computing book profit under Section 115JB (MAT)?",
            options: [
                { id: "a", text: "Penalty of ₹2 Lakhs paid to Customs" },
                { id: "b", text: "Unabsorbed depreciation of ₹14 Lakhs" },
                { id: "c", text: "Provision for Gratuity of ₹8 Lakhs (unascertained liability)" },
                { id: "d", text: "Dividend received of ₹12 Lakhs" }
            ],
            correct: "c",
            explanation: "Provisions for unascertained liabilities (like gratuity provision lacking actuarial backing) must be added back under MAT computations."
        },
        {
            id: "q3",
            text: "Is the CSR Expenditure of ₹5 Lakhs allowed as a deduction under PGBP?",
            options: [
                { id: "a", text: "Yes, fully allowed as business expenditure." },
                { id: "b", text: "Allowed up to 2% of average net profits." },
                { id: "c", text: "No, explicitly disallowed under Section 37(1)." },
                { id: "d", text: "Allowed only if paid to PM CARES Fund." }
            ],
            correct: "c",
            explanation: "Explanation 2 to Section 37(1) explicitly states that any expenditure incurred on corporate social responsibility (CSR) activities under Section 135 of the Companies Act is deemed to be NOT incurred for the purposes of business."
        }
    ]
};

export default function CaseStudySplitScreen({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => setTimer(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    const handleSelect = (qId: string, oId: string) => {
        if (submitted[qId]) return;
        setAnswers(prev => ({ ...prev, [qId]: oId }));
    };

    const handleSubmit = (qId: string) => {
        if (!answers[qId]) return;
        setSubmitted(prev => ({ ...prev, [qId]: true }));
    };

    return (
        <div className="flex h-screen w-full flex-col md:flex-row overflow-hidden bg-white text-slate-900">
            {/* Header Overlay (Mobile only, or absolutized on desktop) */}
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between z-10 pointer-events-none">
                <Link href="/student/dashboard" className="pointer-events-auto flex items-center gap-2 rounded-full bg-slate-900/10 px-4 py-2 text-xs font-bold backdrop-blur-md transition hover:bg-slate-900/20">
                    <CaretLeft weight="bold" /> Exit Simulator
                </Link>
                <div className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-lg pointer-events-auto">
                    <Timer weight="bold" /> {formatTime(timer)}
                </div>
            </div>

            {/* LEFT PANE: Mobile Stacked (Flex) / Desktop Locked (40%) */}
            <div className="flex-[0.4] border-b border-slate-200 md:border-b-0 md:border-r bg-slate-50 pt-20 p-6 md:p-10 overflow-y-auto">
                <div className="max-w-2xl mx-auto">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-indigo-100 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-700">
                        <Question size={14} weight="fill" />
                        Integrated Case Scenario
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-6 leading-snug">
                        {MOCK_CASE_STUDY.title}
                    </h1>
                    <div className="prose prose-sm prose-slate max-w-none text-slate-700">
                        {MOCK_CASE_STUDY.content.split("\n\n").map((para, i) => (
                            <p key={i} className="mb-4 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: para.replace(/\n/g, "<br/>") }} />
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT PANE: MCQ Scrolling (60%) */}
            <div className="flex-[0.6] bg-white pt-6 md:pt-20 p-6 md:p-12 overflow-y-auto relative">
                <div className="max-w-3xl mx-auto space-y-12 pb-32">
                    {MOCK_CASE_STUDY.mcqs.map((q, index) => {
                        const isAnswered = submitted[q.id];
                        const selected = answers[q.id];
                        const isCorrect = selected === q.correct;

                        return (
                            <div key={q.id} className={`rounded-lg border p-6 md:p-8 transition-colors ${
                                isAnswered 
                                    ? isCorrect 
                                        ? "bg-emerald-50/50 border-emerald-200" 
                                        : "bg-rose-50/50 border-rose-200"
                                    : "bg-white border-slate-200 shadow-sm"
                            }`}>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Question {index + 1} of {MOCK_CASE_STUDY.mcqs.length}</div>
                                <h3 className="text-lg font-bold text-slate-900 mb-6 leading-relaxed">{q.text}</h3>

                                <div className="space-y-3">
                                    {q.options.map(opt => {
                                        let btnClass = "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50";
                                        
                                        if (isAnswered) {
                                            if (opt.id === q.correct) {
                                                btnClass = "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20";
                                            } else if (opt.id === selected && !isCorrect) {
                                                btnClass = "border-rose-500 bg-rose-50 text-rose-900 font-bold ring-2 ring-rose-500/20";
                                            } else {
                                                btnClass = "border-slate-200 bg-white opacity-50";
                                            }
                                        } else if (selected === opt.id) {
                                            btnClass = "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20";
                                        }

                                        return (
                                            <button 
                                                key={opt.id}
                                                onClick={() => handleSelect(q.id, opt.id)}
                                                disabled={isAnswered}
                                                className={`w-full flex items-start text-left p-4 rounded-lg border transition-all ${btnClass}`}
                                            >
                                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200 mr-4 text-xs font-bold uppercase pointer-events-none">
                                                    {opt.id}
                                                </div>
                                                <span className="font-medium text-sm leading-snug pt-0.5">{opt.text}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {!isAnswered && selected && (
                                    <button 
                                        onClick={() => handleSubmit(q.id)}
                                        className="mt-6 flex items-center justify-center gap-2 w-full rounded-lg bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-black"
                                    >
                                        Lock Answer
                                    </button>
                                )}

                                {isAnswered && (
                                    <div className={`mt-6 rounded-lg p-4 text-sm font-medium leading-relaxed ${
                                        isCorrect ? "bg-emerald-100/50 text-emerald-800" : "bg-rose-100/50 text-rose-800"
                                    }`}>
                                        <div className="flex items-center gap-2 font-bold mb-1">
                                            <CheckCircle weight="fill" className={isCorrect ? "text-emerald-500" : "text-rose-500"} />
                                            Explanation Focus
                                        </div>
                                        {q.explanation}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
