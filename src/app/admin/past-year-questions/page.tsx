import { FreeResourcesDashboard } from "@/components/home/FreeResourcesDashboard";

export default function AdminMarketplacePage() {
    return (
        <div className="p-10 max-w-[1600px] mx-auto space-y-8">
            <div className="space-y-2">
                <h1 className="font-outfit text-4xl font-bold tracking-tight text-slate-900">Marketplace <span className="text-indigo-600">Control</span></h1>
                <p className="font-sans font-medium text-slate-500">Comprehensive oversight of all study materials, revision papers, and past year questions across the platform.</p>
            </div>
            
            <FreeResourcesDashboard 
                saveState="hidden" 
                mode="TEACHER"
                defaultView="TABLE"
            />
        </div>
    );
}
