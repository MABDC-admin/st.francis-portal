import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

export const RabbitButterflyBackground = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {/* Ambient Background Elements */}

            {/* Fluttering Butterflies */}
            <Butterfly />
            <Butterfly delay={5} initialY={150} />

            {/* Dragonflies */}
            <Dragonfly delay={2} initialY={80} />
            <Dragonfly delay={12} initialY={200} />

            {/* Bees */}
            <Bee delay={8} initialY={120} />
            <Bee delay={18} initialY={60} />
        </div>
    );
};

const Butterfly = ({ delay = 0, initialY = 50 }: { delay?: number, initialY?: number }) => {
    return (
        <motion.div
            className="absolute"
            style={{ top: initialY }}
            initial={{ x: -50, opacity: 0 }}
            animate={{
                x: ['0vw', '110vw'],
                opacity: [0, 1, 1, 0],
                y: [initialY, initialY - 40, initialY + 20, initialY - 30, initialY]
            }}
            transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
                delay: delay,
            }}
        >
            <motion.div
                animate={{
                    scaleY: [1, 0.2, 1],
                }}
                transition={{
                    duration: 0.2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="w-8 h-8"
            >
                {/* SVG Butterfly */}
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
                    <path d="M50 50 Q 80 10 90 40 Q 80 80 50 60 Q 20 80 10 40 Q 20 10 50 50 Z" fill="#F472B6" stroke="#DB2777" strokeWidth="1" />
                    <path d="M50 50 Q 70 20 80 40 Q 70 60 50 55 Z" fill="#FBCFE8" />
                    <path d="M50 50 Q 30 20 20 40 Q 30 60 50 55 Z" fill="#FBCFE8" />
                    <path d="M48 40 L52 40 L52 70 L48 70 Z" fill="#334155" />
                    <path d="M48 40 L40 30" stroke="#334155" strokeWidth="1" />
                    <path d="M52 40 L60 30" stroke="#334155" strokeWidth="1" />
                </svg>
            </motion.div>
        </motion.div>
    );
};

const Dragonfly = ({ delay = 0, initialY = 50 }: { delay?: number, initialY?: number }) => {
    return (
        <motion.div
            className="absolute"
            style={{ top: initialY }}
            initial={{ x: -50, opacity: 0 }}
            animate={{
                x: ['0vw', '110vw'],
                opacity: [0, 1, 1, 0],
                y: [initialY, initialY - 10, initialY + 10, initialY] // Straighter flight path
            }}
            transition={{
                duration: 15, // Faster than butterfly
                repeat: Infinity,
                ease: "linear",
                delay: delay,
            }}
        >
            <motion.div
                className="w-10 h-10"
                animate={{ x: [0, 2, -2, 0] }} // Jittery movement
                transition={{ duration: 0.1, repeat: Infinity }}
            >
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
                    {/* Wings */}
                    <path d="M50 40 Q 90 20 95 35 Q 90 50 50 45" fill="#A7F3D0" stroke="#059669" strokeWidth="0.5" opacity="0.8" />
                    <path d="M50 40 Q 10 20 5 35 Q 10 50 50 45" fill="#A7F3D0" stroke="#059669" strokeWidth="0.5" opacity="0.8" />
                    <path d="M50 50 Q 80 70 85 60 Q 80 50 50 55" fill="#6EE7B7" stroke="#059669" strokeWidth="0.5" opacity="0.8" />
                    <path d="M50 50 Q 20 70 15 60 Q 20 50 50 55" fill="#6EE7B7" stroke="#059669" strokeWidth="0.5" opacity="0.8" />
                    {/* Body */}
                    <path d="M48 30 L52 30 L51 80 L49 80 Z" fill="#065F46" />
                    <circle cx="50" cy="30" r="4" fill="#047857" />
                </svg>
            </motion.div>
        </motion.div>
    );
};

const Bee = ({ delay = 0, initialY = 50 }: { delay?: number, initialY?: number }) => {
    return (
        <motion.div
            className="absolute"
            style={{ top: initialY }}
            initial={{ x: -50, opacity: 0 }}
            animate={{
                x: ['0vw', '110vw'],
                opacity: [0, 1, 1, 0],
                y: [initialY, initialY - 60, initialY + 40, initialY - 20, initialY] // Erratic flight
            }}
            transition={{
                duration: 25, // Slower flight
                repeat: Infinity,
                ease: "linear",
                delay: delay,
            }}
        >
            <motion.div
                animate={{ x: [0, 3, -3, 0], y: [0, 3, -3, 0] }} // Buzzing effect
                transition={{ duration: 0.1, repeat: Infinity }}
                className="w-6 h-6"
            >
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
                    {/* Wings */}
                    <path d="M50 40 Q 70 10 80 30 Q 60 50 50 45" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" opacity="0.7" />
                    <path d="M50 40 Q 30 10 20 30 Q 40 50 50 45" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" opacity="0.7" />
                    {/* Body */}
                    <ellipse cx="50" cy="50" rx="15" ry="20" fill="#FACC15" />
                    <path d="M35 45 H65" stroke="#000" strokeWidth="4" />
                    <path d="M35 55 H65" stroke="#000" strokeWidth="4" />
                    {/* Stinger */}
                    <path d="M50 70 L48 75 L52 75 Z" fill="#000" />
                </svg>
            </motion.div>
        </motion.div>
    );
};
