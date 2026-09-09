const { handleChatRequest } = require('../../../server/chat-handler');

exports.handler = async (event, context) => {
    const headers = {};
    const request = {
        method: event.httpMethod,
        headers: event.headers,
        body: event.body ? JSON.parse(event.body) : undefined
    };
    const response = {
        statusCode: 200,
        headers: {},
        body: '',
        setHeader(name, value) { headers[name] = value; },
        end(body) { this.body = body || ''; }
    };
    await handleChatRequest(request, response);
    return { statusCode: response.statusCode, headers: { ...headers, ...response.headers }, body: response.body };
};