"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastContainer";

export default function ToastHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    const toast = searchParams.get("toast");
    if (toast === "Higher+Trust+Weight+Required" || toast === "Higher Trust Weight Required") {
      showToast("Higher Trust Weight Required", "error");
      // Clean up the URL
      const newUrl = window.location.pathname;
      router.replace(newUrl);
    }
  }, [searchParams, router, showToast]);

  return null;
}



