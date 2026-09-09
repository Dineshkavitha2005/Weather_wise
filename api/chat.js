const { handleChatRequest } = require('../server/chat-handler');

module.exports = (req, res) => handleChatRequest(req, res);