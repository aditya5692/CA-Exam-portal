import { getExamDetails, startExamAttempt } from "@/actions/exam-actions";
import { ExamClient } from "@/components/exam/exam-client";
import { redirect } from "next/navigation";

interface ExamPageProps {
    params: { examId: string };
}

export default async function ExamPage({ params }: ExamPageProps) {
    const { examId } = await params;

    // In a real app, get current user from session
    const studentId = "clp12345"; // Placeholder for demonstration
    const studentName = "Aditya Student";

    const { success, exam, error } = await getExamDetails(examId);

    if (!success || !exam) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="bg-white p-10 rounded-[32px] shadow-2xl border border-slate-100 text-center max-w-md animate-in fade-in zoom-in duration-500">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Exam Unavailable</h1>
                    <p className="text-slate-500 mb-8 leading-relaxed">{error || "This exam is currently not accessible."}</p>
                    <a
                        href="/student/dashboard"
                        className="block w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                    >
                        Back to Dashboard
                    </a>
                </div>
            </div>
        );
    }

    // Initialize/Start attempt
    const attemptResult = await startExamAttempt(examId, studentId);
    if (!attemptResult.success || !attemptResult.attempt) {
        return <div>Error starting attempt</div>;
    }

    return (
        <ExamClient
            exam={exam}
            studentName={studentName}
            attemptId={attemptResult.attempt.id}
        />
    );
}
