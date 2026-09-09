const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-3.5-turbo';
const REQUEST_TIMEOUT_MS = 10000;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_CONTEXT_LENGTH = 12000;

function responseBody(res, status, body) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
}

function getErrorResponse(errorCode) {
    const responses = {
        'invalid-api-key': [502, 'invalid-api-key'],
        'rate-limited': [429, 'rate-limited'],
        timeout: [504, 'timeout'],
        'invalid-response': [502, 'invalid-response'],
        'network-error': [502, 'network-error'],
        'service-error': [502, 'service-error']
    };
    const [status, code] = responses[errorCode] || responses['service-error'];
    return { status, body: { error: code } };
}

async function parseRequestBody(req) {
    if (req.body && typeof req.body === 'object') return req.body;
    let body = '';
    for await (const chunk of req) {
        body += chunk;
        if (body.length > MAX_CONTEXT_LENGTH + MAX_MESSAGE_LENGTH + 1000) {
            throw new Error('invalid-request');
        }
    }
    try {
        return JSON.parse(body);
    } catch {
        throw new Error('invalid-request');
    }
}

async function handleChatRequest(req, res, fetchImpl = fetch) {
    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
    }
    if (req.method !== 'POST') {
        responseBody(res, 405, { error: 'method-not-allowed' });
        return;
    }
    if (!process.env.OPENAI_API_KEY) {
        responseBody(res, 503, { error: 'service-unavailable' });
        return;
    }

    let request;
    try {
        request = await parseRequestBody(req);
    } catch {
        responseBody(res, 400, { error: 'invalid-request' });
        return;
    }

    const message = typeof request.message === 'string' ? request.message.trim() : '';
    const weatherContext = typeof request.weatherContext === 'string' ? request.weatherContext.trim() : '';
    if (!message || message.length > MAX_MESSAGE_LENGTH || !weatherContext || weatherContext.length > MAX_CONTEXT_LENGTH) {
        responseBody(res, 400, { error: 'invalid-request' });
        return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        const upstreamResponse = await fetchImpl(OPENAI_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
                temperature: 0.4,
                messages: [
                    {
                        role: 'system',
                        content: `You are WeatherWise, a helpful weather assistant. Answer the user's question using the supplied live weather context. If the question is unrelated to weather, politely say you can only help with weather. Do not invent weather data. Respond in the user's language when possible. Keep answers concise.\n\nLive weather context:\n${weatherContext}`
                    },
                    { role: 'user', content: message }
                ]
            }),
            signal: controller.signal
        });

        if (upstreamResponse.status === 401) {
            const error = getErrorResponse('invalid-api-key');
            responseBody(res, error.status, error.body);
            return;
        }
        if (upstreamResponse.status === 429) {
            const error = getErrorResponse('rate-limited');
            responseBody(res, error.status, error.body);
            return;
        }
        if (!upstreamResponse.ok) {
            const error = getErrorResponse('service-error');
            responseBody(res, error.status, error.body);
            return;
        }

        let data;
        try {
            data = await upstreamResponse.json();
        } catch {
            const error = getErrorResponse('invalid-response');
            responseBody(res, error.status, error.body);
            return;
        }
        const answer = data.choices?.[0]?.message?.content?.trim();
        if (!answer) {
            const error = getErrorResponse('invalid-response');
            responseBody(res, error.status, error.body);
            return;
        }
        responseBody(res, 200, { answer });
    } catch (error) {
        const errorCode = error.name === 'AbortError' ? 'timeout' : 'network-error';
        const response = getErrorResponse(errorCode);
        responseBody(res, response.status, response.body);
    } finally {
        clearTimeout(timeoutId);
    }
}

module.exports = { handleChatRequest };