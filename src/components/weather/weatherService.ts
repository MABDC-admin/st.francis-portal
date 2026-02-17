import axios from 'axios';

export interface WeatherData {
    theme: 'sunny' | 'rainy' | 'windy';
    windSpeed: number;
    condition: string;
    isDay: boolean;
    location: string;
    temp: number;
}

export const fetchWeather = async (): Promise<WeatherData> => {
    try {
        const response = await axios.get('/api/weather');
        return response.data;
    } catch (error) {
        console.error('Error fetching weather:', error);
        // Fallback to sunny if API fails
        return {
            theme: 'sunny',
            windSpeed: 0,
            condition: 'Unknown',
            isDay: true,
            location: 'Unknown',
            temp: 25
        };
    }
};
