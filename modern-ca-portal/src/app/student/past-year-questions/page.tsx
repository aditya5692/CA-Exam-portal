import { PastYearQuestionsDashboard } from "@/components/home/PastYearQuestionsDashboard";

export default function StudentPastYearQuestionsPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    Past Year Questions Vault
                </h1>
                <p className="text-gray-500">
                    Review and download the actual exam papers from previous ICAI attempts.
                </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-zinc-800 p-4">
                <PastYearQuestionsDashboard />
            </div>
        </div>
    );
}
