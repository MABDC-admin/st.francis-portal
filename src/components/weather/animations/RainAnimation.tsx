import { motion } from 'framer-motion';
import { Cloud, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

export const RainAnimation = () => {
    const [lightningActive, setLightningActive] = useState(false);

    useEffect(() => {
        // Random lightning flashes
        const triggerLightning = () => {
            setLightningActive(true);
            setTimeout(() => setLightningActive(false), 200); // Flash duration

            // Schedule next flash randomly between 3-8 seconds
            const nextFlash = Math.random() * 5000 + 3000;
            setTimeout(triggerLightning, nextFlash);
        };

        const timeout = setTimeout(triggerLightning, 2000);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none z-0">
            {/* Dark overlay for storm effect when lightning flashes */}
            <div
                className={`absolute inset-0 bg-slate-900/20 transition-opacity duration-75 ${lightningActive ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Main Thunder Cloud */}
            <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="absolute top-4 right-4 sm:right-10"
            >
                <div className="relative">
                    {/* Cloud Base */}
                    <Cloud className="w-24 h-24 text-slate-400 fill-slate-200 drop-shadow-lg" />

                    {/* Darker Cloud Layer */}
                    <motion.div
                        animate={{ x: [0, 5, 0], y: [0, 2, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-2 -left-4"
                    >
                        <Cloud className="w-20 h-20 text-slate-500 fill-slate-300 drop-shadow-md" />
                    </motion.div>

                    {/* Lightning Bolt */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: lightningActive ? [0, 1, 0, 1, 0] : 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-0 left-8"
                    >
                        <Zap className="w-12 h-12 text-yellow-400 fill-yellow-300 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
                    </motion.div>
                </div>
            </motion.div>

            {/* Rain Drops */}
            {[...Array(15)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ y: -20, x: Math.random() * 100 + 50, opacity: 0 }}
                    animate={{
                        y: 150,
                        opacity: [0, 1, 0],
                        x: `calc(${Math.random() * 100 + 50}px - 20px)` // Angular rain
                    }}
                    transition={{
                        duration: 1 + Math.random(),
                        repeat: Infinity,
                        delay: Math.random() * 2,
                        ease: "linear"
                    }}
                    className="absolute top-10 right-10 w-0.5 h-4 bg-blue-400/60 rounded-full"
                />
            ))}
        </div>
    );
};
