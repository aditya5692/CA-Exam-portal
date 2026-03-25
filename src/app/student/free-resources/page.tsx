import { FreeResourcesDashboard } from "@/components/home/FreeResourcesDashboard";
import { getCurrentUser } from "@/lib/auth/session";
import { resolveStudentExamTarget } from "@/lib/student-level";
import { getPublicResourceCatalogInsights } from "@/lib/server/resource-intelligence";

export default async function StudentFreeResourcesPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams;
    const initialSubType = typeof params.type === 'string' ? params.type : "All";

    const user = await getCurrentUser(["STUDENT", "ADMIN"]);
    const insights = await getPublicResourceCatalogInsights({});
    const examTarget = resolveStudentExamTarget(user ?? {});
    const initialCategory = examTarget.caLevelLabel;

    return (
        <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <div className="mb-8 grid gap-4 md:grid-cols-4">
                <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Public Resources</div>
                    <div className="mt-2 text-3xl font-black tracking-tight text-slate-900">{insights.totalResources}</div>
                </div>
                <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Trending Now</div>
                    <div className="mt-2 text-3xl font-black tracking-tight text-slate-900">{insights.trendingResources}</div>
                </div>
                <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm md:col-span-2">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Top Subjects</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {insights.topSubjects.slice(0, 5).map((subject) => (
                            <span key={subject} className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-indigo-700">
                                {subject}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
            <FreeResourcesDashboard 
                initialCategory={initialCategory === "CA Intermediate" ? "CA Inter" : initialCategory} 
                initialSubType={initialSubType}
                daysToExam={examTarget.daysToExam} 
                saveState="enabled"
                mode="STUDENT"
                defaultView="GRID"
            />
        </div>
    );
}
