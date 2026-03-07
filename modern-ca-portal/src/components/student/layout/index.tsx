import { ReactNode } from "react";
import Link from "next/link";
import { StudentSidebar } from "../sidebar";
import { Bell, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { getCurrentUserOrDemoUser } from "@/lib/auth/session";

export default async function StudentLayout({ children }: { children: ReactNode }) {
    const student = await getCurrentUserOrDemoUser("STUDENT");
    const initials = (student.fullName ?? "Student")
        .split(" ")
        .map((word) => word[0] ?? "")
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className="flex min-h-screen bg-[#fafafa]">
            <StudentSidebar />
            <main className="flex-1 flex flex-col">
                {/* Top Navigation */}
                <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40">
                    <div className="flex items-center flex-1 max-w-xl">
                        <div className="relative w-full group">
                            <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search exams, topics, or insights..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl text-sm focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/50 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-2 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-indigo-600 transition-all relative">
                            <Bell size={22} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full border-2 border-white" />
                        </button>
                        <div className="h-8 w-px bg-gray-100 mx-1" />
                        <Link href="/student/profile" className="flex items-center gap-3 p-1 pr-3 rounded-xl hover:bg-gray-50 transition-all group">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs ring-2 ring-transparent group-hover:ring-indigo-100 transition-all">
                                {initials}
                            </div>
                            <div className="text-left hidden sm:block">
                                <div className="text-xs font-bold text-gray-900 leading-none">
                                    {student.fullName ?? "Student"}
                                </div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                    {student.plan}
                                </div>
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-8 max-w-[1600px] mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
