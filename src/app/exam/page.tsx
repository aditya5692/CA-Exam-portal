import { redirect } from "next/navigation";

export default function StandardExamPage() {
    // Redirect obsolete demo engine to the central exam hub
    redirect("/student/exams");
}
