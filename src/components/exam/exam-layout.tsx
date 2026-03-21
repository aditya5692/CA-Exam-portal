"use client";

import { cn } from "@/lib/utils";
import {
  ArrowsOut,
  Clock,
  Monitor,
  X
} from "@phosphor-icons/react";
import React,{ useEffect,useState } from "react";

interface ExamLayoutProps {
    children: React.ReactNode;
    examTitle: string;
    duration: number; // minutes
    studentName: string;
    onExit: () => void;
    onSubmit: () => void;
}

export function ExamLayout({
    children,
    examTitle,
    duration,
    onExit,
    onSubmit
}: ExamLayoutProps) {
    const [timeLeft, setTimeLeft] = useState(duration * 60);
    const [fontSize, setFontSize] = useState<"standard" | "large" | "extra-large">("standard");
    const [highContrast, setHighContrast] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        if (timeLeft <= 0) {
            onSubmit();
            return;
        }
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, onSubmit]);

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullScreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullScreen(false);
            }
        }
    };

    return (
        <div className={cn(
            "min-h-screen flex flex-col font-sans selection:bg-indigo-100",
            highContrast ? "bg-black text-white" : "bg-[#f8fafc] text-slate-900",
            fontSize === "large" && "text-lg",
            fontSize === "extra-large" && "text-xl"
        )}>
            {/* Header */}
            <header className={cn(
                "h-16 px-6 flex items-center justify-between border-b sticky top-0 z-50",
                highContrast ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200 shadow-sm"
            )}>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">
                        NTA
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest leading-none">SECURE EXAM MODE</div>
                        <h1 className="font-bold text-lg leading-tight tracking-tight">{examTitle}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Controls */}
                    <div className="hidden md:flex items-center gap-4 border-r pr-6 border-slate-200">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 uppercase">Font Size</span>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                {(["standard", "large", "extra-large"] as const).map(size => (
                                    <button
                                        key={size}
                                        onClick={() => setFontSize(size)}
                                        className={cn(
                                            "w-8 h-8 rounded-md text-xs font-bold transition-all",
                                            fontSize === size
                                                ? "bg-white text-indigo-600 shadow-sm"
                                                : "text-slate-500 hover:text-slate-900"
                                        )}
                                    >
                                        {size === "standard" ? "A-" : size === "large" ? "A" : "A+"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 uppercase">High Contrast</span>
                            <button
                                onClick={() => setHighContrast(!highContrast)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-2",
                                    highContrast
                                        ? "bg-white text-black border-white"
                                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-white"
                                )}
                            >
                                <Monitor size={14} />
                                {highContrast ? "ON" : "OFF"}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={toggleFullScreen}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                    >
                        <ArrowsOut size={18} />
                        {isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
                    </button>
                </div>
            </header>

            {/* Sub-header with Progress and Timer */}
            <div className={cn(
                "h-12 px-6 flex items-center justify-between border-b text-xs font-bold tracking-wide transition-colors",
                highContrast ? "bg-zinc-800 border-zinc-700" : "bg-slate-50 border-slate-200"
            )}>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400">Answered:</span>
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">0</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400">Corrected:</span>
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">0</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400">Marked:</span>
                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">0</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1 rounded-full",
                        timeLeft < 300 ? "bg-rose-100 text-rose-600 animate-pulse" : "bg-indigo-50 text-indigo-700"
                    )}>
                        <Clock size={16} weight="bold" />
                        <span className="font-mono text-sm">{formatTime(timeLeft)}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={onExit}
                            className="text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors"
                        >
                            <X size={14} weight="bold" /> Exit
                        </button>
                        <button className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
                            <Monitor size={14} weight="bold" /> Focus
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 flex overflow-hidden">
                {children}
            </main>
        </div>
    );
}
