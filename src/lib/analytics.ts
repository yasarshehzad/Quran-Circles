// Google Analytics 4 (gtag.js) Integration

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-CC8KEV0BTP';

let isInitialized = false;

/**
 * Initializes Google Analytics 4 if a Measurement ID is provided.
 * Dynamically injects gtag.js script and sets up window.dataLayer if not already present.
 */
export function initAnalytics(customId?: string): void {
  const measurementId = customId || GA_MEASUREMENT_ID;

  if (isInitialized) return;
  if (!measurementId || typeof window === 'undefined') {
    return;
  }

  try {
    // Setup dataLayer and gtag function if not already present
    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', measurementId);

      // Inject gtag.js script tag if not already loaded
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script);
    }

    isInitialized = true;
  } catch (err) {
    console.error('[Analytics] Failed to initialize Google Analytics:', err);
  }
}

/**
 * Tracks a page view in Google Analytics.
 */
export function trackPageView(pagePath: string, pageTitle?: string): void {
  const measurementId = GA_MEASUREMENT_ID;
  if (typeof window === 'undefined' || !window.gtag || !measurementId) return;

  try {
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle || document.title,
      page_location: window.location.href,
    });
  } catch (err) {
    console.error('[Analytics] Page view tracking error:', err);
  }
}

/**
 * Tracks a custom event in Google Analytics.
 */
export function trackEvent(eventName: string, eventParams: Record<string, any> = {}): void {
  if (typeof window === 'undefined' || !window.gtag) return;

  try {
    window.gtag('event', eventName, eventParams);
  } catch (err) {
    console.error('[Analytics] Event tracking error:', err);
  }
}
