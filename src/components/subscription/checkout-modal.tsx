"use client";

import { createRazorpayOrder, recordCheckoutResolution, verifyAndActivatePlan } from "@/actions/subscription-actions";
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
    } | null;
    isOpen: boolean;
    onClose: () => void;
}

type CheckoutData = {
    subscriptionId?: string;
    orderId?: string;
    amount?: number;
    currency?: string;
    keyId: string;
    userName: string;
    userEmail: string;
    userPhone: string;
};

type RazorpaySuccessResponse = {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
};

type RazorpayFailureResponse = {
    error?: {
        description?: string;
    };
};

type RazorpayCheckoutOptions = {
    key: string;
    name: string;
    description: string;
    prefill: {
        name: string;
        email: string;
        contact: string;
    };
    theme: { color: string };
    modal: { ondismiss: () => Promise<void> | void };
    handler: (response: RazorpaySuccessResponse) => Promise<void>;
    subscription_id?: string;
    order_id?: string;
    amount?: number;
    currency?: string;
};

type RazorpayCheckoutInstance = {
    open: () => void;
    on: (eventName: "payment.failed", handler: (response: RazorpayFailureResponse) => Promise<void> | void) => void;
};

declare global {
    interface Window {
        Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance;
    }
}

export function CheckoutModal({ plan, isOpen, onClose }: CheckoutModalProps) {
    const router = useRouter();
    const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    if (!plan) return null;

    const isFree = plan.id.endsWith("-free") || plan.price === "Rs 0";

    const handleActivate = async () => {
        setErrorMsg("");
        setStatus("processing");

        try {
            if (isFree) {
                setStatus("success");
                return;
            }

            let razorpayData;
            if (plan.isRecurring) {
                const res = await createRecurringSubscription({
                    planId: plan.id,
                });
                if (!res.success) throw new Error(res.message);
                razorpayData = res.data;
            } else {
                const res = await createRazorpayOrder(plan.id);
                if (!res.success) throw new Error(res.message);
                razorpayData = res.data;
            }

            const { subscriptionId, orderId, amount, currency, keyId, userName, userEmail, userPhone } = razorpayData as CheckoutData;

            await new Promise<void>((resolve, reject) => {
                const options: RazorpayCheckoutOptions = {
                    key: keyId,
                    name: "CA Exam Portal",
                    description: `${plan.name} Subscription`,
                    prefill: {
                        name: userName,
                        email: userEmail,
                        contact: userPhone,
                    },
                    theme: { color: "#000000" },
                    modal: {
                        ondismiss: async () => {
                            await recordCheckoutResolution({
                                orderId,
                                subscriptionId,
                                status: "CANCELLED",
                            });
                            reject(new Error("DISMISSED"));
                        },
                    },
                    handler: async (response: RazorpaySuccessResponse) => {
                        if (!plan.isRecurring) {
                            const verifyRes = await verifyAndActivatePlan({
                                razorpayOrderId: response.razorpay_order_id,
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpaySignature: response.razorpay_signature,
                                planId: plan.id,
                            });
                            if (verifyRes.success) {
                                resolve();
                            } else {
                                await recordCheckoutResolution({
                                    orderId: response.razorpay_order_id,
                                    status: "FAILED",
                                });
                                reject(new Error(verifyRes.message));
                            }
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

                if (!window.Razorpay) {
                    reject(new Error("Payment gateway is still loading. Please retry in a moment."));
                    return;
                }

                const rzp = new window.Razorpay(options);
                rzp.on("payment.failed", async (response: RazorpayFailureResponse) => {
                    await recordCheckoutResolution({
                        orderId,
                        subscriptionId,
                        status: "FAILED",
                    });
                    reject(new Error(response?.error?.description || "Payment failed. Please try again."));
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
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

            <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 animate-in fade-in duration-200 bg-black/60" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg bg-white shadow-2xl animate-in zoom-in-95 fade-in duration-300">
                        <div className="bg-slate-900 px-8 py-8 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/10">
                                        <ShieldCheck size={28} weight="bold" className="text-emerald-400" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <Dialog.Title className="  text-xl font-bold tracking-tight">
                                            Secure Checkout
                                        </Dialog.Title>
                                        <p className="text-[10px] font-bold uppercase leading-none tracking-widest text-white/40">
                                            Verified Payment Node
                                        </p>
                                    </div>
                                </div>
                                <Dialog.Close asChild>
                                    <button className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white">
                                        <X size={20} weight="bold" />
                                    </button>
                                </Dialog.Close>
                            </div>
                        </div>

                        <div className="space-y-8 p-8">
                            {status === "success" ? (
                                <ActivationSuccess planName={plan.name} />
                            ) : (
                                <>
                                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-6">
                                        <div className="mb-4 flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                Selected Plan
                                            </span>
                                            <span className="rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                                                {plan.isRecurring ? "Recurring" : "Full Term"}
                                            </span>
                                        </div>

                                        <div className="flex items-end justify-between">
                                            <div className="space-y-1">
                                                <h4 className="  text-lg font-bold leading-none text-slate-900">
                                                    {plan.name}
                                                </h4>
                                                <p className="text-[10px] font-bold uppercase leading-none tracking-widest text-slate-400">
                                                    Governance Access
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-baseline justify-end gap-1">
                                                    <span className="  text-2xl font-bold text-slate-900">
                                                        {plan.price}
                                                    </span>
                                                    {plan.price !== "Rs 0" && (
                                                        <span className="text-[10px] font-bold uppercase text-slate-400">
                                                            {plan.isRecurring ? "/mo" : "/yr"}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-4 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-100 bg-white text-emerald-500 shadow-sm">
                                                <CreditCard size={18} weight="bold" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-bold text-slate-700">Verified Gateway</p>
                                                <p className="text-[10px] font-medium text-slate-400">UPI, Cards, Netbanking</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-100 bg-white text-emerald-500 shadow-sm">
                                                <Sparkle size={18} weight="bold" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-bold text-slate-700">Instant Activation</p>
                                                <p className="text-[10px] font-medium text-slate-400">Immediate access granted</p>
                                            </div>
                                        </div>
                                    </div>

                                    {errorMsg && (
                                        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
                                            {errorMsg}
                                        </div>
                                    )}

                                    <div className="pt-2">
                                        <button
                                            onClick={handleActivate}
                                            disabled={status === "processing"}
                                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-4 text-sm font-bold text-white transition-all hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
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
                                        <p className="mt-4 text-center text-[10px] font-medium text-slate-400">
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
