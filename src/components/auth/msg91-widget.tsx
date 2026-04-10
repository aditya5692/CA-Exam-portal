"use client";

import { getDemoOtpEntryByPhone } from "@/lib/auth/demo-otp";
import { useEffect, useCallback, useRef, useState } from "react";

interface Msg91WidgetProps {
    onSuccess: (accessToken: string) => void;
    onFailure: (error: string) => void;
    phoneNumber?: string;
}

type Msg91CallbackPayload =
    | string
    | {
        message?: unknown;
        token?: unknown;
        accessToken?: unknown;
        access_token?: unknown;
        jwt?: unknown;
      };

type Msg91ErrorPayload =
    | string
    | {
        message?: string;
      };

type Msg91SuccessCallback = (data: Msg91CallbackPayload) => void;
type Msg91FailureCallback = (error: Msg91ErrorPayload) => void;

declare global {
    interface Window {
        initSendOTP?: (config: {
            widgetId: string;
            tokenAuth: string;
            identifier: string;
            exposeMethods: boolean;
            captchaRenderId: string;
            container?: string;
            mode?: "inline";
            success?: Msg91SuccessCallback;
            failure?: Msg91FailureCallback;
        }) => void;
        sendOtp?: (identifier: string, success?: Msg91SuccessCallback, failure?: Msg91FailureCallback) => void;
        verifyOtp?: (otp: string, success: Msg91SuccessCallback, failure: Msg91FailureCallback) => void;
        retryOtp?: (channel: string | null, success: Msg91SuccessCallback, failure: Msg91FailureCallback) => void;
    }
}

function extractAccessToken(data: unknown) {
    if (typeof data === "string") {
        return data.includes(".") ? data : "";
    }

    if (!data || typeof data !== "object") {
        return "";
    }

    const payload = data as Record<string, unknown>;
    
    // Debug: Log keys to help identify structure in case of failure
    console.log("MSG91 Success Callback Keys:", Object.keys(payload));

    // Define a list of fields where MSG91 might store the JWT
    // Re-ordered to check 'token' and 'accessToken' first
    const potentialFields = [
        'token',
        'accessToken',
        'access_token',
        'jwt',
        'message',
        'auth_token'
    ];

    // Look for a field that contains a string with a dot (typical of JWTs)
    // and is of substantial length (typical IDs are < 30 chars)
    for (const field of potentialFields) {
        const val = payload[field];
        if (typeof val === "string" && val.includes(".") && val.length > 40) {
            console.log(`MSG91 Extraction: Found valid JWT in field '${field}'`);
            return val;
        }
    }

    // Fallback: If no JWT-like string found, check if any field contains a string 
    // that doesn't have a dot but is clearly the only candidate. 
    // We log this as a warning because it's likely an ID being mistaken for a token.
    for (const field of ['token', 'accessToken', 'access_token']) {
        const val = payload[field];
        if (typeof val === "string" && val.length > 10) {
             console.warn(`MSG91 Extraction Warning: Field '${field}' has no dots. Might be a RequestID instead of a JWT.`);
             return val;
        }
    }

    return "";
}

function extractErrorMessage(error: Msg91ErrorPayload, fallback: string) {
    if (typeof error === "string") {
        return error;
    }

    return error.message || fallback;
}

export default function Msg91Widget({ onSuccess, onFailure, phoneNumber }: Msg91WidgetProps) {
    const isInitialized = useRef(false);
    const wasSuccessCalled = useRef(false);
    const otpRequestedForPhone = useRef<string | null>(null);
    const [otpValue, setOtpValue] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [internalError, setInternalError] = useState<string | null>(null);
    const [runtimeConfig, setRuntimeConfig] = useState({
        msg91WidgetId: "",
        msg91TokenAuth: "",
    });
    const [isConfigLoading, setIsConfigLoading] = useState(true);
    const demoEntry = phoneNumber
        ? getDemoOtpEntryByPhone(phoneNumber)
        : undefined;
    const hasDemoBypass = Boolean(demoEntry);

    useEffect(() => {
        wasSuccessCalled.current = false;
        isInitialized.current = false;
        otpRequestedForPhone.current = null;
        setOtpValue("");
        setIsSendingOtp(false);
        setInternalError(null);
    }, [phoneNumber]);

    useEffect(() => {
        let isMounted = true;

        async function loadRuntimeConfig() {
            try {
                setIsConfigLoading(true);
                const response = await fetch("/api/platform-config/public", {
                    cache: "no-store",
                });
                const payload = await response.json();

                if (!isMounted) {
                    return;
                }

                setRuntimeConfig({
                    msg91WidgetId: payload.msg91WidgetId ?? "",
                    msg91TokenAuth: payload.msg91TokenAuth ?? "",
                });
            } catch (error) {
                console.error("Failed to load MSG91 runtime config", error);
                if (isMounted && !hasDemoBypass) {
                    setInternalError("Unable to load MSG91 runtime configuration.");
                    onFailure("Unable to load MSG91 runtime configuration.");
                }
            } finally {
                if (isMounted) {
                    setIsConfigLoading(false);
                }
            }
        }

        void loadRuntimeConfig();

        return () => {
            isMounted = false;
        };
    }, [hasDemoBypass, onFailure]);

    const requestOtp = useCallback((identifier: string) => {
        if (typeof window === "undefined" || !window.sendOtp) {
            return;
        }

        if (otpRequestedForPhone.current === identifier) {
            return;
        }

        setInternalError(null);
        setIsSendingOtp(true);
        otpRequestedForPhone.current = identifier;

        window.sendOtp(
            identifier,
            () => {
                setIsSendingOtp(false);
                console.log("MSG91 SDK: OTP requested successfully");
            },
            (error: Msg91ErrorPayload) => {
                otpRequestedForPhone.current = null;
                setIsSendingOtp(false);
                const message =
                    typeof error === "string"
                        ? error
                        : error?.message || "Unable to send OTP to this number.";
                setInternalError(message);
                onFailure(message);
            },
        );
    }, [onFailure]);

    const initializeSDK = useCallback(() => {
        if (typeof window === "undefined" || !window.initSendOTP || isInitialized.current) return;

        if (!runtimeConfig.msg91WidgetId || !runtimeConfig.msg91TokenAuth) {
            if (hasDemoBypass) {
                console.log("MSG91 SDK: Config missing but skipping for demo bypass.");
                return;
            }
            onFailure("MSG91 configuration missing. Please update in Admin Control Center.");
            return;
        }

        const configuration = {
            widgetId: runtimeConfig.msg91WidgetId,
            tokenAuth: runtimeConfig.msg91TokenAuth,
            identifier: phoneNumber || "",
            exposeMethods: true,
            captchaRenderId: "msg91-captcha-container",
            container: "msg91-otp-container",
            mode: "inline" as const,
        };

        try {
            window.initSendOTP(configuration);
            isInitialized.current = true;
            console.log("MSG91 SDK: Initialized successfully");
            if (phoneNumber) {
                requestOtp(phoneNumber);
            }
        } catch (e) {
            console.error("MSG91 SDK: Exception during initSendOTP", e);
            onFailure("Failed to initialize verification engine.");
        }
    }, [hasDemoBypass, runtimeConfig.msg91WidgetId, runtimeConfig.msg91TokenAuth, phoneNumber, onSuccess, onFailure, requestOtp]);

    useEffect(() => {
        if (!isInitialized.current || !phoneNumber) {
            return;
        }

        requestOtp(phoneNumber);
    }, [phoneNumber, requestOtp]);

    useEffect(() => {
        if (isConfigLoading) {
            return;
        }

        if (hasDemoBypass) {
            return;
        }

        const scriptId = "msg91-widget-script";
        if (document.getElementById(scriptId)) {
            if (window.initSendOTP) initializeSDK();
            return;
        }

        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://verify.msg91.com/otp-provider.js";
        script.async = true;
        script.onload = () => {
            if (window.initSendOTP) initializeSDK();
        };
        script.onerror = () => onFailure("Failed to load verification scripts.");
        document.head.appendChild(script);

        return () => {
            isInitialized.current = false;
        };
    }, [hasDemoBypass, initializeSDK, isConfigLoading, onFailure]);

    const handleManualVerify = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (otpValue.length < 4 || isVerifying) return;

        setInternalError(null);
        setIsVerifying(true);

        if (demoEntry && otpValue === demoEntry.otp) {
            if (!wasSuccessCalled.current) {
                wasSuccessCalled.current = true;
                onSuccess(demoEntry.widgetToken);
            }
            setIsVerifying(false);
            return;
        }

        if (window.verifyOtp) {
            window.verifyOtp(otpValue, 
                (data: Msg91CallbackPayload) => {
                    const token = extractAccessToken(data);
                    if (token && !wasSuccessCalled.current) {
                        wasSuccessCalled.current = true;
                        onSuccess(token);
                    } else if (!token) {
                        setInternalError("MSG91 did not return a usable access token.");
                    }
                    setIsVerifying(false);
                },
                (err: Msg91ErrorPayload) => {
                    setInternalError(extractErrorMessage(err, "Invalid OTP. Please try again."));
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
            {/* SDK Anchors */}
            <div id="msg91-otp-container" style={{ display: 'none' }}></div>
            <div id="msg91-captcha-container" style={{ display: 'none' }}></div>
            
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

                {isConfigLoading && (
                    <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-500 text-center">
                        Loading verification channel...
                    </div>
                )}

                {isSendingOtp && (
                    <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-600 text-center">
                        Sending OTP...
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => handleManualVerify()}
                    disabled={(!hasDemoBypass && isConfigLoading) || isVerifying || otpValue.length < 4}
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
                    onClick={() => window.retryOtp?.(null, () => console.log("OTP Resent"), (e) => setInternalError(extractErrorMessage(e, "Resend failed")))}
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
