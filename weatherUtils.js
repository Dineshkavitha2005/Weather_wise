(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.WeatherUtils = factory();
    }
}(typeof window !== 'undefined' ? window : globalThis, function () {
    function createWeatherError(code, message) {
        const error = new Error(message);
        error.code = code;
        return error;
    }

    async function fetchWeatherData(lat, lon, options = {}) {
        const { language = 'en', baseUrl = '/api/weather', fetchImpl = typeof fetch === 'function' ? fetch : null } = options;
        if (!fetchImpl) throw createWeatherError('NETWORK_ERROR', 'Fetch is not available.');

        const request = async path => {
            let response;
            try {
                response = await fetchImpl(path);
            } catch (error) {
                throw createWeatherError('NETWORK_ERROR', 'Unable to connect to the weather service.');
            }
            const data = await response.json().catch(() => null);
            if (!response.ok || Number(data?.cod) >= 400) {
                const code = data?.error === 'INVALID_API_KEY' || response.status === 401 ? 'INVALID_API_KEY' : data?.error === 'CITY_NOT_FOUND' || response.status === 404 ? 'CITY_NOT_FOUND' : data?.error === 'RATE_LIMIT' || response.status === 429 ? 'RATE_LIMIT' : data?.error === 'TIMEOUT' || response.status === 504 ? 'TIMEOUT' : response.status >= 500 ? 'SERVER_ERROR' : 'API_ERROR';
                throw createWeatherError(code, data?.message || 'OpenWeatherMap request failed.');
            }
            if (!data) throw createWeatherError('API_ERROR', 'OpenWeatherMap returned an invalid response.');
            return data;
        };

        const query = `lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&lang=${encodeURIComponent(language)}`;
        const [current, forecast] = await Promise.all([request(`${baseUrl}?type=current&${query}`), request(`${baseUrl}?type=forecast&${query}`)]);
        return { current, forecast };
    }

    function parseForecastData(forecast) {
        const items = Array.isArray(forecast) ? forecast : forecast?.list;
        if (!items?.length) return [];
        const grouped = new Map();
        items.forEach(item => {
            const date = new Date(item.dt * 1000);
            const key = date.toDateString();
            if (!grouped.has(key)) grouped.set(key, { date, items: [] });
            grouped.get(key).items.push(item);
        });
        return Array.from(grouped.values()).map(({ date, items: dayItems }) => {
            const conditions = {};
            dayItems.forEach(item => {
                const condition = item.weather?.[0] || {};
                const key = condition.id ?? condition.main ?? 'unknown';
                conditions[key] = conditions[key] || { count: 0, description: condition.description || '', icon: condition.icon || '01d' };
                conditions[key].count++;
            });
            const dominant = Object.values(conditions).sort((a, b) => b.count - a.count)[0];
            return {
                date,
                high: Math.round(Math.max(...dayItems.map(item => item.main.temp))),
                low: Math.round(Math.min(...dayItems.map(item => item.main.temp))),
                rainChance: Math.round(Math.max(...dayItems.map(item => item.pop || 0)) * 100),
                description: dominant.description,
                icon: dominant.icon
            };
        });
    }

    function generateWeatherSummary(currentWeather, dailyForecasts) {
        const days = parseForecastData(dailyForecasts);
        if (!currentWeather && !days.length) return 'Weather data is unavailable.';
        const current = currentWeather?.main?.temp == null ? '' : `Current temperature is ${Math.round(currentWeather.main.temp)}°C.`;
        if (days.length < 2) return current || 'Weather data is available.';
        const difference = days[1].high - days[0].high;
        const trend = difference >= 2 ? 'warmer' : difference <= -2 ? 'cooler' : 'similar';
        const rain = Math.max(...days.slice(0, 3).map(day => day.rainChance));
        return `${current} Tomorrow will be ${trend} with a high of ${days[1].high}°C. Rain chances reach ${rain}%.`.trim();
    }

    return { fetchWeatherData, parseForecastData, generateWeatherSummary };
}));