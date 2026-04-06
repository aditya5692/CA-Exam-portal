"use client";

import { WhatsappLogo } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function WhatsAppButton() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    return (
        <a
            href="https://wa.me/91XXXXXXXXXX"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                "fixed bottom-8 right-8 z-[100] p-4 rounded-full bg-[#25D366] text-white shadow-[0_10px_40px_rgba(37,211,102,0.4)] hover:shadow-[0_15px_50px_rgba(37,211,102,0.6)] transition-all duration-500 hover:scale-110 active:scale-95 group overflow-hidden",
                isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-20 opacity-0 scale-50 pointer-events-none"
            )}
            aria-label="Contact support on WhatsApp"
        >
            <div className="absolute inset-0 bg-white/20 scale-0 group-hover:scale-100 transition-transform duration-500 rounded-full"></div>
            <div className="relative z-10 flex items-center gap-3">
                <WhatsappLogo weight="fill" className="w-8 h-8" />
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-bold whitespace-nowrap">
                    Chat with a CA Mentor
                </span>
            </div>
            
            {/* Ripple effect animation */}
            <span className="absolute inset-0 rounded-full border-4 border-[#25D366] animate-ping opacity-20"></span>
        </a>
    );
}
