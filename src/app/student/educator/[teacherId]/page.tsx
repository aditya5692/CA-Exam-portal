import { getEducatorPortalData } from "@/actions/educator-portal-actions";
import { getCurrentUser } from "@/lib/auth/session";
import { notFound } from "next/navigation";
import EducatorPortalClient from "./client";

export const dynamic = "force-dynamic";

export default async function EducatorPortalPage({ params }: { params: Promise<{ teacherId: string }> }) {
    const resolvedParams = await params;
    await getCurrentUser(["STUDENT", "ADMIN"]);

    const res = await getEducatorPortalData(resolvedParams.teacherId);

    if (!res.success || !res.data) {
        return notFound();
    }

    return <EducatorPortalClient data={res.data} />;
}
