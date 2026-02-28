"use client";
import { useEffect, useRef } from "react";
import { useProctor } from "./ProctorContext";

export default function ProctorBrowserMonitor() {
  const { deduct } = useProctor();
  const timerRef = useRef(null);

  useEffect(() => {
    const isFullscreen = () =>
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement;

    const checkFullscreen = () => {
      if (!isFullscreen()) {
        deduct(2, "Exited fullscreen");

        if (!timerRef.current) {
          timerRef.current = setTimeout(() => {
            deduct(2, "Browser not in fullscreen for 10 seconds");
            timerRef.current = null;
          }, 10000); // Fixed 50000 (50s) to 10000 (10s) to match your comment
        }
      } else {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }
    };

    const onVisibility = () => {
      if (document.hidden) deduct(2, "Tab switched");
    };

    const onBlur = () => deduct(2, "Window lost focus");

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", checkFullscreen);

    const interval = setInterval(checkFullscreen, 2000); // Polling every 2s to save CPU

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", checkFullscreen);
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [deduct]);

  return null;
}
