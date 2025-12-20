"use client";

import { useState, useEffect } from "react";
import NewsletterSignup from "./NewsletterSignup";

export default function NewsletterSlideIn() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasSeen, setHasSeen] = useState(false);

  useEffect(() => {
    // Check if user has already seen the slide-in in this session
    const seen = sessionStorage.getItem("newsletter-slidein-seen");
    if (seen) {
      setHasSeen(true);
      return;
    }

    // Show slide-in after 3 seconds on topic pages
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setHasSeen(true);
    sessionStorage.setItem("newsletter-slidein-seen", "true");
  };

  if (hasSeen || !isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="pointer-events-auto">
        <NewsletterSignup variant="slide-in" onClose={handleClose} />
      </div>
    </div>
  );
}




