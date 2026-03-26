"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { 
    MagnifyingGlass, 
    User, 
    Video, 
    FileText, 
    ProjectorScreen, 
    Users, 
    IdentificationBadge, 
    CircleNotch,
    X,
    Keyboard
} from "@phosphor-icons/react";
import { performGlobalSearch, SearchResult } from "@/actions/search-actions";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@/hooks/use-media-query";

interface Props {
    role: "STUDENT" | "TEACHER";
}

export function GlobalSearch({ role }: Props) {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const isMobile = useMediaQuery("(max-width: 768px)");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSearch = useCallback(async (q: string) => {
        if (q.trim().length < 2) {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const res = await performGlobalSearch(q);
        if (res.success) {
            setResults(res.data);
            setIsOpen(true);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) handleSearch(query);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, handleSearch]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "k") {
                event.preventDefault();
                inputRef.current?.focus();
            }

            if (isOpen) {
                if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
                } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setSelectedIndex(prev => Math.max(prev - 1, -1));
                } else if (event.key === "Enter" && selectedIndex >= 0) {
                    event.preventDefault();
                    const selected = results[selectedIndex];
                    router.push(selected.href);
                    setIsOpen(false);
                    setQuery("");
                } else if (event.key === "Escape") {
                    setIsOpen(false);
                }
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, results, selectedIndex, router]);

    const getIcon = (type: string) => {
        switch (type) {
            case "TEACHER": return <IdentificationBadge size={18} weight="fill" className="text-[var(--student-accent-strong)]" />;
            case "STUDENT": return <User size={18} weight="fill" className="text-[var(--student-accent)]" />;
            case "EXAM": return <ProjectorScreen size={18} weight="fill" className="text-[var(--student-support)]" />;
            case "MATERIAL": return <FileText size={18} weight="fill" className="text-emerald-500" />;
            case "BATCH": return <Users size={18} weight="fill" className="text-indigo-500" />;
            default: return <MagnifyingGlass size={18} weight="fill" className="text-[var(--student-muted)]" />;
        }
    };

    return (
        <div className="relative w-full max-w-md lg:block" ref={dropdownRef}>
            {/* Desktop / Large Viewport Search */}
            <div className={cn(
                "group relative flex items-center rounded-2xl border border-[var(--student-border)] bg-[rgba(255,253,249,0.72)] px-4 py-2.5 transition-all focus-within:border-[var(--student-border-strong)] focus-within:bg-white focus-within:ring-4 focus-within:ring-[rgba(31,92,80,0.08)] md:px-5 md:py-3 text-[var(--student-text)]",
                isMobile && "hidden"
            )}>
                {loading ? (
                    <CircleNotch size={20} weight="bold" className="mr-3 shrink-0 animate-spin text-[var(--student-accent)]" />
                ) : (
                    <MagnifyingGlass size={20} weight="bold" className="mr-3 shrink-0 text-[var(--student-muted)] transition-colors group-focus-within:text-[var(--student-accent)]" />
                )}
                <input
                    ref={inputRef}
                    className="w-full border-none bg-transparent text-sm font-medium placeholder:text-[var(--student-muted)] outline-none focus:ring-0"
                    placeholder="Search anything..."
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
                />
                {!query && (
                    <div className="hidden items-center gap-1 rounded-lg border border-[var(--student-border)] bg-[var(--student-panel-muted)] px-2 py-1 text-[10px] font-bold text-[var(--student-muted)] sm:flex">
                        <Keyboard size={12} weight="bold" />
                        <span>Ctrl+K</span>
                    </div>
                )}
                {query && (
                    <button 
                        onClick={() => { setQuery(""); setResults([]); }}
                        className="p-1 hover:bg-[var(--student-panel-muted)] rounded-md text-[var(--student-muted)]"
                    >
                        <X size={16} weight="bold" />
                    </button>
                )}
            </div>

            {/* Mobile Trigger Button */}
            {isMobile && (
                <button 
                    onClick={() => setIsMobileSearchOpen(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--student-border)] bg-[rgba(255,253,249,0.72)] text-[var(--student-muted)] active:scale-95 transition-all"
                >
                    <MagnifyingGlass size={20} weight="bold" />
                </button>
            )}

            {/* Desktop Dropdown */}
            {!isMobile && isOpen && query.trim().length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-3 max-h-[420px] overflow-y-auto rounded-3xl border border-[var(--student-border)] bg-[var(--student-panel-solid)] p-2 shadow-[0_24px_48px_rgba(55,48,38,0.12)] backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
                    <ResultsList 
                        results={results} 
                        loading={loading} 
                        query={query} 
                        selectedIndex={selectedIndex} 
                        onSelect={(id) => { setIsOpen(false); setQuery(""); }}
                        setSelectedIndex={setSelectedIndex}
                    />
                </div>
            )}

            {/* Mobile Full-Screen Modal */}
            {isMobile && isMobileSearchOpen && (
                <div className="fixed inset-0 z-[1000] flex flex-col bg-[var(--student-bg)] overflow-hidden animate-in fade-in duration-200">
                    <div className="flex items-center gap-3 border-b border-[var(--student-border)] p-4">
                        <button 
                            onClick={() => setIsMobileSearchOpen(false)}
                            className="p-1 text-[var(--student-muted)]"
                        >
                            <ArrowLeft size={24} weight="bold" />
                        </button>
                        <div className="relative flex-1 flex items-center">
                            <input
                                autoFocus
                                className="w-full border-none bg-[var(--student-panel-muted)] rounded-xl px-4 py-3 text-base font-medium placeholder:text-[var(--student-muted)] outline-none focus:ring-0 text-[var(--student-text)]"
                                placeholder="Search..."
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            {loading && <CircleNotch size={18} weight="bold" className="absolute right-4 animate-spin text-[var(--student-accent)]" />}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-[var(--student-bg)] p-2">
                        {query.trim().length >= 2 ? (
                            <ResultsList 
                                results={results} 
                                loading={loading} 
                                query={query} 
                                selectedIndex={selectedIndex} 
                                onSelect={() => { setIsMobileSearchOpen(false); setQuery(""); }}
                                setSelectedIndex={setSelectedIndex}
                            />
                        ) : (
                            <div className="py-12 text-center space-y-2">
                                <MagnifyingGlass size={48} weight="thin" className="mx-auto text-[var(--student-border-strong)]" />
                                <p className="text-xs font-bold uppercase tracking-widest text-[var(--student-muted)]">Universal Registry Search</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

import { ArrowLeft } from "@phosphor-icons/react";

function ResultsList({ 
    results, 
    loading, 
    query, 
    selectedIndex, 
    onSelect,
    setSelectedIndex
}: { 
    results: SearchResult[], 
    loading: boolean, 
    query: string, 
    selectedIndex: number, 
    onSelect: (id: string) => void,
    setSelectedIndex: (idx: number) => void
}) {
    const getIcon = (type: string) => {
        switch (type) {
            case "TEACHER": return <IdentificationBadge size={18} weight="fill" className="text-[var(--student-accent-strong)]" />;
            case "STUDENT": return <User size={18} weight="fill" className="text-blue-500" />;
            case "EXAM": return <ProjectorScreen size={18} weight="fill" className="text-amber-500" />;
            case "MATERIAL": return <FileText size={18} weight="fill" className="text-emerald-500" />;
            case "BATCH": return <Users size={18} weight="fill" className="text-indigo-500" />;
            default: return <MagnifyingGlass size={18} weight="fill" className="text-slate-400" />;
        }
    };

    if (loading && results.length === 0) {
        return (
            <div className="py-8 text-center">
                <CircleNotch size={32} weight="bold" className="mx-auto mb-3 animate-spin text-[var(--student-accent)]" />
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--student-muted)]">Scanning Registry...</p>
            </div>
        );
    }

    if (results.length > 0) {
        return (
            <div className="space-y-1">
                {results.map((res, index) => (
                    <Link
                        key={`${res.type}-${res.id}`}
                        href={res.href}
                        onClick={() => onSelect(res.id)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={cn(
                            "flex items-center gap-4 rounded-xl px-4 py-3 transition-all",
                            selectedIndex === index ? "bg-[var(--student-accent-soft)]" : "hover:bg-[var(--student-panel-muted)]"
                        )}
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--student-border)] bg-white shadow-sm">
                            {getIcon(res.type)}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <div className="truncate text-sm font-bold text-[var(--student-text)]">{res.title}</div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--student-accent-strong)]">{res.type}</span>
                                {res.subtitle && <span className="text-[10px] font-bold text-[var(--student-muted-strong)] truncate">• {res.subtitle}</span>}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        );
    }

    return (
        <div className="py-10 text-center">
            <X size={32} weight="light" className="mx-auto mb-3 text-[var(--student-border-strong)]" />
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--student-muted)]">No results found for "{query}"</p>
        </div>
    );
}
