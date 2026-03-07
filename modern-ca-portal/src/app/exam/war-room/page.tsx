"use client";

import { useEffect } from "react";
import { ExamEngine } from "@/components/exam/exam-engine";
import { useExamStore } from "@/store/exam-store";

const WAR_ROOM_QUESTIONS = [
    {
        id: "w1",
        prompt: "CRITICAL: A system failure occurred during a high-value audit. What is the immediate first step according to ISA standards?",
        options: [
            { id: "A", label: "Notify the client management immediately" },
            { id: "B", label: "Document the failure and continue audit" },
            { id: "C", label: "Assess the risk of material misstatement" },
            { id: "D", label: "Withdraw from the engagement" }
        ]
    },
    {
        id: "w2",
        prompt: "In a forensic audit, suspicious transactions are identified in the general ledger. Which tool is best for data visualization?",
        options: [
            { id: "A", label: "Excel Pivot Tables" },
            { id: "B", label: "Recharts Dashboard (Testkart Style)" },
            { id: "C", label: "Manual Tick Marks" },
            { id: "D", label: "Physical Ledger Review" }
        ]
    }
];

export default function WarRoomPage() {
    const initializeExam = useExamStore((state) => state.initializeExam);

    useEffect(() => {
        // Immersive experience: 15 minutes for War Room challenges
        initializeExam(WAR_ROOM_QUESTIONS, 15);
    }, [initializeExam]);

    return (
        <div className="min-h-screen bg-black py-12 px-6 relative overflow-hidden">
            {/* Immersive War Room Background */}
            <div className="absolute inset-0 bg-radial from-blue-900/10 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-blue-500 to-transparent animate-pulse" />

            <div className="max-w-7xl mx-auto mb-8 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                    <h1 className="text-white font-bold tracking-[0.2em] uppercase text-sm">War Room: Active Simulation</h1>
                </div>
                <div className="text-white/20 text-[10px] font-bold uppercase tracking-widest">
                    Level 4 Security Clearance Required
                </div>
            </div>

            <ExamEngine />
        </div>
    );
}
