"use client";

import { useState } from "react";
import { Mail, X } from "lucide-react";

interface NewsletterSignupProps {
  variant?: "footer" | "slide-in";
  onClose?: () => void;
}

export default function NewsletterSignup({
  variant = "footer",
  onClose,
}: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      // Replace with your newsletter API endpoint
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error("Subscription failed");

      setStatus("success");
      setMessage("Thank you! Check your email to confirm.");
      setEmail("");

      // Auto-close slide-in after success
      if (variant === "slide-in" && onClose) {
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  if (variant === "footer") {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Join the Signal
        </h3>
        <p className="text-xs leading-relaxed text-slate-300">
          Get one Transparency Report per week. No noise. Pure signal.
        </p>
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-600"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
            >
              {status === "loading" ? "..." : "→"}
            </button>
          </div>
          {message && (
            <p
              className={`text-xs ${
                status === "success" ? "text-green-400" : "text-red-400"
              }`}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    );
  }

  // Slide-in variant
  return (
    <div className="fixed bottom-0 right-0 z-50 m-4 w-full max-w-sm rounded-lg border border-slate-200 bg-white shadow-xl">
      <div className="relative p-6">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        )}
        
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <Mail size={20} className="text-slate-600" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-slate-900">
              Join the Signal
            </h3>
            <p className="text-xs text-slate-600 font-mono uppercase tracking-wider">
              Weekly Transparency Reports
            </p>
          </div>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-slate-700">
          Get one Transparency Report per week. No noise. Pure signal.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full rounded border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder-slate-500 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
          >
            {status === "loading" ? "Subscribing..." : "Subscribe"}
          </button>
          {message && (
            <p
              className={`text-center text-xs ${
                status === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}




