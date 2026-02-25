"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function HeroForm({ isLoggedIn }: { isLoggedIn: boolean }) {
    if (isLoggedIn) {
        return (
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button asChild size="lg" className="text-lg px-8">
                    <Link href="/dashboard">
                        Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-sm space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
                <Button asChild size="lg" className="w-full sm:w-auto">
                    <Link href="/login">
                        Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
            <p className="text-xs text-muted-foreground px-1">
                Sign in with your email to get started.
            </p>
        </div>
    );
}
