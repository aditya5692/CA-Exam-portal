import { initAnalytics } from "./firebase";
import { logEvent as firebaseLogEvent, setUserId as firebaseSetUserId, setUserProperties as firebaseSetUserProperties } from "firebase/analytics";

/**
 * Logs a custom event to Firebase Analytics
 */
export const logEvent = async (eventName: string, params?: Record<string, unknown>) => {
  try {
    const analytics = await initAnalytics();
    if (analytics) {
      firebaseLogEvent(analytics, eventName, params);
      if (process.env.NODE_ENV === "development") {
        console.log(`[Analytics] Event: ${eventName}`, params);
      }
    }
  } catch (error) {
    console.error("[Analytics] Error logging event:", error);
  }
};

/**
 * Sets the user ID for analytics
 */
export const setUserId = async (userId: string | null) => {
  try {
    const analytics = await initAnalytics();
    if (analytics) {
      firebaseSetUserId(analytics, userId);
    }
  } catch (error) {
    console.error("[Analytics] Error setting user ID:", error);
  }
};

/**
 * Sets user properties for analytics
 */
export const setUserProperties = async (properties: Record<string, unknown>) => {
  try {
    const analytics = await initAnalytics();
    if (analytics) {
      firebaseSetUserProperties(analytics, properties);
    }
  } catch (error) {
    console.error("[Analytics] Error setting user properties:", error);
  }
};

// Common event helpers
export const trackTestStart = (testId: string, testName: string) => 
  logEvent("test_start", { test_id: testId, test_name: testName });

export const trackTestComplete = (testId: string, score: number) => 
  logEvent("test_complete", { test_id: testId, score });

export const trackPurchase = (item: string, price: number, currency: string = "INR") => 
  logEvent("purchase", { item_name: item, value: price, currency });

export const trackLogin = (method: string) => 
  logEvent("login", { method });

export const trackSignUp = (method: string) => 
  logEvent("sign_up", { method });
