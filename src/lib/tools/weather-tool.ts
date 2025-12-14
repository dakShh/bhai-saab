import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const WEATHER_CODES: Record<number, string> = {
    0: 'Clear',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    80: 'Rain showers',
    95: 'Thunderstorm',
};

export const weatherTool = tool(
    async ({ location }) => {
        try {
            const geoRes = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
                    location
                )}&count=1&format=json`
            );
            const geo = await geoRes.json();

            if (!geo.results?.[0])
                return `Could not find location "${location}". Please try being more specific (e.g., "New York, NY" or "London, UK").`;

            const { latitude, longitude, name, country, admin1 } = geo.results[0];

            const weatherRes = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&temperature_unit=celsius&wind_speed_unit=mph`
            );
            const { current } = await weatherRes.json();

            return JSON.stringify(
                {
                    location: admin1 ? `${name}, ${admin1}, ${country}` : `${name}, ${country}`,
                    condition: WEATHER_CODES[current.weather_code] || 'Unknown',
                    temp: `${current.temperature_2m}°C`,
                    feels_like: `${current.apparent_temperature}°C`,
                    humidity: `${current.relative_humidity_2m}%`,
                    wind: `${current.wind_speed_10m} mph`,
                },
                null,
                2
            );
        } catch (err) {
            return `Error: ${err instanceof Error ? err.message : 'Unknown'}`;
        }
    },
    {
        name: 'get_weather',
        description: 'Get current weather for a location',
        schema: z.object({
            location: z.string().describe('City and state, e.g. San Francisco, CA'),
        }),
    }
);
