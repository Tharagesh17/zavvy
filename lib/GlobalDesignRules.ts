export const DesignSystem = {
    colors: {
        midnight: "#121212",
        charcoal: "#1A1A1A",
        electricBlue: "#0070F3",
        slate: "#94A3B8",
        glass: "rgba(255, 255, 255, 0.05)",
        glassBorder: "rgba(255, 255, 255, 0.1)",
    },
    layout: {
        maxWidth: "480px", // Mobile-first constraint for social selling
        touchTarget: "44px", // Minimum touch target size ('98 UX Guidelines')
        borderRadius: "16px", // Smooth curves
    },
    typography: {
        heading: "font-sans font-bold tracking-tight",
        body: "font-sans text-slate-400",
    },
    animations: {
        hover: "transition-all duration-200 ease-in-out hover:scale-[1.02]",
        tap: "active:scale-95",
    }
};

export const tailwindClasses = {
    // Common utility classes for the "Midnight Studio" aesthetic
    pageBackground: "min-h-screen bg-[#121212] text-white selection:bg-blue-500/30",
    glassCard: "backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl shadow-black/50",
    primaryButton: "bg-[#0070F3] hover:bg-[#0060DF] text-white font-medium shadow-[0_0_20px_rgba(0,112,243,0.3)] transition-all",
    secondaryButton: "bg-white/5 hover:bg-white/10 text-white border border-white/10 backdrop-blur-md",
    input: "bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-[#0070F3] focus:ring-[#0070F3]/20",
};
