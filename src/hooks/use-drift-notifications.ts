import { useCallback, useRef } from "react";

const ALERT_SOUND_FREQUENCY = 440;
const ALERT_DURATION = 0.15;

function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = ALERT_SOUND_FREQUENCY;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + ALERT_DURATION);
    osc.start();
    osc.stop(ctx.currentTime + ALERT_DURATION);
    // Second beep
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 520;
      osc2.type = "sine";
      gain2.gain.setValueAtTime(0.3, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + ALERT_DURATION);
      osc2.start();
      osc2.stop(ctx.currentTime + ALERT_DURATION);
    }, 180);
  } catch {
    // Audio not available
  }
}

function sendDesktopNotification(title: string, body: string) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "⚡" });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((perm) => {
      if (perm === "granted") {
        new Notification(title, { body, icon: "⚡" });
      }
    });
  }
}

export function useDriftNotifications() {
  const lastAlertTime = useRef(0);
  const COOLDOWN_MS = 5000;

  const alertCriticalDrift = useCallback((message: string) => {
    const now = Date.now();
    if (now - lastAlertTime.current < COOLDOWN_MS) return;
    lastAlertTime.current = now;

    playAlertSound();
    sendDesktopNotification("🚨 Critical Drift Detected", message);
  }, []);

  return { alertCriticalDrift };
}
