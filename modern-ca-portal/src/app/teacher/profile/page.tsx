import TeacherLayout from "@/components/teacher/layout";
import { ProfileEditor } from "@/components/profile/profile-editor";

export default function TeacherProfilePage() {
    return (
        <TeacherLayout>
            <ProfileEditor mode="teacher" />
        </TeacherLayout>
    );
}
