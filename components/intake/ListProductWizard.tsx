"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface ListProductWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Legacy component - redirects to new ProductWizardV2
 * This maintains backward compatibility with existing code
 */
export default function ListProductWizard({ isOpen, onClose }: ListProductWizardProps) {
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      // Redirect to the new wizard page
      router.push("/products/submit");
      onClose();
    }
  }, [isOpen, router, onClose]);

  return null;
}
