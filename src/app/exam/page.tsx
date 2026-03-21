"use client";

import { ExamEngine } from "@/components/exam/exam-engine";
import { useExamStore } from "@/store/exam-store";
import { useEffect } from "react";

const MOCK_QUESTIONS = [
    {
        id: "q1",
        prompt: "Which accounting standard deals with revenue recognition in India?",
        options: [
            { id: "A", label: "AS 9" },
            { id: "B", label: "AS 2" },
            { id: "C", label: "AS 10" },
            { id: "D", label: "AS 7" }
        ]
    },
    {
        id: "q2",
        prompt: "A company issued debentures of ₹10,00,000 at a discount of 10%. The accounting entry will involve:",
        options: [
            { id: "A", label: "Debiting Cash by ₹9,00,000" },
            { id: "B", label: "Crediting Debentures by ₹9,00,000" },
            { id: "C", label: "Debiting Discount by ₹1,00,000" },
            { id: "D", label: "Both A and C" }
        ]
    }
];

export default function StandardExamPage() {
    const initializeExam = useExamStore((state) => state.initializeExam);

    useEffect(() => {
        initializeExam(MOCK_QUESTIONS, 30);
    }, [initializeExam]);

    return (
        <div className="min-h-screen bg-[#08122d] py-12 px-6">
            <ExamEngine />
        </div>
    );
}
