"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, CreditCard, ShieldCheck, Spinner, Sparkle, ArrowRight } from "@phosphor-icons/react";
import { ActivationSuccess } from "./activation-success";
import { activateProPlan } from "@/actions/subscription-actions";
import { useRouter } from "next/navigation";

interface CheckoutModalProps {
    plan: {
        name: string;
        price: string;
        type: "teacher" | "student";
    } | null;
    isOpen: boolean;
    onClose: () => void;
}

export function CheckoutModal({ plan, isOpen, onClose }: CheckoutModalProps) {
    const router = useRouter();
    const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");

    if (!plan) return null;

    const handleActivate = async () => {
        setStatus("processing");
        const result = await activateProPlan();
        if (result.success) {
            setStatus("success");
            router.refresh(); // Refresh the page to immediately reflect the session update
        } else {
            alert(result.message);
            setStatus("idle");
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in duration-300" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-[32px] p-8 shadow-2xl z-50 animate-in zoom-in-95 fade-in duration-300">

                    {status === "success" ? (
                        <ActivationSuccess planName={plan.name} />
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                        <CreditCard size={20} weight="bold" className="text-white" />
                                    </div>
                                    <Dialog.Title className="text-xl font-bold text-gray-900 font-outfit">
                                        Activate {plan.name}
                                    </Dialog.Title>
                                </div>
                                <Dialog.Close asChild>
                                    <button className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 transition-colors">
                                        <X size={20} weight="bold" />
                                    </button>
                                </Dialog.Close>
                            </div>

                            <div className="space-y-6">
                                <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Plan Selected</span>
                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase">Yearly</span>
                                    </div>
                                    <div className="flex justify-between items-baseline">
                                        <h4 className="text-2xl font-bold text-gray-900 font-outfit">{plan.name}</h4>
                                        <div className="text-right">
                                            <span className="text-2xl font-bold text-gray-900 font-outfit">{plan.price}</span>
                                            {plan.price !== "Custom" && <span className="text-gray-400 font-bold text-xs ml-1">/year</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-indigo-100 transition-colors">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                            <ShieldCheck size={18} weight="bold" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-600">Secure Payment via UPI, Cards, Netbanking</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-indigo-100 transition-colors">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                            <Sparkle size={18} weight="bold" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-600">Instant Activation of CA Pass PRO</span>
                                    </div>
                                </div>

                                <div className="pt-4 space-y-3">
                                    <button
                                        onClick={handleActivate}
                                        disabled={status === "processing"}
                                        className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                                    >
                                        {status === "processing" ? (
                                            <>
                                                <Spinner size={20} weight="bold" className="animate-spin" />
                                                Processing Activation...
                                            </>
                                        ) : (
                                            <>
                                                Confirm & Activate <ArrowRight size={20} weight="bold" className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                    <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest px-8 leading-relaxed">
                                        By clicking activate, you agree to our Terms of Service and Privacy Policy.
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
