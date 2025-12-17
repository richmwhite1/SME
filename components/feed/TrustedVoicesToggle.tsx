"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

export default function TrustedVoicesToggle() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isTrustedOnly, setIsTrustedOnly] = useState(
    searchParams.get("trusted") === "true"
  );

  useEffect(() => {
    setIsTrustedOnly(searchParams.get("trusted") === "true");
  }, [searchParams]);

  const handleToggle = () => {
    const newValue = !isTrustedOnly;
    setIsTrustedOnly(newValue);
    
    const params = new URLSearchParams(searchParams.toString());
    if (newValue) {
      params.set("trusted", "true");
    } else {
      params.delete("trusted");
    }
    
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-300 ${
        isTrustedOnly
          ? "border-earth-green bg-earth-green/20 text-earth-green"
          : "border-soft-clay/30 bg-white/70 text-deep-stone hover:border-earth-green/50"
      }`}
    >
      <ShieldCheck size={16} />
      <span>Trusted Voices Only</span>
    </button>
  );
}

