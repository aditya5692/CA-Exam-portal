"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { initAnalytics } from "@/lib/firebase";
import { logEvent } from "firebase/analytics";

export default function FirebaseAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const trackPageView = async () => {
      const analytics = await initAnalytics();
      if (analytics) {
        // Firebase automatically tracks some page views, 
        // but for SPA/Next.js navigation, we manually log screen_view or page_view
        const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
        
        logEvent(analytics, "page_view", {
          page_path: pathname,
          page_location: window.location.href,
          page_title: document.title,
        });

        console.log(`[Analytics] Tracked page view: ${url}`);
      }
    };

    trackPageView();
  }, [pathname, searchParams]);

  return null; // This component doesn't render anything
}
