"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

// Cloudflare Turnstile widget (free CAPTCHA). Renders nothing until
// NEXT_PUBLIC_TURNSTILE_SITE_KEY is set, so forms work unchanged without it.
//
//   const captcha = useRef(null);
//   <Turnstile ref={captcha} onToken={setToken} />
//   captcha.current?.reset();   // after a submit: tokens are single-use
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadScript() {
  if (typeof window === "undefined") return Promise.reject();
  if (window.turnstile) return Promise.resolve();
  if (!window.__turnstileLoading) {
    window.__turnstileLoading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  return window.__turnstileLoading;
}

const Turnstile = forwardRef(function Turnstile({ onToken }, ref) {
  const box = useRef(null);
  const widgetId = useRef(null);
  const callback = useRef(onToken);
  callback.current = onToken;

  useImperativeHandle(ref, () => ({
    reset() {
      callback.current?.("");
      try { if (widgetId.current != null) window.turnstile.reset(widgetId.current); } catch {}
    },
  }));

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    let cancelled = false;
    loadScript().then(() => {
      if (cancelled || !box.current || widgetId.current != null) return;
      widgetId.current = window.turnstile.render(box.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (t) => callback.current?.(t),
        "expired-callback": () => callback.current?.(""),
        "error-callback": () => callback.current?.(""),
      });
    }).catch(() => {});
    return () => {
      cancelled = true;
      try { if (widgetId.current != null) window.turnstile.remove(widgetId.current); } catch {}
      widgetId.current = null;
    };
  }, []);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={box} className="turnstile-box" style={{ minHeight: 65, margin: "8px 0" }} />;
});

export default Turnstile;
