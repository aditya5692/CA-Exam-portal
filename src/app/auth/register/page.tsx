import AuthLayout from "@/components/auth/auth-layout";
import { RegisterForm } from "@/components/auth/register-form";
import Link from "next/link";

export default function RegisterPage() {
    return (
        <AuthLayout>
            <div className="space-y-6">
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                    <Link
                        href="/auth/login"
                        className="flex-1 text-center py-2.5 rounded-lg text-white/40 hover:text-white/70 text-sm font-bold transition-all"
                    >
                        Login
                    </Link>
                    <Link
                        href="/auth/register"
                        className="flex-1 text-center py-2.5 rounded-lg bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-500/20 transition-all"
                    >
                        Register
                    </Link>
                </div>

                <div className="space-y-2 text-center lg:text-left">
                    <h2 className="text-2xl font-bold text-white font-outfit">Create Account</h2>
                    <p className="text-white/40 text-sm">Join thousands of students on their CA journey.</p>
                </div>

                <RegisterForm />

                <p className="text-center text-white/40 text-xs mt-6">
                    Already have an account?{" "}
                    <Link href="/auth/login" className="text-blue-400 font-bold hover:underline">
                        Login Here
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
