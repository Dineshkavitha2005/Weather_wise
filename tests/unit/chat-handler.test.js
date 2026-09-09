const { handleChatRequest } = require('../../server/chat-handler');

function request(body, method = 'POST') {
    return {
        method,
        body,
        async *[Symbol.asyncIterator]() {}
    };
}

function response() {
    return {
        statusCode: 200,
        headers: {},
        body: '',
        setHeader(name, value) { this.headers[name] = value; },
        end(body) { this.body = body || ''; }
    };
}

function upstream(status, payload) {
    return { status, ok: status >= 200 && status < 300, json: async () => payload };
}

describe('chat API handler', () => {
    const originalKey = process.env.OPENAI_API_KEY;

    beforeEach(() => {
        process.env.OPENAI_API_KEY = 'server-only-test-key';
    });

    afterAll(() => {
        process.env.OPENAI_API_KEY = originalKey;
    });

    it('returns an assistant answer without exposing the upstream response', async () => {
        const res = response();
        await handleChatRequest(request({ message: 'Rain?', weatherContext: 'Location: London' }), res, async (url, options) => {
            expect(url).toBe('https://api.openai.com/v1/chat/completions');
            expect(options.headers.Authorization).toBe('Bearer server-only-test-key');
            return upstream(200, { choices: [{ message: { content: 'Bring an umbrella.' } }] });
        });
        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ answer: 'Bring an umbrella.' });
    });

    it.each([
        [401, 'invalid-api-key'],
        [429, 'rate-limited'],
        [500, 'service-error']
    ])('maps OpenAI HTTP %s failures to a safe error', async (status, code) => {
        const res = response();
        await handleChatRequest(request({ message: 'Rain?', weatherContext: 'Location: London' }), res, async () => upstream(status, { error: { message: 'secret upstream detail' } }));
        expect(JSON.parse(res.body)).toEqual({ error: code });
        expect(res.body).not.toContain('secret upstream detail');
        expect(res.body).not.toContain('server-only-test-key');
    });

    it('handles malformed OpenAI JSON', async () => {
        const res = response();
        await handleChatRequest(request({ message: 'Rain?', weatherContext: 'Location: London' }), res, async () => ({ status: 200, ok: true, json: async () => { throw new Error('bad json'); } }));
        expect(res.statusCode).toBe(502);
        expect(JSON.parse(res.body)).toEqual({ error: 'invalid-response' });
    });

    it('handles an upstream timeout without revealing server details', async () => {
        const res = response();
        await handleChatRequest(request({ message: 'Rain?', weatherContext: 'Location: London' }), res, async () => {
            const error = new Error('timeout detail');
            error.name = 'AbortError';
            throw error;
        });
        expect(res.statusCode).toBe(504);
        expect(JSON.parse(res.body)).toEqual({ error: 'timeout' });
        expect(res.body).not.toContain('timeout detail');
    });

    it('handles network failures and invalid requests', async () => {
        const networkRes = response();
        await handleChatRequest(request({ message: 'Rain?', weatherContext: 'Location: London' }), networkRes, async () => { throw new Error('socket detail'); });
        expect(networkRes.statusCode).toBe(502);
        expect(JSON.parse(networkRes.body)).toEqual({ error: 'network-error' });

        const invalidRes = response();
        await handleChatRequest(request({ message: '', weatherContext: 'Location: London' }), invalidRes);
        expect(invalidRes.statusCode).toBe(400);
        expect(JSON.parse(invalidRes.body)).toEqual({ error: 'invalid-request' });
    });
});