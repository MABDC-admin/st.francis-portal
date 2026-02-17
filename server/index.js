import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Lat/Lon for Barangay Conalum, Inopacan, Leyte
const LAT = 10.5006;
const LON = 124.8006;

const API_KEY = process.env.OPENWEATHER_API_KEY || 'YOUR_OPENWEATHER_API_KEY';

app.get('/api/weather', async (req, res) => {
    try {
        // Mocking for now if no API key is set to avoid crashing
        if (API_KEY === 'YOUR_OPENWEATHER_API_KEY') {
            console.log('No API Key provided. Returning mock data.');
            const conditions = ['sunny', 'rainy', 'windy'];
            const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];

            return res.json({
                theme: randomCondition,
                windSpeed: 10,
                condition: 'Mock Weather',
                isDay: true,
                location: 'Barangay Conalum (Mock)',
                temp: 30
            });
        }

        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric`;
        const response = await axios.get(url);
        const data = response.data;

        // Logic to determine theme
        let theme = 'sunny';
        const windSpeed = data.wind.speed * 3.6; // Convert m/s to kph (approx)
        const isRaining = data.rain && (data.rain['1h'] > 0 || data.rain['3h'] > 0);
        const conditionCode = data.weather[0].id;

        // Check for rain (Codes 2xx, 3xx, 5xx)
        if (isRaining || (conditionCode >= 200 && conditionCode < 600)) {
            theme = 'rainy';
        }
        // Check for strong wind (>= 25 kph)
        else if (windSpeed >= 25) {
            theme = 'windy';
        }

        const isDay = data.dt > data.sys.sunrise && data.dt < data.sys.sunset;

        res.json({
            theme,
            windSpeed: parseFloat(windSpeed.toFixed(1)),
            condition: data.weather[0].main,
            isDay,
            location: 'Barangay Conalum',
            temp: data.main.temp
        });

    } catch (error) {
        console.error('Weather API Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Weather Server running on port ${PORT}`);
});
