import { getSavedItems } from "@/actions/student-actions";
import { SavedItemsList } from "@/components/student/saved/saved-items-list";
import { StudentPageHeader } from "@/components/student/shared/page-header";
import { getCurrentUser } from "@/lib/auth/session";
import { resolveStudentExamTarget } from "@/lib/student-level";
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
    const examTarget = resolveStudentExamTarget(user ?? {});

    return (
        <div className="space-y-12 pb-20  ">
            <StudentPageHeader
                eyebrow="My collection"
                title="Saved"
                accent="Items"
                description="Access your saved study materials and practice exams in one place."
                daysToExam={examTarget.daysToExam}
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
