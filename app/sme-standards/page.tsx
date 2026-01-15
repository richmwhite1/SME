"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SMEStandardsRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/standards");
    }, [router]);

    return null;
}
