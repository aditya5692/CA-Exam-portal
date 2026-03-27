import { getAdminMetrics } from "@/actions/admin-index-actions";
import prisma from "@/lib/prisma/client";
import { ManagementHub } from "@/components/admin/management-hub";
import { StatusView } from "@/components/admin/status-view";
import { AdminDirectory } from "@/components/admin/admin-directory";
import { ContentStudio } from "@/components/admin/content-studio";
import { BatchOrchestrator } from "@/components/admin/batch-orchestrator";
import { SubscriptionManager } from "@/components/teacher/subscription-manager";
import { redirect } from "next/navigation";
import { getSessionPayload } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminControlCenterPage({
    searchParams
}: {
    searchParams: { tab?: string }
}) {
    const session = await getSessionPayload();
    if (!session || (session.role !== "ADMIN" && !session.isSuperAdmin)) {
        redirect("/auth/login");
    }

    const [metricsResult, users, batches, exams, materials, teachers] = await Promise.all([
        getAdminMetrics(),
        prisma.user.findMany({
            orderBy: { createdAt: "desc" }
        }),
        prisma.batch.findMany({
            include: {
                teacher: { select: { fullName: true, email: true } },
                _count: { select: { enrollments: true, exams: true, announcements: true } }
            },
            orderBy: { createdAt: "desc" }
        }),
        prisma.exam.findMany({
            include: { teacher: { select: { fullName: true } } },
            orderBy: { createdAt: "desc" }
        }),
        prisma.studyMaterial.findMany({
            include: { uploadedBy: { select: { fullName: true } } },
            orderBy: { createdAt: "desc" }
        }),
        prisma.user.findMany({
            where: { role: "TEACHER" },
            select: { id: true, fullName: true, email: true }
        })
    ]);

    if (!metricsResult.success || !metricsResult.data) {
        return <div>Error loading metrics</div>;
    }

    // Map tab IDs to searchParams
    const tabMap: Record<string, string> = {
        pulse: "pulse",
        identity: "identity",
        orchestration: "orchestration",
        studio: "studio",
        treasury: "treasury"
    };
    
    const activeTab = tabMap[searchParams.tab || ""] || "pulse";

    const statusView = <StatusView metrics={metricsResult.data} />;
    const usersView = <AdminDirectory initialUsers={users} />;
    const orchestratorView = <BatchOrchestrator batches={batches as any} teachers={teachers as any} />;
    const studioView = <ContentStudio exams={exams as any} materials={materials as any} />;
    const treasuryView = <SubscriptionManager />;

    return (
        <div className="mx-auto w-full max-w-[1600px] p-4 md:p-8 space-y-12">
            <ManagementHub
                statusView={statusView}
                usersView={usersView}
                curationView={orchestratorView}
                marketplaceView={studioView}
                subscriptionView={treasuryView}
                defaultTab={activeTab}
            />
        </div>
    );
}
