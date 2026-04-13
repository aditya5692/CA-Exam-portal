import { getPublicEducatorProfile } from "@/actions/public-actions";
import { 
    GraduationCap, 
    BookOpen, 
    Users, 
    ArrowLeft,
    SealCheck,
    EnvelopeSimple,
    LinkedinLogo,
    TwitterLogo
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function TeacherProfilePage({ params }: PageProps) {
    const { id } = await params;
    const teacher = await getPublicEducatorProfile(id);

    if (!teacher) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-[var(--student-panel-muted)] p-4 md:p-8 animate-in fade-in duration-500">
            <div className="mx-auto max-w-4xl space-y-8">
                {/* Back Button */}
                <Link 
                    href="/student/dashboard" 
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--student-muted)] hover:text-[var(--student-accent)] transition-colors"
                >
                    <ArrowLeft size={16} weight="bold" />
                    Back to Hub
                </Link>

                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-lg bg-slate-900 p-8 md:p-12 text-white shadow-2xl border border-slate-800">
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                        {/* Avatar */}
                        <div className="relative group shrink-0">
                            <div className="h-40 w-40 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 p-1 transition-transform group-hover:scale-105 duration-500">
                                <div className="h-full w-full rounded-lg bg-slate-900 flex items-center justify-center overflow-hidden border-4 border-slate-900">
                                    <div className="text-5xl font-black text-white/20 uppercase tracking-tighter select-none">
                                        {teacher.fullName.split(' ').map(n => n[0]).join('')}
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-lg bg-indigo-500 flex items-center justify-center border-4 border-slate-900 shadow-xl">
                                <SealCheck size={20} weight="fill" className="text-white" />
                            </div>
                        </div>

                        {/* Text Info */}
                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
                                    Verified Educator
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                                    {teacher.fullName}
                                </h1>
                                <p className="text-slate-400 text-lg font-medium">
                                    {teacher.designation} • <span className="text-indigo-400">{teacher.expertise}</span>
                                </p>
                            </div>

                            {/* Contact/Social Links */}
                            <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                <button className="h-10 px-5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                                    <EnvelopeSimple size={18} /> Message
                                </button>
                                <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer">
                                    <LinkedinLogo size={18} />
                                </div>
                                <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer">
                                    <TwitterLogo size={18} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Background Accents */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 blur-[100px] rounded-full -mr-40 -mt-40" />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard 
                        label="Success Rate" 
                        value="98%" 
                        icon={<SealCheck size={22} />} 
                        color="indigo" 
                    />
                    <StatCard 
                        label="Active Batches" 
                        value={teacher.totalBatches.toString()} 
                        icon={<Users size={22} />} 
                        color="amber" 
                    />
                    <StatCard 
                        label="Study Resources" 
                        value={teacher.totalMaterials.toString()} 
                        icon={<BookOpen size={22} />} 
                        color="rose" 
                    />
                    <StatCard 
                        label="Total Students" 
                        value="1.2k+" 
                        icon={<GraduationCap size={22} />} 
                        color="emerald" 
                    />
                </div>

                {/* About Section */}
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <section className="bg-white rounded-lg p-8 border border-slate-100 shadow-sm space-y-4">
                            <h2 className="text-xl font-bold text-slate-900">About the Educator</h2>
                            <p className="text-slate-600 leading-relaxed font-medium">
                                {teacher.bio || `${teacher.fullName} is a dedicated expert in ${teacher.expertise}, helping CA aspirants achieve excellence through structured learning and comprehensive practice.`}
                            </p>
                        </section>

                        {/* Features/Expertise Chips */}
                        <div className="flex flex-wrap gap-2">
                            {["Strategic Management", "AFM Specialist", "FR Consultant", "Live Mentology"].map(tag => (
                                <span key={tag} className="px-5 py-2 rounded-lg bg-white border border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest shadow-sm">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar Actions */}
                    <div className="space-y-4">
                        <div className="bg-indigo-600 rounded-lg p-8 text-white shadow-xl shadow-indigo-500/10 space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold">Join a Batch</h3>
                                <p className="text-indigo-100/70 text-xs font-medium">Learn directly from {teacher.fullName.split(' ')[0]} in personalized cohorts.</p>
                            </div>
                            <Link 
                                href="/student/dashboard" 
                                className="w-full py-4 bg-white text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all hover:bg-slate-50 flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-black/5"
                            >
                                Explore Batches
                            </Link>
                        </div>
                        
                        <div className="bg-white rounded-lg p-8 border border-slate-100 shadow-sm space-y-6">
                            <h3 className="text-sm font-bold text-slate-900">Education Registry</h3>
                            <div className="space-y-4">
                                <EducationItem year="2018 - Present" title="Senior Faculty" org="Academy of Professional Excellence" />
                                <EducationItem year="2012 - 2018" title="Chartered Accountant" org="ICAI Registry" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: string }) {
    const colors: Record<string, string> = {
        indigo: "text-indigo-500 bg-indigo-50 border-indigo-100",
        amber: "text-amber-500 bg-amber-50 border-amber-100",
        rose: "text-rose-500 bg-rose-50 border-rose-100",
        emerald: "text-emerald-500 bg-emerald-50 border-emerald-100"
    };

    return (
        <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-110", colors[color])}>
                {icon}
            </div>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{label}</div>
        </div>
    );
}

function EducationItem({ year, title, org }: { year: string, title: string, org: string }) {
    return (
        <div className="space-y-1">
            <div className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{year}</div>
            <div className="text-xs font-bold text-slate-900">{title}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{org}</div>
        </div>
    );
}
