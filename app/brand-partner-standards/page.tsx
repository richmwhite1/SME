"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BrandPartnerStandardsRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/brand-standards");
    }, [router]);

    return null;
}
