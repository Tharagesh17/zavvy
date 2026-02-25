"use client";

import { incrementLinkClicks } from "@/app/actions/products";
import { useEffect } from "react";

export function TrackClick({ shortCode }: { shortCode: string }) {
  useEffect(() => {
    incrementLinkClicks(shortCode);
  }, [shortCode]);
  return null;
}
