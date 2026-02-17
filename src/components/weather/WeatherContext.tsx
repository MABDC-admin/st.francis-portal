import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { WeatherData, fetchWeather } from './weatherService';

interface WeatherContextType {
    weather: WeatherData | null;
    isLoading: boolean;
    refreshWeather: () => Promise<void>;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export const WeatherProvider = ({ children }: { children: ReactNode }) => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshWeather = async () => {
        try {
            const data = await fetchWeather();
            setWeather(data);
        } catch (error) {
            console.error('Failed to refresh weather', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshWeather();
        // Poll every 10 minutes
        const interval = setInterval(refreshWeather, 10 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <WeatherContext.Provider value={{ weather, isLoading, refreshWeather }}>
            {children}
        </WeatherContext.Provider>
    );
};

export const useWeather = () => {
    const context = useContext(WeatherContext);
    if (context === undefined) {
        throw new Error('useWeather must be used within a WeatherProvider');
    }
    return context;
};
