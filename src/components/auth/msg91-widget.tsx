"use client";

import { useEffect, useCallback, useRef, useState } from "react";

interface Msg91WidgetProps {
    onSuccess: (accessToken: string) => void;
    onFailure: (error: any) => void;
    phoneNumber?: string;
    autoTrigger?: boolean;
}

declare global {
    interface Window {
        initSendOTP?: (config: any) => void;
        verifyOtp?: (otp: string, success: (data: any) => void, failure: (error: any) => void) => void;
        retryOtp?: (channel: string, success: (data: any) => void, failure: (error: any) => void) => void;
    }
}

export default function Msg91Widget({ onSuccess, onFailure, phoneNumber, autoTrigger = false }: Msg91WidgetProps) {
    const isInitialized = useRef(false);
    const containerId = "msg91-otp-widget-container";
    const WIDGET_ID = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID;
    const TOKEN_AUTH = process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH;

    const initializeWidget = useCallback(() => {
        if (typeof window !== "undefined" && window.initSendOTP && !isInitialized.current) {
            console.log("Initializing MSG91 OTP Widget for:", phoneNumber);
            
            if (!WIDGET_ID || !TOKEN_AUTH) {
                console.error("MSG91: Missing WIDGET_ID or TOKEN_AUTH in environment variables.");
                onFailure("Configuration missing.");
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
                    console.log("MSG91 Widget Success:", data);
                    onSuccess(data);
                    isInitialized.current = false;
                },
                failure: (error: any) => {
                    // Log all details of the error object
                    console.error("MSG91 Widget Failure Detail:", error);
                    try {
                        console.error("MSG91 Error Keys:", Object.keys(error));
                    } catch (e) {}
                    onFailure(error);
                    isInitialized.current = false;
                },
            };
            
            try {
                window.initSendOTP(configuration);
                isInitialized.current = true;
            } catch (error) {
                console.error("Failed to call initSendOTP (exception):", error);
            }
        }
    }, [WIDGET_ID, TOKEN_AUTH, phoneNumber, onSuccess, onFailure]);

    useEffect(() => {
        if (!autoTrigger && !phoneNumber) return;

        console.log("Loading MSG91 scripts...");
        const loadScript = (urls: string[]) => {
            let i = 0;
            const attempt = () => {
                const existingScript = document.querySelector(`script[src="${urls[i]}"]`);
                if (existingScript) {
                    console.log(`Script already exists: ${urls[i]}`);
                    if (window.initSendOTP) {
                        initializeWidget();
                    } else {
                        existingScript.addEventListener('load', initializeWidget);
                    }
                    return;
                }

                const s = document.createElement("script");
                s.src = urls[i];
                s.async = true;
                s.onload = () => {
                    console.log(`Script loaded: ${urls[i]}`);
                    if (typeof window.initSendOTP === "function") {
                        initializeWidget();
                    }
                };
                s.onerror = () => {
                    console.error(`Script failed to load: ${urls[i]}`);
                    i++;
                    if (i < urls.length) {
                        attempt();
                    } else {
                        onFailure("Failed to load MSG91 verification scripts.");
                    }
                };
                document.head.appendChild(s);
            };
            attempt();
        };

        loadScript([
            "https://verify.msg91.com/otp-provider.js",
            "https://verify.phone91.com/otp-provider.js",
        ]);

        return () => {
            isInitialized.current = false;
        };
    }, [initializeWidget, autoTrigger, phoneNumber, onFailure]);

    const [otpValue, setOtpValue] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleVerifySubmit = (e?: React.FormEvent | React.KeyboardEvent) => {
        if (e) e.preventDefault();
        if (otpValue.length < 4) return;
        
        setIsVerifying(true);
        setErrorMsg(null);

        if (window.verifyOtp) {
            window.verifyOtp(otpValue, 
                (data: any) => {
                    console.log("Verify Success:", data);
                    // Standard success flow
                    setIsVerifying(false);
                },
                (error: any) => {
                    console.error("Verify Failure:", error);
                    setErrorMsg(error?.message || "Invalid OTP");
                    setIsVerifying(false);
                }
            );
        } else {
            setErrorMsg("Verification engine not ready. Please wait.");
            setIsVerifying(false);
        }
    };

    const handleResend = () => {
        if (window.retryOtp) {
            window.retryOtp("sms", 
                (data: any) => console.log("OTP Resent"),
                (err: any) => setErrorMsg("Failed to resend. Please wait.")
            );
        }
    };

    return (
        <div className="w-full flex flex-col items-center justify-center p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl shadow-inner relative overflow-hidden transition-all duration-500">
            {/* Hidden container for MSG91 background logic */}
            <div id="msg91-otp-container" style={{ display: 'none' }}></div>
            
            <div className="w-full space-y-4">
                <div className="text-center">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Verify Your Number</h4>
                    <p className="text-[10px] font-medium text-slate-400 italic">Enter the 4-digit code sent via SMS</p>
                </div>

                <div className="relative">
                    <input
                        type="text"
                        value={otpValue}
                        onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleVerifySubmit();
                            }
                        }}
                        placeholder="••••"
                        maxLength={4}
                        className="w-full bg-white border-2 border-slate-200 rounded-xl py-4 text-center text-2xl font-black tracking-[1.5em] text-slate-900 focus:border-indigo-600 focus:outline-none transition-all placeholder:text-slate-100 shadow-sm"
                        required
                        autoFocus
                    />
                </div>

                {errorMsg && (
                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-100 text-[10px] font-bold text-rose-500 text-center animate-in fade-in zoom-in duration-300">
                        {errorMsg === "IPBlocked" ? "Your IP is temporarily blocked by MSG91. Please use a different network or disable re-Captcha." : errorMsg}
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => handleVerifySubmit()}
                    disabled={isVerifying || otpValue.length < 4}
                    className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-100 transition-all hover:bg-slate-900 hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 active:scale-95 flex items-center justify-center gap-2"
                >
                    {isVerifying ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        "Confirm OTP"
                    )}
                </button>

                <div className="flex items-center justify-between px-2">
                    <button
                        type="button"
                        onClick={handleResend}
                        className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors underline underline-offset-4 decoration-slate-200"
                    >
                        Resend Code
                    </button>
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                        Encrypted
                    </span>
                </div>
            </div>
        </div>
    );
}
