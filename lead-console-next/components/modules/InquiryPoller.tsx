'use client';

/**
 * InquiryPoller — mounts once in the root layout.
 * Calls /api/inquiries/poll every 10 minutes regardless of which page the user is on.
 * If new inquiries are detected, dispatches a custom event that InquiriesClient listens to.
 * Works even when not on the inquiries page — browser tab just needs to be open.
 */
import { useEffect, useRef } from 'react';

const POLL_INTERVAL = 10 * 60 * 1000; // 10 minutes

export function InquiryPoller() {
  const lastCountRef = useRef<number | null>(null);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  async function poll() {
    try {
      const res  = await fetch('/api/inquiries/poll', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json() as { count: number; authenticated: boolean; polledAt?: string };

      if (!data.authenticated) return;

      // First poll — just set baseline
      if (lastCountRef.current === null) {
        lastCountRef.current = data.count;
        return;
      }

      // New inquiries detected
      if (data.count > lastCountRef.current) {
        const newCount = data.count - lastCountRef.current;
        lastCountRef.current = data.count;

        // Dispatch event for the InquiriesClient to pick up
        window.dispatchEvent(new CustomEvent('inquiries:new', { detail: { count: newCount, total: data.count } }));

        // Browser notification if permitted
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('New Inquiry', {
            body: `${newCount} new inquiry${newCount > 1 ? 'ies' : ''} received`,
            tag: 'new-inquiry',
          });
        }
      } else {
        lastCountRef.current = data.count;
      }
    } catch {
      // Silent — polling failures should not surface to user
    }
  }

  useEffect(() => {
    // Request notification permission silently
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Initial poll after 5 seconds (let the page settle)
    const initialTimer = setTimeout(poll, 5000);

    // Then every 10 minutes
    timerRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      clearTimeout(initialTimer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // This component renders nothing
  return null;
}
