"use client";

import { useEffect, useCallback, useRef } from "react";

interface Msg91WidgetProps {
    onSuccess: (accessToken: string) => void;
    onFailure: (error: any) => void;
    phoneNumber?: string;
    autoTrigger?: boolean;
}

declare global {
    interface Window {
        initSendOTP?: (config: any) => void;
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
                exposeMethods: false, // Changed to false to see if it auto-renders
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

    return null;
}
