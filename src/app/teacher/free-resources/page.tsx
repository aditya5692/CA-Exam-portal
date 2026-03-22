import { FreeResourcesDashboard } from "@/components/home/FreeResourcesDashboard";

export default async function TeacherFreeResourcesPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams;
    const initialSubType = typeof params.type === 'string' ? params.type : "All";

    return (
        <div className="p-6 max-w-[1280px] mx-auto animate-in fade-in duration-500">
            <FreeResourcesDashboard 
                saveState="hidden" 
                mode="TEACHER"
                defaultView="GRID"
                initialSubType={initialSubType}
            />
        </div>
    );
}
