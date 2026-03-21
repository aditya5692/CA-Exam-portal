"use client";

export function ExamHubFooter() {
    return (
        <footer className="mt-16 flex items-center justify-center border-t border-slate-100 pt-8 pb-12">
            <div className="flex items-center gap-3 grayscale opacity-40">
                <span className="material-symbols-outlined text-3xl">verified</span>
                <div className="text-left">
                    <p className="text-sm font-bold tracking-tight text-slate-900 leading-none">Financly Academic Quality</p>
                    <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-wider">Vetted by ICAI Certified Educators</p>
                </div>
            </div>
        </footer>
    );
}
