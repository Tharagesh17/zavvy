"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
    durationMinutes?: number;
    onExpire?: () => void;
}

export function CountdownTimer({ durationMinutes = 3, onExpire }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);

    useEffect(() => {
        if (timeLeft <= 0) {
            onExpire?.();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, onExpire]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const percentage = (timeLeft / (durationMinutes * 60)) * 100;
    const isUrgent = timeLeft <= 60;
    const isExpired = timeLeft <= 0;

    if (isExpired) {
        return (
            <div className="flex flex-col items-center space-y-2 py-3">
                <div className="text-red-500 text-sm font-bold animate-pulse">
                    ⏰ Session expired — please refresh to retry
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center space-y-3 py-3">
            {/* Progress Ring */}
            <div className="relative">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                    <circle
                        cx="32" cy="32" r="28"
                        fill="none"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="4"
                    />
                    <circle
                        cx="32" cy="32" r="28"
                        fill="none"
                        stroke={isUrgent ? "#ef4444" : "#0070f3"}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - percentage / 100)}`}
                        className="transition-all duration-1000 ease-linear"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-sm font-mono font-bold ${isUrgent ? 'text-red-500' : 'text-white'}`}>
                        {minutes}:{String(seconds).padStart(2, "0")}
                    </span>
                </div>
            </div>
            <span className={`text-[10px] uppercase tracking-widest font-bold ${isUrgent ? 'text-red-400' : 'text-slate-500'}`}>
                {isUrgent ? 'Hurry! Time running out' : 'Complete payment within'}
            </span>
        </div>
    );
}
