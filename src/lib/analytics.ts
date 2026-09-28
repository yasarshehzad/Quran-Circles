// Google Analytics 4 (gtag.js) Integration

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

let isInitialized = false;

/**
 * Initializes Google Analytics 4 if a Measurement ID is provided.
 * Dynamically injects gtag.js script and sets up window.dataLayer.
 */
export function initAnalytics(customId?: string): void {
  const measurementId = customId || GA_MEASUREMENT_ID;

  if (isInitialized) return;
  if (!measurementId || typeof window === 'undefined') {
    if (import.meta.env.DEV) {
      console.info('[Analytics] VITE_GA_MEASUREMENT_ID not set. Tracking disabled.');
    }
    return;
  }

  try {
    // Setup dataLayer and gtag function
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: false, // Managed manually on route/view changes
      anonymize_ip: true,
    });

    // Inject gtag.js script tag
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    isInitialized = true;
    if (import.meta.env.DEV) {
      console.info(`[Analytics] Initialized GA4 with ID: ${measurementId}`);
    }
  } catch (err) {
    console.error('[Analytics] Failed to initialize Google Analytics:', err);
  }
}

/**
 * Tracks a page view in Google Analytics.
 */
export function trackPageView(pagePath: string, pageTitle?: string): void {
  const measurementId = GA_MEASUREMENT_ID;
  if (!isInitialized || !window.gtag || !measurementId) return;

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
  if (!isInitialized || !window.gtag) return;

  try {
    window.gtag('event', eventName, eventParams);
  } catch (err) {
    console.error('[Analytics] Event tracking error:', err);
  }
}
