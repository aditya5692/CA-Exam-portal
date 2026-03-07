import TeacherLayout from "@/components/teacher/layout";
import { StudentManager } from "@/components/teacher/student-manager";

export default function StudentsPage() {
    return (
        <TeacherLayout>
            <StudentManager />
        </TeacherLayout>
    );
}
