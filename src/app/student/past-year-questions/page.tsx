import { redirect } from "next/navigation";

export default function StudentPastYearQuestionsRedirect() {
    redirect("/student/free-resources?type=PYQ");
}
