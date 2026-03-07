import TeacherLayout from "@/components/teacher/layout";
import { QuestionManager } from "@/components/teacher/question-manager";

export default function QuestionsPage() {
    return (
        <TeacherLayout>
            <QuestionManager />
        </TeacherLayout>
    );
}
