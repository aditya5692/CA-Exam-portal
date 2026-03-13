import { TopicMasteryHeatmap } from "@/components/teacher/analytics/topic-mastery";
import { Warning, ArrowRight, UserFocus, ChartBar } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { cn } from "@/lib/utils";
import prisma from "@/lib/prisma/client";

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

    // Fetch students who have attempted exams created by this teacher
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
        const classAvg = 75; // Assumed cohort average for calculation
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
        <div className="space-y-12 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 font-outfit tracking-tight">Advanced Analytics</h1>
                    <p className="text-gray-500 text-lg font-medium mt-1">Deep insights into student mastery and engagement.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-5 py-2.5 rounded-xl bg-white border border-gray-100 text-gray-600 font-bold text-sm shadow-sm hover:bg-gray-50 transition-all active:scale-95">
                        Export Report
                    </button>
                </div>
            </div>

            {/* Heatmap Section */}
            <TopicMasteryHeatmap />

            {/* At-Risk Intervention Section */}
            <div className="grid lg:grid-cols-[1fr_0.4fr] gap-8">
                <div className="p-8 rounded-3xl bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                            <Warning size={24} weight="bold" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 font-outfit">Priority Interventions</h3>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-0.5">Automated Risk Detection</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {finalAtRiskStudents.map((student: AtRiskStudent, i) => (
                            <div key={i} className="flex items-center justify-between p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:border-rose-100 group transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-sm font-bold text-gray-400 group-hover:text-rose-600 transition-colors">
                                        {student.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900">{student.name}</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                                                student.status === "Critical" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                                            )}>
                                                {student.status}
                                            </span>
                                            <span className="text-[10px] text-rose-500 font-bold uppercase tracking-[0.1em]">{student.deviation}% below avg</span>
                                        </div>
                                    </div>
                                </div>
                                <Link href="/teacher/students" className="px-4 py-2 rounded-xl bg-white border border-gray-100 text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-indigo-600 hover:border-indigo-100 transition-all flex items-center gap-2">
                                    Take Action <ArrowRight size={14} weight="bold" />
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-8 rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/20">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                            <UserFocus size={24} weight="bold" />
                        </div>
                        <h3 className="text-xl font-bold font-outfit mb-3">Targeted Growth</h3>
                        <p className="text-indigo-100 text-sm font-medium leading-relaxed mb-6">
                            Your current focus area should be <b>Audit &amp; Assurance</b>. 65% of your cohort is struggling with &apos;Internal Controls&apos;.
                        </p>
                        <button className="w-full py-3 rounded-xl bg-white text-indigo-600 font-bold text-sm hover:bg-indigo-50 transition-all active:scale-95">
                            Create Review Session
                        </button>
                    </div>

                    <div className="p-8 rounded-3xl bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-l-4 border-l-indigo-600">
                        <div className="flex items-center gap-3 mb-4">
                            <ChartBar size={20} className="text-indigo-600" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Cohort Status</span>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">
                                    Engagement <span>84%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-600" style={{ width: '84%' }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">
                                    Mastery <span>62%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
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
