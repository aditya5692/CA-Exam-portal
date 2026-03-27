export const dynamic = "force-dynamic";

import { TopicMasteryHeatmap } from "@/components/teacher/analytics/topic-mastery";
import prisma from "@/lib/prisma/client";
import { cn } from "@/lib/utils";
import { ArrowRight,ChartBar,Export,ShieldCheck,Sparkle,Target,TrendDown,UserFocus,Warning } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

interface AtRiskStudent {
    name: string;
    score: number;
    deviation: number;
    status: string;
}

const AT_RISK_STUDENTS: AtRiskStudent[] = [
    { name: "Ritika Sharma", score: 42, deviation: -18, status: "Critical" },
    { name: "Karan Gupta", score: 58, deviation: -8, status: "Watch" },
];

export default async function TeacherAnalyticsPage() {
    const teacherId = "clp12345"; // Seeded teacher ID

    const studentsWithAttempts = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        include: {
            examAttempts: {
                where: { exam: { teacherId } },
                select: { score: true, exam: { select: { totalMarks: true } } }
            }
        }
    });

    const analyzedStudents = studentsWithAttempts.map(student => {
        const attempts = student.examAttempts;
        if (attempts.length === 0) return null;

        let totalScore = 0;
        let totalMax = 0;
        attempts.forEach(a => {
            totalScore += a.score;
            totalMax += a.exam.totalMarks || 100;
        });

        const avgPercentage = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
        const classAvg = 75; 
        const deviation = Math.round(avgPercentage - classAvg);

        return {
            name: student.fullName || student.email || 'Unknown Student',
            score: Math.round(avgPercentage),
            deviation,
            status: deviation < -15 ? "Critical" : deviation < -5 ? "Watch" : "Safe"
        };
    }).filter(s => s !== null && (s.status === "Critical" || s.status === "Watch"))
        .sort((a, b) => a!.deviation - b!.deviation)
        .slice(0, 5) as AtRiskStudent[];

    const finalAtRiskStudents = analyzedStudents.length > 0 ? analyzedStudents : AT_RISK_STUDENTS;

    return (
        <div className="space-y-8 pb-20 w-full max-w-[1280px] mx-auto font-outfit animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-[32px] bg-slate-900 p-10 text-white shadow-2xl group mb-4">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none group-hover:bg-indigo-500/15 transition-all duration-1000" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                                <ChartBar size={24} weight="bold" className="text-indigo-400" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Intelligence Engine</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tighter mb-4">Advanced Analytics</h1>
                        <p className="text-slate-400 text-base font-medium leading-relaxed max-w-2xl">
                            High-fidelity insights into cohort progression, topic mastery, and engagement health across your student network.
                        </p>
                    </div>
                    
                    <button className="px-8 h-16 rounded-[24px] bg-white/5 border border-white/10 backdrop-blur-md text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95 flex items-center gap-3">
                        <Export size={18} weight="bold" /> Generate Report
                    </button>
                </div>
            </div>

            {/* Heatmap Section */}
            <TopicMasteryHeatmap />

            {/* Middle Section: Risk & Focus */}
            <div className="grid lg:grid-cols-[1fr_0.42fr] gap-8">
                {/* At-Risk Intervention */}
                <div className="bg-white/80 backdrop-blur-md rounded-[32px] border border-slate-100 shadow-sm p-8 flex flex-col">
                    <div className="flex items-center justify-between mb-10 border-b border-slate-50 pb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shadow-sm">
                                <Warning size={28} weight="bold" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 tracking-tight font-outfit">Priority Interventions</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-70">Automated Risk Detection Sequence</p>
                            </div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                             <Target size={20} weight="bold" className="text-slate-400" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {finalAtRiskStudents.map((student: AtRiskStudent, i) => (
                            <div key={i} className="flex items-center justify-between p-7 rounded-[32px] bg-white border border-slate-100 hover:border-rose-100 hover:shadow-md group transition-all duration-300">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-sm font-black text-slate-400 group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-600 transition-all duration-500 shadow-sm">
                                        {student.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="font-bold text-slate-900 font-outfit text-lg tracking-tight">{student.name}</div>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border",
                                                student.status === "Critical" ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-amber-50 text-amber-600 border-amber-100"
                                            )}>
                                                {student.status}
                                            </span>
                                            <div className="flex items-center gap-1.5 text-[10px] text-rose-500 font-bold uppercase tracking-widest">
                                                <TrendDown size={14} weight="bold" /> {Math.abs(student.deviation)}% Lower Performance
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <Link href="/teacher/students" className="px-6 h-12 rounded-xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-3 active:scale-95 shadow-md shadow-slate-900/10">
                                    Take Action <ArrowRight size={16} weight="bold" />
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Growth & Status */}
                <div className="flex flex-col gap-8">
                    {/* Growth Card */}
                    <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden group shadow-2xl flex-1 flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700" />
                        
                        <div>
                            <div className="flex items-center justify-between mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                                    <UserFocus size={28} weight="bold" className="text-indigo-300" />
                                </div>
                                <div className="p-2 rounded-lg bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                                    <Sparkle size={18} weight="fill" className="text-white animate-pulse" />
                                </div>
                            </div>
                            
                            <h3 className="text-3xl font-bold font-outfit mb-4 tracking-tighter">Strategic Growth</h3>
                            <p className="text-slate-400 text-base font-medium leading-relaxed font-sans mb-10">
                                Analytics suggest focusing on <b className="text-white">Taxation & Law</b>. <span className="text-indigo-400 font-bold">62% of your cohort</span> is struggling with &apos;Capital Gains&apos; logic.
                            </p>
                        </div>

                        <button className="w-full h-16 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all active:scale-95 shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-3">
                             Initialize Review Segment
                        </button>
                    </div>

                    {/* Status Card */}
                    <div className="bg-white/80 backdrop-blur-md rounded-[32px] border border-slate-100 shadow-sm p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                                    <ShieldCheck size={20} weight="bold" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cohort Vitals</span>
                            </div>
                            <div className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Updated Today</div>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Engagement Density</p>
                                        <p className="text-2xl font-bold text-slate-900 tracking-tight font-outfit">84%</p>
                                    </div>
                                    <div className="text-[10px] font-bold text-emerald-500">+12%</div>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-600" style={{ width: '84%' }} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Concept Mastery</p>
                                        <p className="text-2xl font-bold text-slate-900 tracking-tight font-outfit">62%</p>
                                    </div>
                                    <div className="text-[10px] font-bold text-amber-500">+4%</div>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500" style={{ width: '62%' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
