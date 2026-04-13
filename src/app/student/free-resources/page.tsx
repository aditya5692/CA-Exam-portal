import { FreeResourcesDashboard } from "@/components/home/FreeResourcesDashboard";
import { getCurrentUser } from "@/lib/auth/session";
import { resolveStudentExamTarget } from "@/lib/student-level";

export default async function StudentFreeResourcesPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const initialSubType = typeof params.type === "string" ? params.type : "All";
    const initialSearch = typeof params.search === "string" ? params.search : "";

    const user = await getCurrentUser(["STUDENT", "ADMIN"]);
    const examTarget = resolveStudentExamTarget(user ?? {});
    const initialCategory = examTarget.caLevelLabel;

    return (
        <div className="mx-auto max-w-[1600px] p-6 md:p-8 animate-in fade-in duration-500">
            <div className="mb-8 rounded-lg border border-slate-100 bg-white p-6 shadow-sm md:p-8">
                <div className="space-y-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Student resources
                    </div>
                    <h1 className="  text-3xl font-black tracking-tight text-slate-900">
                        Study library
                    </h1>
                    <p className="max-w-3xl text-sm leading-7 text-slate-500">
                        Browse revision files, PYQs, RTPs, MTPs, and videos without the extra trending
                        or course-summary clutter. Use filters to jump straight to the material you need.
                    </p>
                </div>
            </div>

            <FreeResourcesDashboard
                initialCategory={initialCategory === "CA Intermediate" ? "CA Inter" : initialCategory}
                initialSubType={initialSubType}
                initialSearch={initialSearch}
                daysToExam={examTarget.daysToExam}
                saveState="enabled"
                mode="STUDENT"
                defaultView="GRID"
            />
        </div>
    );
}
