"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function OrderSearch({ onResults, onClear }: { onResults: (orders: any[]) => void; onClear: () => void }) {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);

    const doSearch = useCallback(async (q: string) => {
        if (q.trim().length < 2) {
            onClear();
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/orders/search?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            onResults(data.orders || []);
        } catch {
            onClear();
        } finally {
            setLoading(false);
        }
    }, [onResults, onClear]);

    useEffect(() => {
        const timer = setTimeout(() => doSearch(query), 350);
        return () => clearTimeout(timer);
    }, [query, doSearch]);

    const handleClear = () => {
        setQuery("");
        onClear();
    };

    return (
        <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, phone, AWB..."
                className="pl-9 pr-9 h-10 bg-white/[0.03] border-border text-sm"
            />
            {loading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
            )}
            {!loading && query && (
                <button
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
