import { StudentAnalyticsOverview } from "@/components/student/analytics/performance-overview";
import { Sparkle, Info } from "@phosphor-icons/react/dist/ssr";

export default function StudentAnalyticsPage() {
    return (
            <div className="space-y-12 pb-20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)] animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600">Live Insights</span>
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 font-outfit tracking-tight">Performance Analytics</h1>
                        <p className="text-gray-500 text-lg font-medium">Track your journey, master your subjects, and ace the exam.</p>
                    </div>
                </div>

                <StudentAnalyticsOverview />

                {/* Additional Guidance Section */}
                <div className="p-8 rounded-[32px] bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center gap-8">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Info size={32} weight="bold" />
                    </div>
                    <div className="flex-1 space-y-2 text-center md:text-left">
                        <h3 className="text-xl font-bold text-gray-900 font-outfit">How is my ranking calculated?</h3>
                        <p className="text-gray-500 text-sm font-medium leading-relaxed">
                            Your ranking is based on a weighted average of your last 10 mock exams, compared against the 95th percentile (Topper Avg) and the overall cohort median. This provides the most accurate reflection of your current competitive standing.
                        </p>
                    </div>
                    <button className="px-6 py-3 rounded-2xl bg-gray-50 text-gray-600 font-bold text-sm border border-gray-100 hover:bg-white hover:shadow-lg transition-all active:scale-95">
                        Detailed Methodology
                    </button>
                </div>
            </div>
    );
}
