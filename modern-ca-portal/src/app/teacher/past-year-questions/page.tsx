import { PastYearQuestionsDashboard } from "@/components/home/PastYearQuestionsDashboard";

export default function TeacherPastYearQuestionsPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Past Year Questions Vault
                </h1>
                <p className="text-gray-500">
                    Review and distribute actual exam papers from previous ICAI attempts to your batches.
                </p>
            </div>

            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 p-4">
                <PastYearQuestionsDashboard />
            </div>
        </div>
    );
}
