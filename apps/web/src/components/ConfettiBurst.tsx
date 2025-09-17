"use client";
import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function ConfettiBurst() {
  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      return; // Skip confetti if user prefers reduced motion
    }

    const end = Date.now() + 600;
    const frame = () => {
      confetti({
        particleCount: 60,
        startVelocity: 45,
        spread: 65,
        origin: { y: 0.2 }
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return null;
}