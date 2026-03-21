"use client";

import { login } from "@/actions/auth-actions";
import { ArrowRight,Chrome,Lock,User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function LoginForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        registrationNumber: "",
        password: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const result = await login({
                identifier: formData.registrationNumber,
                password: formData.password
            });
            if (result.success) {
                toast.success(result.message);
                router.push(result.data?.redirectTo || "/student/dashboard");
            } else {
                toast.error(result.message);
            }
        } catch {
            toast.error("An error occurred during login.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
                <label className="text-sm font-semibold text-white/70 ml-1">
                    Registration Number
                </label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                        type="text"
                        name="registrationNumber"
                        required
                        placeholder="Enter ICAI Reg No."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all uppercase"
                        value={formData.registrationNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, registrationNumber: e.target.value.toUpperCase() }))}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-semibold text-white/70 ml-1">
                    Password
                </label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                        type="password"
                        name="password"
                        required
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-linear-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
            >
                {isSubmitting ? "Signing in..." : (
                    <>
                        Log In <ArrowRight className="w-4 h-4" />
                    </>
                )}
            </button>

            <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#152344] px-2 text-white/40">Or continue with</span>
                </div>
            </div>

            <button
                type="button"
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-3 transition-all"
            >
                <Chrome className="w-5 h-5 text-blue-400" />
                Google Workspace
            </button>

            <p className="text-center text-white/40 text-xs pt-4">
                Demo access: <span className="text-white/60 font-mono">DEMO2026</span> / <span className="text-white/60 font-mono">demo123</span>
            </p>
        </form>
    );
}
