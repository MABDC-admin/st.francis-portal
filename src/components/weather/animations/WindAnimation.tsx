import React from 'react';
import { motion } from 'framer-motion';

export const WindAnimation = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {/* Fast Moving Clouds */}
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute bg-white/60 rounded-full blur-xl"
                    style={{
                        width: Math.random() * 300 + 200,
                        height: Math.random() * 80 + 40,
                        top: `${Math.random() * 60}%`,
                    }}
                    initial={{ x: -400 }}
                    animate={{ x: ['-20%', '120%'] }}
                    transition={{
                        duration: Math.random() * 10 + 15, // Fast clouds
                        repeat: Infinity,
                        ease: "linear",
                        delay: Math.random() * 5
                    }}
                />
            ))}

            {/* Camera Shake Effect wrapper would be external, but we can visualize wind with particles */}

            {/* Flying Debris/Leaves */}
            {[...Array(10)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-3 h-3 bg-emerald-700/60 rounded-tl-full rounded-br-full"
                    initial={{ x: -50, y: Math.random() * 500, rotate: 0 }}
                    animate={{
                        x: ['0vw', '100vw'],
                        y: [null, Math.random() * 100 - 50],
                        rotate: 360 * 4
                    }}
                    transition={{
                        duration: Math.random() * 5 + 3, // Fast wind
                        repeat: Infinity,
                        ease: "easeIn",
                        delay: Math.random() * 5
                    }}
                />
            ))}
        </div>
    );
};
