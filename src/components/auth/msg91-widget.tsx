"use client";

import { useEffect, useCallback, useRef, useState } from "react";

interface Msg91WidgetProps {
    onSuccess: (accessToken: string) => void;
    onFailure: (error: string) => void;
    phoneNumber?: string;
}

declare global {
    interface Window {
        initSendOTP?: (config: any) => void;
        verifyOtp?: (otp: string, success: (data: any) => void, failure: (error: any) => void) => void;
        retryOtp?: (channel: string, success: (data: any) => void, failure: (error: any) => void) => void;
    }
}

export default function Msg91Widget({ onSuccess, onFailure, phoneNumber }: Msg91WidgetProps) {
    const isInitialized = useRef(false);
    const wasSuccessCalled = useRef(false);
    const WIDGET_ID = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID;
    const TOKEN_AUTH = process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH;

    const [otpValue, setOtpValue] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [internalError, setInternalError] = useState<string | null>(null);

    const initializeSDK = useCallback(() => {
        if (typeof window === "undefined" || !window.initSendOTP || isInitialized.current) return;

        if (!WIDGET_ID || !TOKEN_AUTH) {
            onFailure("MSG91 configuration is missing (WIDGET_ID/TOKEN).");
            return;
        }

        const configuration = {
            widgetId: WIDGET_ID,
            tokenAuth: TOKEN_AUTH,
            identifier: phoneNumber || "",
            exposeMethods: true,
            container: "msg91-otp-container",
            mode: "inline",
            success: (data: any) => {
                const token = typeof data === 'string' ? data : data?.message;
                console.log("MSG91 SDK: Verification Success", { hasToken: !!token });
                
                if (!wasSuccessCalled.current && token) {
                    wasSuccessCalled.current = true;
                    onSuccess(token);
                }
            },
            failure: (error: any) => {
                console.error("MSG91 SDK: Initialization/Verification Failure", error);
                const msg = typeof error === 'string' ? error : (error?.message || "Verification failed");
                onFailure(msg);
            },
        };

        try {
            window.initSendOTP(configuration);
            isInitialized.current = true;
            console.log("MSG91 SDK: Initialized successfully");
        } catch (e) {
            console.error("MSG91 SDK: Exception during initSendOTP", e);
            onFailure("Failed to initialize verification engine.");
        }
    }, [WIDGET_ID, TOKEN_AUTH, phoneNumber, onSuccess, onFailure]);

    useEffect(() => {
        const scriptId = "msg91-widget-script";
        if (document.getElementById(scriptId)) {
            if (window.initSendOTP) initializeSDK();
            return;
        }

        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://control.msg91.com/app/assets/otp-provider/otp-provider.js";
        script.async = true;
        script.onload = () => {
            if (window.initSendOTP) initializeSDK();
        };
        script.onerror = () => onFailure("Failed to load verification scripts.");
        document.head.appendChild(script);

        return () => {
            isInitialized.current = false;
        };
    }, [initializeSDK, onFailure]);

    const handleManualVerify = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (otpValue.length < 4 || isVerifying) return;

        setInternalError(null);
        setIsVerifying(true);

        if (window.verifyOtp) {
            window.verifyOtp(otpValue, 
                (data: any) => {
                    const token = typeof data === 'string' ? data : data?.message;
                    if (token && !wasSuccessCalled.current) {
                        wasSuccessCalled.current = true;
                        onSuccess(token);
                    }
                    setIsVerifying(false);
                },
                (err: any) => {
                    setInternalError(err?.message || "Invalid OTP. Please try again.");
                    setIsVerifying(false);
                }
            );
        } else {
            setInternalError("Verification engine not ready.");
            setIsVerifying(false);
        }
    };

    return (
        <div className="w-full flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm space-y-6 relative overflow-hidden">
            {/* SDK Anchor */}
            <div id="msg91-otp-container" style={{ display: 'none' }}></div>
            
            <div className="text-center space-y-1">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Security Check</h4>
                <p className="text-[10px] font-bold text-slate-400 italic">Enter the 4-digit code sent to your device</p>
            </div>

            <div className="w-full max-w-xs space-y-4">
                <input
                    type="text"
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && handleManualVerify()}
                    placeholder="••••"
                    maxLength={4}
                    className="w-full bg-white border-2 border-slate-200 rounded-2xl py-5 text-center text-3xl font-black tracking-[1.5em] text-slate-900 focus:border-indigo-600 focus:outline-none transition-all placeholder:text-slate-100 shadow-sm disabled:opacity-50"
                    disabled={isVerifying}
                />

                {internalError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-[10px] font-bold text-rose-500 text-center animate-in fade-in zoom-in duration-300">
                        {internalError}
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => handleManualVerify()}
                    disabled={isVerifying || otpValue.length < 4}
                    className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-100 transition-all hover:bg-slate-900 hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 active:scale-95 flex items-center justify-center gap-3"
                >
                    {isVerifying ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        "Verify & Continue"
                    )}
                </button>
            </div>

            <div className="flex items-center justify-between w-full max-w-xs px-2 pt-2">
                <button
                    type="button"
                    onClick={() => window.retryOtp?.("sms", () => console.log("OTP Resent"), (e) => setInternalError(e?.message || "Resend failed"))}
                    className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
                >
                    Resend SMS
                </button>
                <div className="flex items-center gap-1.5 opacity-30 grayscale">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-[8px] font-black uppercase tracking-tighter text-slate-900">End-to-End Encrypted</span>
                </div>
            </div>
        </div>
    );
}
