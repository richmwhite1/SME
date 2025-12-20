"use client";

import { useEffect, useState } from "react";
import { TrendingUp, X } from "lucide-react";

interface SignalReceivedToastProps {
  points: number;
  reason?: string;
  onClose: () => void;
  duration?: number;
}

export default function SignalReceivedToast({
  points,
  reason,
  onClose,
  duration = 4000,
}: SignalReceivedToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isPulsing, setIsPulsing] = useState(true);

  useEffect(() => {
    // Stop pulse after initial animation
    const pulseTimer = setTimeout(() => setIsPulsing(false), 1000);
    
    // Auto-close after duration
    const closeTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => {
      clearTimeout(pulseTimer);
      clearTimeout(closeTimer);
    };
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 flex items-center gap-3 rounded-lg border border-sme-gold/50 bg-forest-obsidian px-4 py-3 shadow-lg transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
      style={{
        boxShadow: isPulsing
          ? "0 0 20px rgba(184, 134, 11, 0.4), 0 0 40px rgba(34, 197, 94, 0.2)"
          : "0 4px 6px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div
        className={`flex items-center justify-center rounded-full bg-sme-gold/20 p-2 ${
          isPulsing ? "animate-pulse" : ""
        }`}
      >
        <TrendingUp size={18} className="text-sme-gold" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-mono font-semibold text-sme-gold">
          Signal Received
        </p>
        <p className="text-xs font-mono text-bone-white/80">
          +{points} Trust Weight
          {reason && ` • ${reason}`}
        </p>
      </div>
      <button
        onClick={handleClose}
        className="text-bone-white/70 hover:text-bone-white transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}



