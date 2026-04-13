import { Books, Sparkle } from "@phosphor-icons/react/dist/ssr";

export default function CaseStudiesPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/10 blur-[60px] rounded-full animate-pulse" />
                <div className="relative w-24 h-24 rounded-2xl bg-white border border-slate-100 shadow-2xl flex items-center justify-center text-indigo-600">
                    <Books size={48} weight="fill" />
                </div>
            </div>
            
            <div className="space-y-2 max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2">
                    <Sparkle size={14} weight="fill" /> Coming Soon
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">Case Study Studio</h1>
                <p className="text-slate-500 font-medium text-lg leading-relaxed">
                    We're building a high-fidelity environment for creating and managing complex CA case studies.
                </p>
            </div>

            <div className="pt-8">
                <div className="px-6 py-3 rounded-lg bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Neural Integration Phase: Beta 0.4
                </div>
            </div>
        </div>
    );
}
