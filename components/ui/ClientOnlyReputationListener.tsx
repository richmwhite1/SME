"use client";

import { useEffect, useState } from "react";
import ReputationListener from "./ReputationListener";

/**
 * Client-only wrapper for ReputationListener to prevent hydration mismatches
 * This component only renders after the client has mounted
 */
export default function ClientOnlyReputationListener() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return <ReputationListener />;
}
