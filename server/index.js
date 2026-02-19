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
const PORT = process.env.PORT || 3001;

// --- Security: CORS origin restriction ---
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:8080'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g., server-to-server, curl)
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

app.use(express.json());

// --- Security: Basic rate limiting ---
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 100; // max requests per window

app.use('/api/', (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const record = rateLimit.get(ip);

    if (!record || now - record.start > RATE_LIMIT_WINDOW) {
        rateLimit.set(ip, { start: now, count: 1 });
        return next();
    }

    record.count++;
    if (record.count > RATE_LIMIT_MAX) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    next();
});

// --- Security: Set basic security headers ---
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// --- Health check endpoint ---
app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// Lat/Lon for Barangay Conalum, Inopacan, Leyte
const LAT = 10.5006;
const LON = 124.8006;

const API_KEY = process.env.OPENWEATHER_API_KEY;

app.get('/api/weather', async (req, res) => {
    try {
        // Return mock data if no API key is configured
        if (!API_KEY) {
            console.warn('OPENWEATHER_API_KEY not set. Returning mock data.');
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
        console.error('Weather API Error:', error.response?.data || error.message);
        // Don't leak internal error details in production
        res.status(500).json({
            error: 'Failed to fetch weather data'
        });
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Weather Server running on port ${PORT}`);
});
