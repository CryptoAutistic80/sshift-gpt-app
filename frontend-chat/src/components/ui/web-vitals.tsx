'use client'

import { useReportWebVitals } from 'next/web-vitals'

declare global {
  interface Window {
    gtag: (
      command: string,
      action: string,
      params: { [key: string]: any }
    ) => void;
  }
}

export function WebVitals() {
  useReportWebVitals((metric) => {
    if (window.gtag) {
      window.gtag('event', metric.name, {
        value: Math.round(
          metric.name === 'CLS' ? metric.value * 1000 : metric.value
        ),
        event_label: metric.id,
        non_interaction: true,
      });
    }
  });
  return null;
}