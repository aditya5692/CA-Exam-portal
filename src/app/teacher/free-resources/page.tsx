import { FreeResourcesDashboard } from "@/components/home/FreeResourcesDashboard";

export default function TeacherFreeResourcesPage() {
    return (
        <div className="p-6 max-w-[1280px] mx-auto animate-in fade-in duration-500">
            <FreeResourcesDashboard saveState="hidden" />
        </div>
    );
}
