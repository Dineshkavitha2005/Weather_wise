const { handleWeatherRequest } = require('../../server/weather-handler');

exports.handler = async event => {
    const headers = {};
    const request = { method: event.httpMethod, url: `/.netlify/functions/weather${event.rawQuery ? `?${event.rawQuery}` : ''}`, headers: event.headers };
    const response = {
        statusCode: 200,
        headers: {},
        body: '',
        setHeader(name, value) { headers[name] = value; },
        end(body) { this.body = body || ''; }
    };
    await handleWeatherRequest(request, response);
    const isBinary = Buffer.isBuffer(response.body);
    return {
        statusCode: response.statusCode,
        headers: { ...headers, ...response.headers },
        body: isBinary ? response.body.toString('base64') : response.body,
        isBase64Encoded: isBinary
    };
};