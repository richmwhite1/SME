"use client";

import { useEffect, useState } from "react";
import { X, AlertCircle, CheckCircle2, Info } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "error" | "success" | "warning" | "info";
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = "error", onClose, duration = 5000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all duration-300 ${type === "error"
        ? "border-red-500/50 bg-red-500/10 text-red-400"
        : type === "warning"
          ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
          : type === "info"
            ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
            : "border-green-500/50 bg-green-500/10 text-green-400"
        } ${isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
    >
      {type === "error" ? (
        <AlertCircle size={18} className="flex-shrink-0" />
      ) : type === "warning" ? (
        <AlertCircle size={18} className="flex-shrink-0" />
      ) : type === "info" ? (
        <Info size={18} className="flex-shrink-0" />
      ) : (
        <CheckCircle2 size={18} className="flex-shrink-0" />
      )}
      <p className="text-sm font-mono">{message}</p>
      <button
        onClick={handleClose}
        className="ml-2 text-current/70 hover:text-current transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}



