import { getStudentBatches } from "@/actions/batch-actions";
import { StudentPageHeader } from "@/components/student/shared/page-header";
import { BatchCard } from "@/components/student/batches/batch-card";
import { Plus, Users, GraduationCap, IdentificationBadge } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentBatchesPage() {
    const res = await getStudentBatches();
    const batches = res.success ? res.data || [] : [];

    return (
        <div className="max-w-[1400px] mx-auto pb-20 space-y-10 px-4">
            <StudentPageHeader
                eyebrow="Segment Management"
                title="My Batches"
                description="Consolidated overview of your enrolled instructional segments and faculty contexts."
                aside={
                    <Link
                        href="/student/redeem"
                        className="student-button-primary flex items-center gap-2 rounded-lg px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-[var(--student-accent-soft-strong)]/10"
                    >
                        <Plus size={18} weight="bold" />
                        Join New Batch
                    </Link>
                }
            />

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="student-surface rounded-lg p-6 border-l-4 border-l-indigo-600 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Users size={24} weight="fill" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900">{batches.length}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Enrollments</div>
                    </div>
                </div>

                <div className="student-surface rounded-lg p-6 border-l-4 border-l-emerald-600 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <GraduationCap size={24} weight="fill" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900">
                            {new Set(batches.map(b => b.teacherId)).size}
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Educators</div>
                    </div>
                </div>

                <div className="student-surface rounded-lg p-6 border-l-4 border-l-amber-600 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                        <IdentificationBadge size={24} weight="fill" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registry Status</div>
                        <div className="text-md font-bold text-emerald-600 flex items-center gap-1.5 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Verified Profiling
                        </div>
                    </div>
                </div>
            </div>

            {/* Batch Grid or Empty State */}
            {batches.length === 0 ? (
                <div className="student-surface rounded-lg p-20 text-center border-dashed border-2 border-[var(--student-border)]">
                    <div className="w-20 h-20 rounded-lg bg-slate-50 text-slate-300 flex items-center justify-center mx-auto mb-6">
                        <Users size={40} weight="thin" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No active enrollments found</h3>
                    <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8">
                        Attach your profile to an instructional segment using the access payload provided by your educator.
                    </p>
                    <Link
                        href="/student/redeem"
                        className="student-button-primary inline-flex items-center gap-2 rounded-lg px-8 py-4 text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg"
                    >
                        <Plus size={18} weight="bold" />
                        Enter Access Payload
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {batches.map((batch) => (
                        <BatchCard key={batch.id} batch={batch} />
                    ))}
                </div>
            )}
        </div>
    );
}
