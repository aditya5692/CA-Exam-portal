"use client";

import { useEffect, useState } from "react";

export function LayoutTuner() {
    // Default values
    const [headerHeight, setHeaderHeight] = useState(80);
    const [contentPadding, setContentPadding] = useState(40);
    const [headingMargin, setHeadingMargin] = useState(32);
    const [showHeader, setShowHeader] = useState(true);
    const isDev = process.env.NODE_ENV === "development";
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        // Map states to CSS variables
        document.documentElement.style.setProperty("--tuner-header-height", `${headerHeight}px`);
        document.documentElement.style.setProperty("--tuner-content-padding", `${contentPadding}px`);
        document.documentElement.style.setProperty("--tuner-heading-margin", `${headingMargin}px`);
        
        // Use a more robust approach for hiding/showing header to ensure it overrides everything
        const styleId = "tuner-global-overrides";
        let styleTag = document.getElementById(styleId);
        if (!styleTag) {
            styleTag = document.createElement("style");
            styleTag.id = styleId;
            document.head.appendChild(styleTag);
        }
        
        styleTag.innerHTML = `
            header.sticky {
                display: ${showHeader ? "flex" : "none"} !important;
                height: ${headerHeight}px !important;
            }
            .tuner-content-container {
                padding-top: ${contentPadding}px !important;
                padding-bottom: ${contentPadding}px !important;
            }
            .tuner-heading-container {
                margin-bottom: ${headingMargin}px !important;
            }
        `;
    }, [headerHeight, contentPadding, headingMargin, showHeader]);

    if (!isDev) return null;

    if (isMinimized) {
        return (
            <button 
                onClick={() => setIsMinimized(false)}
                className="fixed bottom-4 right-4 z-[9999] bg-indigo-600 text-white p-2.5 rounded-full shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center hover:scale-110 active:scale-90"
                title="Open Layout Tuner"
            >
                <span className="material-symbols-outlined text-[20px]">tune</span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 left-4 md:left-auto z-[9999] md:w-80 bg-white border border-slate-200 shadow-2xl rounded-2xl p-5 font-outfit animate-in slide-in-from-bottom flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-600 text-[18px]">tune</span>
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-800">Visual Tuner</h3>
                </div>
                <button onClick={() => setIsMinimized(true)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
            </div>
            
            <div className="space-y-5">
                {/* Visibility Toggle */}
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 cursor-pointer select-none" htmlFor="toggle-header">
                        Header Visibility
                    </label>
                    <div className="relative inline-flex items-center cursor-pointer">
                        <input 
                            id="toggle-header"
                            type="checkbox" 
                            className="sr-only peer"
                            checked={showHeader}
                            onChange={(e) => setShowHeader(e.target.checked)}
                        />
                        <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-indigo-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </div>
                </div>

                {/* Header Height Slider - Expanded Range */}
                <div className={!showHeader ? "opacity-50 pointer-events-none" : ""}>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Header Height</label>
                        <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{headerHeight}px</span>
                    </div>
                    <input 
                        type="range" min="0" max="500" step="1"
                        value={headerHeight} 
                        onChange={(e) => setHeaderHeight(Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                    />
                </div>
                
                {/* Content Top Padding Slider - Expanded Range */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Content Spacing</label>
                        <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{contentPadding}px</span>
                    </div>
                    <input 
                        type="range" min="0" max="500" step="1"
                        value={contentPadding} 
                        onChange={(e) => setContentPadding(Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                    />
                </div>

                {/* Heading Margin Bottom Slider - Expanded Range */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Heading Bottom Margin</label>
                        <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{headingMargin}px</span>
                    </div>
                    <input 
                        type="range" min="0" max="300" step="1"
                        value={headingMargin} 
                        onChange={(e) => setHeadingMargin(Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <p className="text-[9px] text-slate-400 mt-2 font-medium leading-relaxed">Adjust layout densities in real-time. Use the toggles and sliders to find your brand's signature spacing.</p>
                </div>
            </div>
        </div>
    );
}
