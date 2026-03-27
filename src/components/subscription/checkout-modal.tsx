"use client";

import { createRazorpayOrder, verifyAndActivatePlan } from "@/actions/subscription-actions";
import { createRecurringSubscription } from "@/actions/razorpay-subscription-actions";
import { ArrowRight, CreditCard, ShieldCheck, Sparkle, Spinner, X } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useState } from "react";
import { ActivationSuccess } from "./activation-success";

interface CheckoutModalProps {
    plan: {
        id: string;
        name: string;
        price: string;
        type: "teacher" | "student";
        isRecurring?: boolean;
        razorpayPlanId?: string;
    } | null;
    isOpen: boolean;
    onClose: () => void;
}

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Razorpay: any;
    }
}

export function CheckoutModal({ plan, isOpen, onClose }: CheckoutModalProps) {
    const router = useRouter();
    const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    if (!plan) return null;

    const isFree = plan.price === "₹0";

    const handleActivate = async () => {
        setErrorMsg("");
        setStatus("processing");

        try {
            if (isFree) {
                setStatus("success");
                return;
            }

            let razorpayData;
            if (plan.isRecurring && plan.razorpayPlanId) {
                const res = await createRecurringSubscription(plan.razorpayPlanId);
                if (!res.success) throw new Error(res.message);
                razorpayData = res.data;
            } else {
                const res = await createRazorpayOrder(plan.id);
                if (!res.success) throw new Error(res.message);
                razorpayData = res.data;
            }

            const { subscriptionId, orderId, amount, currency, keyId, userName, userEmail, userPhone } = razorpayData as any;

            await new Promise<void>((resolve, reject) => {
                const options: any = {
                    key: keyId,
                    name: "CA Exam Portal",
                    description: `${plan.name} — Subscription`,
                    prefill: {
                        name: userName,
                        email: userEmail,
                        contact: userPhone,
                    },
                    theme: { color: "#000000" },
                    modal: { ondismiss: () => reject(new Error("DISMISSED")) },
                    handler: async (response: any) => {
                        if (!plan.isRecurring) {
                            const verifyRes = await verifyAndActivatePlan({
                                razorpayOrderId: response.razorpay_order_id,
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpaySignature: response.razorpay_signature,
                                planId: plan.id,
                            });
                            if (verifyRes.success) resolve();
                            else reject(new Error(verifyRes.message));
                        } else {
                             resolve();
                        }
                    },
                };

                if (plan.isRecurring) {
                    options.subscription_id = subscriptionId;
                } else {
                    options.order_id = orderId;
                    options.amount = amount;
                    options.currency = currency;
                }

                const rzp = new window.Razorpay(options);
                rzp.open();
            });

            setStatus("success");
            router.refresh();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg !== "DISMISSED") {
                setErrorMsg(msg);
            }
            setStatus("idle");
        }
    };

    return (
        <>
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

            <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 animate-in fade-in duration-200" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 animate-in zoom-in-95 fade-in duration-300 overflow-hidden">
                        
                        {/* Header */}
                        <div className="bg-slate-900 px-8 py-8 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                                        <ShieldCheck size={28} weight="bold" className="text-emerald-400" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <Dialog.Title className="text-xl font-bold font-outfit tracking-tight">
                                            Secure Checkout
                                        </Dialog.Title>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 leading-none">Verified Payment Node</p>
                                    </div>
                                </div>
                                <Dialog.Close asChild>
                                    <button className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                                        <X size={20} weight="bold" />
                                    </button>
                                </Dialog.Close>
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            {status === "success" ? (
                                <ActivationSuccess planName={plan.name} />
                            ) : (
                                <>
                                    <div className="p-6 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selected Plan</span>
                                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider border border-emerald-100">
                                                {plan.isRecurring ? "Recurring" : "Full Term"}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-1">
                                                <h4 className="text-lg font-bold text-slate-900 font-outfit leading-none">{plan.name}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Governance Access</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-baseline gap-1 justify-end">
                                                    <span className="text-2xl font-bold text-slate-900 font-outfit">{plan.price}</span>
                                                    {plan.price !== "₹0" && <span className="text-slate-400 font-bold text-[10px] uppercase"> 
                                                        {plan.isRecurring ? "/mo" : "/yr"}
                                                    </span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                                            <div className="w-8 h-8 rounded-lg bg-white text-emerald-500 flex items-center justify-center shadow-sm border border-slate-100">
                                                <CreditCard size={18} weight="bold" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-bold text-slate-700">Verified Gateway</p>
                                                <p className="text-[10px] font-medium text-slate-400">UPI, Cards, Netbanking</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                                            <div className="w-8 h-8 rounded-lg bg-white text-emerald-500 flex items-center justify-center shadow-sm border border-slate-100">
                                                <Sparkle size={18} weight="bold" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-bold text-slate-700">Instant Activation</p>
                                                <p className="text-[10px] font-medium text-slate-400">Immediate access granted</p>
                                            </div>
                                        </div>
                                    </div>

                                    {errorMsg && (
                                        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs text-red-600 font-bold">
                                            {errorMsg}
                                        </div>
                                    )}

                                    <div className="pt-2">
                                        <button
                                            onClick={handleActivate}
                                            disabled={status === "processing"}
                                            className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold text-sm transition-all hover:bg-slate-800 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {status === "processing" ? (
                                                <>
                                                    <Spinner size={20} weight="bold" className="animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    {isFree ? "Get Started Now" : "Pay & Activate"}
                                                    <ArrowRight size={20} weight="bold" />
                                                </>
                                            )}
                                        </button>
                                        <p className="text-center mt-4 text-[10px] font-medium text-slate-400">
                                            Secure end-to-end encrypted transaction
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </>
    );
}
