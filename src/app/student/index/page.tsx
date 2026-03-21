import { getGlobalMetrics } from "@/actions/public-actions";
import { 
    Student, 
    BookOpen, 
    FilePdf, 
    Users, 
    Gauge, 
    ArrowRight, 
    Lightning,
    Exam,
    ChartPieSlice,
    ShieldCheck,
    Broadcast
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function GlobalIndexPage() {
    const metrics = await getGlobalMetrics();

    const sections = [
        {
            title: "Practice Exams",
            desc: "Simulated exam environments and practice sets.",
            icon: <Exam size={20} weight="duotone" className="text-indigo-500" />,
            href: "/student/exams",
            features: ["Full Syllabus Mocks", "Chapter-wise Quizzes", "Real-time Leaderboards"]
        },
        {
            title: "Study Material",
            desc: "Access PDFs, Past Year Questions, and RTPs.",
            icon: <FilePdf size={20} weight="duotone" className="text-rose-500" />,
            href: "/student/past-year-questions",
            features: ["Unlimited Downloads", "Teacher Verified", "Search & Filter"]
        },
        {
            title: "Study Batches",
            desc: "Collaborative learning environments.",
            icon: <Users size={20} weight="duotone" className="text-amber-500" />,
            href: "/student/dashboard",
            features: ["Live Announcements", "Shared Materials", "Peer Interaction"]
        },
        {
            title: "Performance Analytics",
            desc: "Detailed insights into your progress.",
            icon: <ChartPieSlice size={20} weight="duotone" className="text-emerald-500" />,
            href: "/student/analytics",
            features: ["Strength/Weakness Analysis", "XP & Level Tracking", "Historical Progress"]
        }
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
            {/* Platform Hero Area */}
            <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-10 text-white shadow-xl border border-slate-800">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="space-y-6 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
                            <Broadcast size={12} weight="fill" className="animate-pulse" /> Live Platform Active
                        </div>
                        <h1 className="font-outfit leading-tight tracking-tight">
                            Your CA <br /> Preparation Hub
                        </h1>
                        <p className="text-slate-400 text-base font-medium leading-relaxed">
                            A centralized platform designed for CA Final excellence. Access verified resources, 
                            compete in simulated exams, and track your progress with accuracy.
                        </p>
                        <div className="flex gap-4">
                            <Link href="/student/exams" className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:shadow-lg active:scale-95">
                                Start Practice
                            </Link>
                            <Link href="/student/analytics" className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95">
                                View Progress
                            </Link>
                        </div>
                    </div>

                    {/* Live Metrics Widget */}
                    <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                        <MetricWidget 
                            label="Students" 
                            value={metrics.studentCount.toLocaleString()} 
                            icon={<Users size={20} />} 
                            color="indigo"
                        />
                        <MetricWidget 
                            label="MCQ Bank" 
                            value={metrics.mcqCount.toLocaleString()} 
                            icon={<BookOpen size={20} />} 
                            color="rose"
                        />
                        <MetricWidget 
                            label="Resources" 
                            value={metrics.resourceCount.toLocaleString()} 
                            icon={<FilePdf size={20} />} 
                            color="amber"
                        />
                        <MetricWidget 
                            label="Batches" 
                            value={metrics.batchCount.toLocaleString()} 
                            icon={<Broadcast size={20} />} 
                            color="emerald"
                        />
                    </div>
                </div>

                {/* Decorative Background Accents */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/10 blur-[100px] rounded-full -mr-40 -mt-40" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-600/10 blur-[80px] rounded-full -ml-20 -mb-20" />
            </div>

            {/* Feature Exploration Grid */}
            <div className="space-y-8">
                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <h2 className="font-outfit uppercase tracking-tight">Platform Index</h2>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Explore modules & features</p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Updated at: <span className="text-indigo-600/80">{new Date(metrics.lastUpdate).toLocaleTimeString()}</span>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {sections.map((section, idx) => (
                        <Link 
                            key={idx} 
                            href={section.href}
                            className="group bg-white border border-slate-100 p-8 rounded-2xl hover:border-indigo-500/20 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
                        >
                            <div className="relative z-10 space-y-6">
                                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 transition-all group-hover:scale-110 group-hover:bg-white group-hover:shadow-sm">
                                    {section.icon}
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-slate-900 font-outfit flex items-center justify-between">
                                        {section.title}
                                        <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                    </h3>
                                    <p className="text-xs text-slate-500 leading-relaxed min-h-[3rem] line-clamp-2">
                                        {section.desc}
                                    </p>
                                </div>
                                <ul className="space-y-2.5 pt-4 border-t border-slate-50">
                                    {section.features.map((feat, fIdx) => (
                                        <li key={fIdx} className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">
                                            <div className="w-1 h-1 bg-slate-200 rounded-full group-hover:bg-indigo-400 transition-all" />
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            
                            {/* Hover Decorative Element */}
                            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-slate-50/50 rounded-full blur-2xl group-hover:bg-indigo-50 transition-all duration-700" />
                        </Link>
                    ))}
                </div>
            </div>

            {/* Subject Directory: CA Final 2024 */}
            <div className="space-y-8">
                <div className="space-y-1">
                    <h2 className="font-outfit uppercase tracking-tight">CA Final <span className="text-indigo-600/80">Subjects</span></h2>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Syllabus Index • Group I & II</p>
                </div>

                <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                        { code: "FR", name: "Financial Reporting", group: "I" },
                        { code: "AFM", name: "Adv Financial Mgmt", group: "I" },
                        { code: "AUDIT", name: "Adv Auditing & Ethics", group: "I" },
                        { code: "DT", name: "Direct Tax Laws", group: "II" },
                        { code: "IDT", name: "Indirect Tax Laws", group: "II" },
                        { code: "IBS", name: "Integrated Solutions", group: "II" },
                    ].map((subject, idx) => (
                        <div key={idx} className="p-6 rounded-2xl bg-white border border-slate-100 hover:border-indigo-500/20 transition-all group cursor-pointer hover:shadow-lg hover:-translate-y-1">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-indigo-600/80">Paper {idx + 1}</div>
                            <div className="text-sm font-bold text-slate-900 font-outfit leading-tight mb-4 group-hover:text-indigo-600/80">{subject.name}</div>
                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                                <span className="px-2 py-0.5 rounded-md bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Group {subject.group}</span>
                                <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 opacity-0 group-hover:opacity-100 transition-all">
                                    <ArrowRight size={12} weight="bold" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Platform Status Bar */}
            <div className="flex items-center gap-6 px-8 py-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                    <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Platform Live</span>
                </div>
                <div className="h-4 w-px bg-slate-100" />
                <div className="flex items-center gap-3">
                    <Lightning size={16} weight="fill" className="text-amber-500/80" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Syllabus in sync</span>
                </div>
                <div className="ml-auto flex items-center gap-4">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-6 h-6 rounded-lg bg-slate-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-400">
                                {String.fromCharCode(64 + i)}
                            </div>
                        ))}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Community</span>
                </div>
            </div>
        </div>
    );
}

function MetricWidget({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: string }) {
    const colors: Record<string, string> = {
        indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
        rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
        amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    };

    return (
        <div className="bg-slate-800/40 border border-slate-800 p-6 rounded-2xl space-y-3 min-w-[140px] backdrop-blur-sm transition-all hover:bg-slate-800 active:scale-95">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", colors[color])}>
                {icon}
            </div>
            <div className="space-y-1">
                <div className="text-xl font-bold font-outfit leading-none">{value}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</div>
            </div>
        </div>
    );
}
