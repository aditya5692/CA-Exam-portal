import { ReactNode } from "react";
import Link from "next/link";
import { TeacherSidebar } from "./sidebar";
import { Bell, MagnifyingGlass, UserCircle } from "@phosphor-icons/react/dist/ssr";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function TeacherLayout({ children }: { children: ReactNode }) {
    const teacher = await getCurrentUser(["TEACHER", "ADMIN"]);

    if (!teacher) {
        redirect("/auth/login");
    }

    return (
        <div className="flex min-h-screen bg-[#f8fafc]">
            <TeacherSidebar showAdminLink={teacher.role === "ADMIN"} />
            <div className="flex-1 flex flex-col">
                <header className="h-16 border-b border-gray-100 bg-white/70 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between">
                    <div className="relative w-96">
                        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search students, tests, or analytics..."
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500/30 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-2 rounded-xl bg-gray-50 border border-gray-100 text-gray-500 hover:text-gray-900 hover:bg-white hover:border-gray-200 transition-all relative">
                            <Bell size={20} />
                            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-600 border-2 border-white" />
                        </button>
                        <div className="h-8 w-px bg-gray-100 mx-1" />
                        <Link href="/teacher/profile" className="flex items-center gap-3 cursor-pointer group">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-all">
                                    {teacher.fullName ?? "Teacher"}
                                </p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                    {teacher.designation ?? "Faculty"}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/20 p-0.5">
                                <div className="w-full h-full rounded-[10px] bg-white flex items-center justify-center">
                                    <UserCircle size={28} className="text-indigo-600" />
                                </div>
                            </div>
                        </Link>
                    </div>
                </header>

                <main className="p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}


