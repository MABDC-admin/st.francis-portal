import React from 'react';
import { motion } from 'framer-motion';

export const SunAnimation = () => {
    return (
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none z-0">
            {/* Sun */}
            <motion.div
                className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full blur-2xl opacity-60"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.6, 0.8, 0.6],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            <motion.div
                className="absolute top-4 right-4 w-24 h-24 bg-yellow-400 rounded-full shadow-[0_0_40px_rgba(251,191,36,0.6)]"
                animate={{
                    rotate: 360,
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                }}
            >
                {/* Sun Rays */}
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute top-1/2 left-1/2 w-full h-1 bg-yellow-400/50 rounded-full origin-center"
                        style={{
                            transform: `translate(-50%, -50%) rotate(${i * 45}deg)`,
                            width: '140%'
                        }}
                    />
                ))}
            </motion.div>

            {/* Floating Light Particles */}
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-200 rounded-full blur-[1px]"
                    initial={{
                        x: Math.random() * 300 + 100, // Random position
                        y: Math.random() * 200,
                        opacity: 0
                    }}
                    animate={{
                        y: [null, Math.random() * -50], // Float up slightly
                        opacity: [0, 0.8, 0],
                        scale: [0, 1.5, 0]
                    }}
                    transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                        ease: "easeInOut"
                    }}
                    style={{
                        right: `${Math.random() * 30}%`,
                        top: `${Math.random() * 30}%`
                    }}
                />
            ))}
        </div>
    );
};
