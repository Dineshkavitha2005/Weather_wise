const { handleWeatherRequest } = require('../server/weather-handler');

module.exports = (req, res) => handleWeatherRequest(req, res);