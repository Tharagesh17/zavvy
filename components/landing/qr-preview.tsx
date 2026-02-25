"use client";

import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";

export function QrPreview() {
    return (
        <div className="relative w-full max-w-sm mx-auto">
            <motion.div
                animate={{
                    rotateY: [0, 10, -10, 0],
                    rotateX: [0, 5, -5, 0]
                }}
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="relative z-10 p-8 rounded-[2.5rem] bg-white text-black shadow-2xl"
            >
                <div className="flex flex-col items-center gap-6">
                    <div className="p-4 rounded-3xl bg-slate-50 border-2 border-slate-100 shadow-inner">
                        <QRCodeSVG
                            value="https://zavvy.co/l/demo"
                            size={180}
                            fgColor="#000000"
                            level="H"
                        />
                    </div>
                    <div className="text-center">
                        <div className="font-black text-xs uppercase tracking-[0.3em] mb-1 opacity-40 italic">Scan to buy</div>
                        <div className="font-bold text-lg">Demo Studio</div>
                    </div>
                </div>
            </motion.div>

            {/* Glow effect wrap */}
            <div className="absolute inset-0 bg-primary/20 blur-[100px] -z-10 rounded-full scale-110" />

            {/* Abstract floating elements */}
            <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-12 -right-8 w-24 h-24 bg-primary/10 backdrop-blur-md border border-white/10 rounded-2xl -z-10 rotate-12 flex items-center justify-center"
            >
                <div className="w-12 h-1 h-1 bg-primary/40 rounded-full" />
            </motion.div>
        </div>
    );
}
