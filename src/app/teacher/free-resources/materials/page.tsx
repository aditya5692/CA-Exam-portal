import { getTeacherBatchesForMaterials, getTeacherMaterials } from "@/actions/educator-actions";
import { MaterialsManager } from "@/components/teacher/materials-manager";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TeacherMaterialsNestedPage() {
    const user = await getCurrentUser(["TEACHER", "ADMIN"]);
    if (!user) redirect("/auth/login");

    const [materialsRes, batchesRes] = await Promise.all([
        getTeacherMaterials(),
        getTeacherBatchesForMaterials()
    ]);

    if (!materialsRes.success || !materialsRes.data) {
        return (
            <div className="p-8 text-center text-slate-500 font-medium">
                Failed to load materials. Please refresh.
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <MaterialsManager 
                initialData={materialsRes.data}
                batches={batchesRes.success ? batchesRes.data : []}
                currentUserId={user.id}
            />
        </div>
    );
}
