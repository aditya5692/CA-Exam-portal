"use client";

import { submitExamAttempt } from "@/actions/exam-actions";
import { ExamLayout } from "@/components/exam/exam-layout";
import { ExamMain } from "@/components/exam/exam-main";
import type { ExamWithQuestions } from "@/types/exam";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ExamClientProps {
    exam: ExamWithQuestions;
    studentName: string;
    attemptId: string;
}

export function ExamClient({ exam, studentName, attemptId }: ExamClientProps) {
    const router = useRouter();

    const handleSaveAnswer = async (questionId: string, selectedOptionId: string, timeSpent: number) => {
        // Silently save answer in background if needed
        console.log("Saving answer:", { questionId, selectedOptionId, timeSpent });
    };

    const handleSubmitExam = async (answers: { questionId: string, selectedOptionId: string, timeSpent: number }[]) => {
        try {
            const result = await submitExamAttempt(attemptId, answers);
            if (result.success) {
                toast.success("Exam submitted successfully!");
                router.push(`/student/results/${attemptId}`);
            } else {
                toast.error(result.message || "Failed to submit exam.");
            }
        } catch {
            toast.error("An error occurred during submission.");
        }
    };

    return (
        <ExamLayout
            examTitle={exam.title}
            duration={exam.duration}
            studentName={studentName}
            onExit={() => router.push("/student/dashboard")}
            onSubmit={() => { }} // Submission handled in ExamMain
        >
            <ExamMain
                questions={exam.questions}
                onSave={handleSaveAnswer}
                onSubmit={handleSubmitExam}
            />
        </ExamLayout>
    );
}
