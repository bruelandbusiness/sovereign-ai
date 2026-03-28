"use client";

import Script from "next/script";
import { useState, useEffect } from "react";

const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const CONSENT_KEY = "sovereign-cookie-consent";

/**
 * Loads Facebook Pixel and Google Analytics scripts ONLY after the user
 * has accepted cookie consent. Scripts are never loaded if consent has
 * not been given or was declined, ensuring GDPR/ePrivacy compliance.
 *
 * Add <TrackingScripts /> to your root layout.
 */
export function TrackingScripts() {
  const [consentGiven, setConsentGiven] = useState(false);

  // Reading localStorage (a browser API) to sync consent state is a legitimate
  // external-store synchronization pattern that requires useEffect + setState.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // Check initial consent state
    const consent = localStorage.getItem(CONSENT_KEY);
    setConsentGiven(consent === "accepted");

    // Listen for consent changes from the CookieConsent component
    function handleStorage(e: StorageEvent) {
      if (e.key === CONSENT_KEY) {
        setConsentGiven(e.newValue === "accepted");
      }
    }

    // Also listen for a custom event for same-tab updates
    function handleConsentChange() {
      const current = localStorage.getItem(CONSENT_KEY);
      setConsentGiven(current === "accepted");
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("cookie-consent-change", handleConsentChange);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("cookie-consent-change", handleConsentChange);
    };
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Block all tracking scripts until explicit consent is given
  if (!consentGiven) return null;

  return (
    <>
      {/* Google Analytics / Google Ads */}
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { send_page_view: true });
            `}
          </Script>
        </>
      )}

      {/* Facebook Pixel */}
      {FB_PIXEL_ID && (
        <Script id="fb-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${FB_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}
