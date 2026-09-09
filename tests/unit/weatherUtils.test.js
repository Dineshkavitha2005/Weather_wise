const { fetchWeatherData, parseForecastData, generateWeatherSummary } = require('../../weatherUtils');

function forecastItem(timestamp, temperature, condition, rainChance = 0) {
    return { dt: timestamp, main: { temp: temperature }, pop: rainChance, weather: [{ id: condition === 'Clear' ? 800 : 500, main: condition, description: condition.toLowerCase(), icon: '01d' }] };
}

describe('parseForecastData', () => {
    it('groups forecast intervals by day and calculates daily values', () => {
        const start = Date.UTC(2026, 0, 1, 10) / 1000;
        const result = parseForecastData({ list: [forecastItem(start, 12, 'Clear', 0.1), forecastItem(start + 3600, 18, 'Clear', 0.6), forecastItem(start + 86400, 8, 'Rain', 0.8)] });
        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({ high: 18, low: 12, rainChance: 60 });
        expect(result[1]).toMatchObject({ high: 8, low: 8, rainChance: 80, description: 'rain' });
    });
});

describe('fetchWeatherData', () => {
    it('fetches current conditions and forecast with shared query parameters', async () => {
        const requests = [];
        const fetchImpl = async url => { requests.push(url); return { ok: true, status: 200, json: async () => ({ list: [] }) }; };
        const result = await fetchWeatherData(51.5, -0.1, { apiKey: 'test-key', fetchImpl });
        expect(result.current).toEqual({ list: [] });
        expect(result.forecast).toEqual({ list: [] });
        expect(requests).toHaveLength(2);
        expect(requests[0]).toContain('lat=51.5');
        expect(requests[0]).toContain('appid=test-key');
    });
});

describe('generateWeatherSummary', () => {
    it('describes current temperature, tomorrow trend, and rain chance', () => {
        const start = Date.UTC(2026, 0, 1, 10) / 1000;
        const summary = generateWeatherSummary({ main: { temp: 10 } }, { list: [forecastItem(start, 12, 'Clear', 0.1), forecastItem(start + 86400, 17, 'Rain', 0.7)] });
        expect(summary).toContain('Current temperature is 10°C.');
        expect(summary).toContain('Tomorrow will be warmer');
        expect(summary).toContain('Rain chances reach 70%.');
    });
});