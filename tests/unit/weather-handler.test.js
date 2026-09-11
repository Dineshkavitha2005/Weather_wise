const { handleWeatherRequest } = require('../../server/weather-handler');

function response() {
    return { statusCode: 200, headers: {}, body: '', setHeader(name, value) { this.headers[name] = value; }, end(body) { this.body = body || ''; } };
}

describe('weather API handler', () => {
    const originalFetch = global.fetch;
    const originalKey = process.env.OPENWEATHER_API_KEY;

    afterEach(() => {
        global.fetch = originalFetch;
        if (originalKey === undefined) delete process.env.OPENWEATHER_API_KEY;
        else process.env.OPENWEATHER_API_KEY = originalKey;
    });

    it('proxies current weather without returning the upstream credential', async () => {
        process.env.OPENWEATHER_API_KEY = 'server-test-key';
        global.fetch = async url => ({ ok: true, status: 200, json: async () => ({ main: { temp: 20 } }), headers: { get: () => 'application/json' }, url });
        const result = response();
        await handleWeatherRequest({ method: 'GET', url: '/api/weather?type=current&lat=1&lon=2' }, result);
        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual({ main: { temp: 20 } });
    });

    it.each([[401, 'INVALID_API_KEY'], [404, 'CITY_NOT_FOUND'], [429, 'RATE_LIMIT'], [503, 'UPSTREAM_SERVER_ERROR']])('maps upstream %s errors safely', async (status, code) => {
        process.env.OPENWEATHER_API_KEY = 'server-test-key';
        global.fetch = async () => ({ ok: false, status, json: async () => ({ message: 'secret upstream detail' }), headers: { get: () => 'application/json' } });
        const result = response();
        await handleWeatherRequest({ method: 'GET', url: '/api/weather?type=current&lat=1&lon=2' }, result);
        expect(result.statusCode).toBe(status === 404 ? 404 : status === 429 ? 429 : 502);
        expect(JSON.parse(result.body)).toMatchObject({ error: code });
        expect(result.body).not.toContain('server-test-key');
        expect(result.body).not.toContain('secret upstream detail');
    });

    it('returns safe errors for network failures and malformed responses', async () => {
        process.env.OPENWEATHER_API_KEY = 'server-test-key';
        global.fetch = async () => { throw new Error('socket details'); };
        const networkResult = response();
        await handleWeatherRequest({ method: 'GET', url: '/api/weather?type=current&lat=1&lon=2' }, networkResult);
        expect(JSON.parse(networkResult.body)).toMatchObject({ error: 'NETWORK_ERROR' });

        global.fetch = async () => ({ ok: true, status: 200, json: async () => null, headers: { get: () => 'application/json' } });
        const malformedResult = response();
        await handleWeatherRequest({ method: 'GET', url: '/api/weather?type=current&lat=1&lon=2' }, malformedResult);
        expect(JSON.parse(malformedResult.body)).toMatchObject({ error: 'MALFORMED_RESPONSE' });
    });

    it('returns a timeout error when the upstream aborts', async () => {
        process.env.OPENWEATHER_API_KEY = 'server-test-key';
        global.fetch = async () => { const error = new Error('aborted'); error.name = 'AbortError'; throw error; };
        const result = response();
        await handleWeatherRequest({ method: 'GET', url: '/api/weather?type=current&lat=1&lon=2' }, result);
        expect(result.statusCode).toBe(504);
        expect(JSON.parse(result.body)).toMatchObject({ error: 'TIMEOUT' });
    });
});