"use client";

import { cn } from "@/lib/utils";
import { 
    ChartBar, 
    IdentificationBadge, 
    PlugsConnected,
    Users, 
    Broadcast, 
    BookOpen,
    TrendUp
} from "@phosphor-icons/react";
import { useState, ReactNode } from "react";
import { SharedPageHeader } from "@/components/shared/page-header";

interface ManagementHubProps {
    statusView: ReactNode;
    usersView: ReactNode;
    curationView: ReactNode;
    marketplaceView: ReactNode;
    subscriptionView: ReactNode;
    integrationView: ReactNode;
    defaultTab?: string;
}

export function ManagementHub({ 
    statusView, 
    usersView, 
    curationView,
    marketplaceView,
    subscriptionView,
    integrationView,
    defaultTab = "pulse"
}: ManagementHubProps) {
    const [activeTab, setActiveTab] = useState(defaultTab);

    const tabs = [
        { id: "pulse", label: "Platform Pulse", icon: TrendUp, color: "text-blue-500", bg: "bg-blue-50" },
        { id: "identity", label: "Identity & Access", icon: Users, color: "text-purple-500", bg: "bg-purple-50" },
        { id: "orchestration", label: "Batch Orchestrator", icon: Broadcast, color: "text-amber-500", bg: "bg-amber-50" },
        { id: "studio", label: "Content Studio", icon: BookOpen, color: "text-emerald-500", bg: "bg-emerald-50" },
        { id: "treasury", label: "Treasury (Billing)", icon: ChartBar, color: "text-indigo-500", bg: "bg-indigo-50" },
        { id: "integrations", label: "Integrations", icon: PlugsConnected, color: "text-rose-500", bg: "bg-rose-50" },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <SharedPageHeader
                eyebrow="Platform Operation > Admin Control Center"
                title="Governance Suite"
                description="Comprehensive oversight and real-time orchestration of users, content spotlighting, and system health."
                aside={
                    <div className="flex p-1.5 bg-[var(--student-panel-muted)]/50 rounded-lg border border-[var(--student-border)]">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2.5 px-6 py-3.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                    activeTab === tab.id 
                                        ? "bg-white text-[var(--student-text)] shadow-lg scale-[1.02]" 
                                        : "text-[var(--student-muted)] hover:text-[var(--student-text)] hover:bg-white/40"
                                )}
                            >
                                <tab.icon size={20} weight={activeTab === tab.id ? "fill" : "bold"} className={activeTab === tab.id ? tab.color : ""} />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                }
            />

            {/* Dynamic Content Area */}
            <div className="min-h-[600px] transition-all duration-500">
                {activeTab === "pulse" && (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        {statusView}
                    </div>
                )}
                {activeTab === "identity" && (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        <div className="student-surface rounded-lg overflow-hidden">
                            {usersView}
                        </div>
                    </div>
                )}
                {activeTab === "orchestration" && (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        {curationView}
                    </div>
                )}
                {activeTab === "studio" && (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        <div className="student-surface rounded-lg p-6 lg:p-10">
                            {marketplaceView}
                        </div>
                    </div>
                )}
                {activeTab === "treasury" && (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        <div className="student-surface rounded-lg p-6 lg:p-10">
                            {subscriptionView}
                        </div>
                    </div>
                )}
                {activeTab === "integrations" && (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        <div className="student-surface rounded-lg p-6 lg:p-10">
                            {integrationView}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
