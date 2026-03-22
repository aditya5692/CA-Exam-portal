import { getSavedItems } from "@/actions/student-actions";
import { SavedItemsList } from "@/components/student/saved/saved-items-list";
import { StudentPageHeader } from "@/components/student/shared/page-header";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function SavedItemsPage() {
    const user = await getCurrentUser(["STUDENT", "ADMIN"]);
    const res = await getSavedItems();

    if (!res.success) {
        // If we have a message indicating auth failure, redirect
        if (res.message?.includes("Unauthorized") || res.message?.includes("No student account")) {
            redirect("/auth/login");
        }
    }

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

    return (
        <div className="space-y-12 pb-20 font-outfit">
            <StudentPageHeader
                eyebrow="My collection"
                title="Saved"
                accent="Items"
                description="Access your saved study materials and practice exams in one place."
                daysToExam={daysToExam}
            />

            {!res.success && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                    Error loading saved items: {res.message}. Please check your database connection.
                </div>
            )}

            <SavedItemsList 
                materials={res.data?.materials || []} 
                exams={res.data?.exams || []} 
            />
        </div>
    );
}
