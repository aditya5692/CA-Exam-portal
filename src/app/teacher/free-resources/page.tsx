export const dynamic = "force-dynamic";

import { FreeResourcesDashboard } from "@/components/home/FreeResourcesDashboard";
import { getCurrentUser } from "@/lib/auth/session";

export default async function TeacherFreeResourcesPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams;
    const initialSubType = typeof params.type === "string" ? params.type : "All";
    const initialSearch  = typeof params.search === "string" ? params.search : "";

    const user = await getCurrentUser(["TEACHER", "ADMIN"]);

    return (
        <div className="w-full max-w-7xl mx-auto pb-12   animate-in fade-in slide-in-from-bottom-4 duration-500 px-0">
            <FreeResourcesDashboard
                saveState="hidden"
                mode="TEACHER"
                defaultView="GRID"
                initialSubType={initialSubType}
                initialSearch={initialSearch}
                currentUserId={user?.id}
            />
        </div>
    );
}
