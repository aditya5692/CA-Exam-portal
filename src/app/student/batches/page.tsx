import { getStudentBatches } from "@/actions/batch-actions";
import { SharedPageHeader } from "@/components/shared/page-header";
import { BatchListingClient } from "@/components/student/batches/batch-listing-client";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentBatchesPage() {
    const res = await getStudentBatches();
    const batches = res.success ? res.data || [] : [];

    return (
        <div className="max-w-[1400px] mx-auto pb-20 space-y-10 px-4">
            <SharedPageHeader
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

            {/* Interactive Batch Listing & Stats Content */}
            <BatchListingClient initialBatches={batches} />
        </div>
    );
}
