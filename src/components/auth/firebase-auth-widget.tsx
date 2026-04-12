"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult 
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ArrowRight, CircleNotch } from "@phosphor-icons/react";

interface FirebaseAuthWidgetProps {
  onSuccess: (idToken: string) => void;
  onFailure: (error: string) => void;
  phoneNumber?: string;
}

export default function FirebaseAuthWidget({ onSuccess, onFailure, phoneNumber }: FirebaseAuthWidgetProps) {
  const [verificationId, setVerificationId] = useState<ConfirmationResult | null>(null);
  const [otpValue, setOtpValue] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  const initRecaptcha = useCallback(() => {
    if (!auth || !recaptchaContainerRef.current || recaptchaVerifierRef.current) return;

    try {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
        size: "invisible",
        callback: () => {
          console.log("Recaptcha verified");
        },
        "expired-callback": () => {
          setError("Recaptcha expired. Please try again.");
          onFailure("Recaptcha expired.");
        }
      });
    } catch (err) {
      console.error("Recaptcha init error:", err);
      setError("Failed to initialize security check.");
      onFailure("Recaptcha init failed.");
    }
  }, [onFailure]);

  const handleSendOtp = useCallback(async () => {
    if (!auth || !phoneNumber) return;
    
    setIsSendingOtp(true);
    setError(null);
    initRecaptcha();

    try {
      // Firebase requires E.164 format (e.g., +91XXXXXXXXXX)
      const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;
      
      const appVerifier = recaptchaVerifierRef.current;
      if (!appVerifier) throw new Error("Recaptcha not initialized");

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setVerificationId(confirmation);
      setIsSendingOtp(false);
    } catch (err: any) {
      console.error("SMS Send Error:", err);
      setIsSendingOtp(false);
      const msg = err.code === "auth/invalid-phone-number" 
        ? "Invalid phone number format." 
        : "Failed to send SMS. Please try again later.";
      setError(msg);
      onFailure(msg);
      
      // Reset recaptcha on error
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    }
  }, [phoneNumber, initRecaptcha, onFailure]);

  // Auto-send OTP when phone number is provided and we don't have a verificationId
  useEffect(() => {
    if (phoneNumber && !verificationId && !isSendingOtp) {
      handleSendOtp();
    }
  }, [phoneNumber, verificationId, isSendingOtp, handleSendOtp]);

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!verificationId || otpValue.length < 6 || isVerifying) return;

    setIsVerifying(true);
    setError(null);

    try {
      const result = await verificationId.confirm(otpValue);
      const idToken = await result.user.getIdToken();
      onSuccess(idToken);
    } catch (err: any) {
      console.error("OTP Verification Error:", err);
      const msg = err.code === "auth/invalid-verification-code" 
        ? "The code you entered is incorrect." 
        : "Verification failed. Please try again.";
      setError(msg);
      setIsVerifying(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm space-y-6 relative overflow-hidden">
      {/* Recaptcha Anchor */}
      <div ref={recaptchaContainerRef}></div>
      
      <div className="text-center space-y-1">
        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Firebase Security</h4>
        <p className="text-[10px] font-bold text-slate-400 italic">
          {verificationId ? "Enter the 6-digit code sent to your device" : "Initializing secure verification..."}
        </p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        {verificationId ? (
          <>
            <input
              type="text"
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
              placeholder="••••••"
              maxLength={6}
              className="w-full bg-white border-2 border-slate-200 rounded-2xl py-5 text-center text-3xl font-black tracking-[0.5em] text-slate-900 focus:border-blue-600 focus:outline-none transition-all placeholder:text-slate-100 shadow-sm disabled:opacity-50"
              disabled={isVerifying}
              autoFocus
            />

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-[10px] font-bold text-rose-500 text-center animate-in fade-in zoom-in duration-300">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={() => handleVerifyOtp()}
              disabled={isVerifying || otpValue.length < 6}
              className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-xl shadow-blue-100 transition-all hover:bg-slate-900 hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 active:scale-95 flex items-center justify-center gap-3"
            >
              {isVerifying ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Verify & Continue"
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setVerificationId(null);
                setOtpValue("");
                handleSendOtp();
              }}
              className="w-full text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
            >
              Resend Code
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center py-6 space-y-4">
            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-[10px] font-bold text-rose-500 text-center">
                {error}
              </div>
            )}
            {!isSendingOtp && error && (
              <button 
                onClick={handleSendOtp}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Retry Sending Code
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center w-full max-w-xs pt-2">
        <div className="flex items-center gap-1.5 opacity-30 grayscale">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-[8px] font-black uppercase tracking-tighter text-slate-900">End-to-End Encrypted</span>
        </div>
      </div>
    </div>
  );
}
