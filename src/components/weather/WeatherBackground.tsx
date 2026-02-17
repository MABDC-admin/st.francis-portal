import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useWeather } from './WeatherContext';
import { SunnyAnimation } from './animations/SunnyAnimation';
import { RainAnimation } from './animations/RainAnimation';
import { WindAnimation } from './animations/WindAnimation';

interface WeatherBackgroundProps {
    forcedTheme?: 'sunny' | 'rainy' | 'windy' | null;
}

export const WeatherBackground = ({ forcedTheme }: WeatherBackgroundProps) => {
    const { weather } = useWeather();
    const theme = forcedTheme || weather?.theme || 'sunny'; // Priority: Forced > API > Default

    return (
        <div className="absolute inset-0 z-0">
            <AnimatePresence mode="wait">
                {theme === 'sunny' && (forcedTheme || weather?.isDay) && (
                    <motion.div
                        key="sunny"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0"
                    >
                        <SunnyAnimation />
                    </motion.div>
                )}
                {theme === 'rainy' && (
                    <motion.div
                        key="rainy"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0"
                    >
                        <RainAnimation />
                    </motion.div>
                )}
                {theme === 'windy' && (
                    <motion.div
                        key="windy"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0"
                    >
                        <WindAnimation />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WeatherBackground;
