import StudentLayout from "@/components/student/layout";
import { ProfileEditor } from "@/components/profile/profile-editor";

export default function StudentProfilePage() {
    return (
        <StudentLayout>
            <ProfileEditor mode="student" />
        </StudentLayout>
    );
}
