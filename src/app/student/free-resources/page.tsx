import { FreeResourcesDashboard } from "@/components/home/FreeResourcesDashboard";
import { getCurrentUser } from "@/lib/auth/session";
import { resolveStudentCALevel, getStudentCACategory } from "@/lib/student-level";
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
    
    let daysToExam = 0;
    const userTarget = user?.examTarget || "";
    if (userTarget) {
        const months = { "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5, "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11 };
        const parts = userTarget.split(" ");
        if (parts.length >= 2) {
            const moPartRaw = parts[parts.length - 2].substring(0, 3).toLowerCase();
            const moKey = Object.keys(months).find(k => k.toLowerCase() === moPartRaw);
            const yrPart = parseInt(parts[parts.length - 1]);
            if (moKey && !isNaN(yrPart)) {
                const targetDate = new Date(yrPart, months[moKey as keyof typeof months], 1);
                const now = new Date();
                const diffTime = targetDate.getTime() - now.getTime();
                daysToExam = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            }
        }
    }

    const caLevel = resolveStudentCALevel(user?.examTarget, user?.department);
    const initialCategory = getStudentCACategory(caLevel);

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
                daysToExam={daysToExam} 
                saveState="enabled"
                mode="STUDENT"
                defaultView="GRID"
            />
        </div>
    );
}
