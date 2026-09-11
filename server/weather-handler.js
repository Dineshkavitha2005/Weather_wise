const OWM_BASE_URL = 'https://api.openweathermap.org';
const UPSTREAM_TIMEOUT_MS = 8000;
const TILE_LAYERS = new Set(['temp_new', 'precipitation_new', 'clouds_new', 'wind_new', 'pressure_new']);

function safeError(code, message, status = 502) {
    const error = new Error(message);
    error.code = code;
    error.status = status;
    return error;
}

function sendJson(res, status, body) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
}

function getQuery(req) {
    const url = new URL(req.url || '/', 'http://localhost');
    return url.searchParams;
}

function requireNumber(value, name) {
    const number = Number(value);
    if (!Number.isFinite(number)) throw safeError('INVALID_REQUEST', `Invalid ${name}.`, 400);
    return number;
}

async function fetchUpstream(path, options = {}) {
    if (!process.env.OPENWEATHER_API_KEY) {
        throw safeError('CONFIGURATION_ERROR', 'Weather service is not configured.', 503);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    const separator = path.includes('?') ? '&' : '?';
    const url = `${OWM_BASE_URL}${path}${separator}appid=${encodeURIComponent(process.env.OPENWEATHER_API_KEY)}`;

    let response;
    try {
        response = await fetch(url, { ...options, signal: controller.signal });
    } catch (error) {
        throw safeError(error.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR', 'Weather service could not be reached.', error.name === 'AbortError' ? 504 : 502);
    } finally {
        clearTimeout(timeout);
    }

    if (options.binary) {
        if (!response.ok) throw mapUpstreamError(response.status, null);
        return { body: Buffer.from(await response.arrayBuffer()), contentType: response.headers.get('content-type') || 'image/png' };
    }

    const data = await response.json().catch(() => null);
    if (!response.ok || (data && Number(data.cod) >= 400)) throw mapUpstreamError(response.status, data);
    if (data === null || typeof data !== 'object') throw safeError('MALFORMED_RESPONSE', 'Weather service returned an invalid response.', 502);
    return data;
}

function mapUpstreamError(status, data) {
    if (status === 401 || Number(data?.cod) === 401) return safeError('INVALID_API_KEY', 'Weather service authorization failed.', 502);
    if (status === 404 || Number(data?.cod) === 404) return safeError('CITY_NOT_FOUND', 'City not found.', 404);
    if (status === 429 || Number(data?.cod) === 429) return safeError('RATE_LIMIT', 'Weather service rate limit reached.', 429);
    if (status >= 500) return safeError('UPSTREAM_SERVER_ERROR', 'Weather service is temporarily unavailable.', 502);
    return safeError('UPSTREAM_ERROR', 'Weather service request failed.', 502);
}

async function handleWeatherRequest(req, res) {
    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
    }
    if (req.method !== 'GET') {
        sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed.' });
        return;
    }

    try {
        const query = getQuery(req);
        const type = query.get('type');
        let data;
        if (type === 'current' || type === 'forecast') {
            const lat = requireNumber(query.get('lat'), 'latitude');
            const lon = requireNumber(query.get('lon'), 'longitude');
            const path = `/data/2.5/${type === 'current' ? 'weather' : 'forecast'}?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&units=metric&lang=${encodeURIComponent(query.get('lang') || 'en')}`;
            data = await fetchUpstream(path);
        } else if (type === 'geocode' || type === 'reverse-geocode') {
            const path = type === 'geocode'
                ? `/geo/1.0/direct?q=${encodeURIComponent(query.get('q') || '')}&limit=${encodeURIComponent(query.get('limit') || '5')}`
                : `/geo/1.0/reverse?lat=${encodeURIComponent(requireNumber(query.get('lat'), 'latitude'))}&lon=${encodeURIComponent(requireNumber(query.get('lon'), 'longitude'))}&limit=${encodeURIComponent(query.get('limit') || '1')}`;
            if (type === 'geocode' && !query.get('q')?.trim()) throw safeError('INVALID_REQUEST', 'A city query is required.', 400);
            data = await fetchUpstream(path);
        } else if (type === 'tile') {
            const layer = query.get('layer');
            const z = requireNumber(query.get('z'), 'zoom');
            const x = requireNumber(query.get('x'), 'tile x');
            const y = requireNumber(query.get('y'), 'tile y');
            if (!TILE_LAYERS.has(layer) || ![z, x, y].every(Number.isInteger) || z < 0 || z > 18 || x < 0 || y < 0) throw safeError('INVALID_REQUEST', 'Invalid map tile request.', 400);
            const tile = await fetchUpstream(`/map/${layer}/${z}/${x}/${y}.png`, { binary: true });
            res.statusCode = 200;
            res.setHeader('Content-Type', tile.contentType);
            res.setHeader('Cache-Control', 'public, max-age=300');
            res.end(tile.body);
            return;
        } else {
            throw safeError('INVALID_REQUEST', 'Unsupported weather operation.', 400);
        }
        sendJson(res, 200, data);
    } catch (error) {
        const status = error.status || 500;
        sendJson(res, status, { error: error.code || 'SERVER_ERROR', message: status >= 500 ? 'Weather service is temporarily unavailable.' : error.message });
    }
}

module.exports = { handleWeatherRequest, fetchUpstream };