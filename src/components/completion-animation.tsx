"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";

interface CompletionAnimationProps {
  onComplete: () => void;
}

export const CompletionAnimation = ({
  onComplete,
}: CompletionAnimationProps) => {
  const [progress, setProgress] = useState(0);
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    const duration = 400;
    const steps = 60;
    const increment = 100 / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      setProgress(currentStep * increment);

      if (currentStep >= steps) {
        clearInterval(interval);
        setShowCheck(true);
        // Wait 200ms to show checkmark, then call onComplete
        setTimeout(() => {
          onComplete();
        }, 200);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [onComplete]);

  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "200px",
          height: "200px",
        }}
      >
        {/* SVG Circle Animation */}
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            transform: "rotate(-90deg)",
          }}
          viewBox="0 0 140 140"
        >
          {/* Background circle */}
          <circle
            cx="70"
            cy="70"
            r="60"
            stroke="rgba(34, 197, 94, 0.2)"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="70"
            cy="70"
            r="60"
            stroke="#22c55e"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: "stroke-dashoffset 0.1s linear",
            }}
            strokeLinecap="round"
          />
        </svg>

        {/* Checkmark Icon */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: showCheck ? 1 : 0,
            transform: showCheck ? "scale(1)" : "scale(0.5)",
            transition: "all 0.3s ease-out",
          }}
        >
          <Check
            className="text-green-500"
            style={{
              width: "80px",
              height: "80px",
              color: "#22c55e",
              strokeWidth: 3,
            }}
          />
        </div>
      </div>
    </div>
  );
};
