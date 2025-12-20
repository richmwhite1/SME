"use client";

import Link, { LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

interface PrefetchLinkProps extends Omit<LinkProps, "href"> {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * PrefetchLink - Pre-fetches page data on hover for instant navigation
 * Wraps Next.js Link with automatic prefetching on hover
 */
export default function PrefetchLink({
  href,
  children,
  className,
  onClick,
  ...props
}: PrefetchLinkProps) {
  const router = useRouter();

  const handleMouseEnter = () => {
    // Prefetch the route on hover
    router.prefetch(href);
  };

  return (
    <Link
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
      onClick={onClick}
      {...props}
    >
      {children}
    </Link>
  );
}


