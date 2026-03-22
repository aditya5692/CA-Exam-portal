import { redirect } from "next/navigation";

export default function TeacherPastYearQuestionsRedirect() {
    redirect("/teacher/free-resources?type=PYQ");
}
