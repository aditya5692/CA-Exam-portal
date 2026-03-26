"use client";

import { createRazorpayOrder, verifyAndActivatePlan } from "@/actions/subscription-actions";
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
            // Free plan — just close
            if (isFree) {
                setStatus("success");
                return;
            }

            // 1. Create order on server
            const orderRes = await createRazorpayOrder(plan.id);
            if (!orderRes.success || !orderRes.data) {
                setErrorMsg(orderRes.message ?? "Failed to create order.");
                setStatus("idle");
                return;
            }

            const { orderId, amount, currency, keyId } = orderRes.data;

            // 2. Open Razorpay checkout
            await new Promise<void>((resolve, reject) => {
                const rzp = new window.Razorpay({
                    key: keyId,
                    amount,
                    currency,
                    name: "CA Exam Portal",
                    description: `${plan.name} — Annual Subscription`,
                    order_id: orderId,
                    theme: { color: "#1f5c50" },
                    handler: async (response: {
                        razorpay_order_id: string;
                        razorpay_payment_id: string;
                        razorpay_signature: string;
                    }) => {
                        // 3. Verify payment on server
                        const verifyRes = await verifyAndActivatePlan({
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                            planId: plan.id,
                        });

                        if (verifyRes.success) {
                            resolve();
                        } else {
                            reject(new Error(verifyRes.message ?? "Verification failed."));
                        }
                    },
                    modal: {
                        ondismiss: () => reject(new Error("DISMISSED")),
                    },
                });
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
            {/* Load Razorpay SDK */}
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

            <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in duration-300" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[var(--landing-panel)] rounded-[32px] p-8 shadow-[var(--landing-shadow-dark-lg)] z-50 animate-in zoom-in-95 fade-in duration-300">

                        {status === "success" ? (
                            <ActivationSuccess planName={plan.name} />
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-[var(--landing-accent)] flex items-center justify-center shadow-[var(--landing-shadow-accent)]">
                                            <CreditCard size={20} weight="bold" className="text-white" />
                                        </div>
                                        <Dialog.Title className="text-xl font-bold text-[var(--landing-text)] font-outfit">
                                            Activate {plan.name}
                                        </Dialog.Title>
                                    </div>
                                    <Dialog.Close asChild>
                                        <button className="p-2 rounded-xl hover:bg-[var(--landing-bg)] text-[var(--landing-muted-light)] transition-colors">
                                            <X size={20} weight="bold" />
                                        </button>
                                    </Dialog.Close>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-6 rounded-2xl bg-[var(--landing-bg)] border border-[var(--landing-border)]">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-bold text-[var(--landing-muted-light)] uppercase tracking-widest">Plan Selected</span>
                                            <span className="text-xs font-bold text-[var(--landing-accent)] bg-[var(--landing-selection-bg)] px-2 py-0.5 rounded-md uppercase">Annual</span>
                                        </div>
                                        <div className="flex justify-between items-baseline">
                                            <h4 className="text-2xl font-bold text-[var(--landing-text)] font-outfit">{plan.name}</h4>
                                            <div className="text-right">
                                                <span className="text-2xl font-bold text-[var(--landing-text)] font-outfit">{plan.price}</span>
                                                {plan.price !== "Custom" && plan.price !== "₹0" && (
                                                    <span className="text-[var(--landing-muted-light)] font-bold text-xs ml-1">/year</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 p-4 rounded-xl border border-[var(--landing-border)]">
                                            <div className="w-8 h-8 rounded-lg bg-[var(--landing-selection-bg)] text-[var(--landing-accent)] flex items-center justify-center">
                                                <ShieldCheck size={18} weight="bold" />
                                            </div>
                                            <span className="text-sm font-medium text-[var(--landing-muted)]">Secure Payment via UPI, Cards, Netbanking</span>
                                        </div>
                                        <div className="flex items-center gap-3 p-4 rounded-xl border border-[var(--landing-border)]">
                                            <div className="w-8 h-8 rounded-lg bg-[var(--landing-selection-bg)] text-[var(--landing-accent)] flex items-center justify-center">
                                                <Sparkle size={18} weight="bold" />
                                            </div>
                                            <span className="text-sm font-medium text-[var(--landing-muted)]">Instant Activation · 1 Year Access</span>
                                        </div>
                                    </div>

                                    {errorMsg && (
                                        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 font-medium">
                                            {errorMsg}
                                        </div>
                                    )}

                                    <div className="pt-4 space-y-3">
                                        <button
                                            onClick={handleActivate}
                                            disabled={status === "processing"}
                                            className="w-full py-4 rounded-2xl bg-[var(--landing-accent)] text-white font-bold text-sm shadow-[var(--landing-shadow-accent)] hover:bg-[var(--landing-accent-hover)] transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                                        >
                                            {status === "processing" ? (
                                                <>
                                                    <Spinner size={20} weight="bold" className="animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    {isFree ? "Continue for Free" : "Pay & Activate"}
                                                    <ArrowRight size={20} weight="bold" className="group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </button>
                                        <p className="text-center text-[10px] text-[var(--landing-muted-light)] font-bold uppercase tracking-widest px-8 leading-relaxed">
                                            By continuing, you agree to our Terms of Service and Privacy Policy.
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </>
    );
}
