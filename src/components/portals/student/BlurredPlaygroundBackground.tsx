
import React from 'react';
import { motion } from 'framer-motion';

export const BlurredPlaygroundBackground: React.FC = () => {
    return (
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden rounded-t-[3rem]">
            {/* Base Gradient - Light Blue Sky/Pool */}
            <div className="absolute inset-0 bg-sky-50/80" />

            {/* Shapes mimicking a playground */}

            {/* 1. Green Grass/Field - Bottom Left */}
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    x: [0, 20, 0],
                    y: [0, -10, 0],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-emerald-200/50 rounded-full blur-[80px]"
            />

            {/* 2. Yellow Sun/Sand - Top Right */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    x: [0, -30, 0],
                    rotate: [0, 20, 0]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-20 -right-20 w-[350px] h-[350px] bg-amber-200/40 rounded-full blur-[80px]"
            />

            {/* 3. Soft Pink/Red Accent - Center Left */}
            <motion.div
                animate={{
                    x: [0, 40, 0],
                    y: [0, 30, 0],
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-1/4 -left-10 w-[250px] h-[250px] bg-rose-200/40 rounded-full blur-[60px]"
            />

            {/* 4. Blue Sky/Water Accent - Center Right */}
            <motion.div
                animate={{
                    x: [0, -20, 0],
                    y: [0, 50, 0],
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute bottom-1/4 -right-10 w-[300px] h-[300px] bg-sky-300/30 rounded-full blur-[70px]"
            />

            {/* 5. Subtle Violet Accent - Top Center */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-32 bg-indigo-200/20 rounded-full blur-[50px]" />
        </div>
    );
};
