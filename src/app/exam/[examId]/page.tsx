import { redirect } from "next/navigation";

interface ExamPageProps {
    params: { examId: string };
}

export default async function ExamPage({ params }: ExamPageProps) {
    const { examId } = await params;
    
    // Redirect all legacy exam attempts to the modern War Room flow
    redirect(`/exam/war-room?examId=${examId}`);
}
