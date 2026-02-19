import React from 'react';
import { motion } from 'framer-motion';

export const SunnyAnimation = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {/* Sun Glow */}
            <motion.div
                className="absolute top-10 right-10 w-40 h-40 bg-yellow-400 rounded-full blur-3xl opacity-60"
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.8, 0.6] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Sun Body */}
            <motion.div
                className="absolute top-16 right-16 w-24 h-24 bg-gradient-to-br from-yellow-100 to-yellow-500 rounded-full shadow-[0_0_60px_rgba(253,224,71,0.8)]"
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            >
                {/* Rays */}
                {[...Array(12)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute top-1/2 left-1/2 h-1 bg-yellow-300/80 rounded-full origin-center blur-[1px]"
                        style={{
                            width: '160%',
                            transform: `translate(-50%, -50%) rotate(${i * 30}deg)`
                        }}
                    />
                ))}
            </motion.div>

            {/* Floating Clouds */}
            {[...Array(4)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute bg-white/40 rounded-full blur-xl"
                    style={{
                        width: Math.random() * 200 + 100,
                        height: Math.random() * 60 + 40,
                        top: `${Math.random() * 40}%`,
                        left: `${Math.random() * 80}%`
                    }}
                    animate={{ x: [0, 50, 0] }}
                    transition={{
                        duration: Math.random() * 20 + 20,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            ))}
        </div>
    );
};
