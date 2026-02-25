"use client";

import { useState, useEffect } from "react";

/**
 * Detects if the user is on a mobile device (client-side).
 * Uses a combination of userAgent and screen width for accuracy.
 */
export function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const ua = navigator.userAgent;
        const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        const narrowScreen = window.innerWidth < 768;
        setIsMobile(mobile || narrowScreen);
    }, []);

    return isMobile;
}
