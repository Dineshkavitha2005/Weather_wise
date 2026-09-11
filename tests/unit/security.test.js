const fs = require('fs');
const path = require('path');

describe('OpenAI browser security', () => {
    it('does not include an OpenAI key or direct OpenAI endpoint in browser files', () => {
        const browserFiles = ['app.js', 'config.js', 'config.example.js', 'index.html', 'auth.js', 'pwa.js', 'weatherMap.js'];
        const browserSource = browserFiles.map(file => fs.readFileSync(path.join(__dirname, '..', '..', file), 'utf8')).join('\n');
        expect(browserSource).not.toMatch(/openAiApiKey|OPENAI_API_KEY|api\.openai\.com|Bearer\s+\$\{/i);
    });
});

describe('OpenWeatherMap browser security', () => {
    it('does not include an OWM key or direct API request in browser files', () => {
        const browserFiles = ['app.js', 'config.js', 'config.example.js', 'index.html', 'auth.js', 'pwa.js', 'weatherMap.js', 'weatherUtils.js'];
        const browserSource = browserFiles.map(file => fs.readFileSync(path.join(__dirname, '..', '..', file), 'utf8')).join('\n');
        expect(browserSource).not.toMatch(/openWeatherApiKey|OPENWEATHER_API_KEY|api\.openweathermap\.org|tile\.openweathermap\.org|appid=/i);
        expect(fs.readFileSync(path.join(__dirname, '..', '..', 'config.js'), 'utf8')).not.toMatch(/[a-f0-9]{32}/i);
    });
});
describe('Firebase authentication security', () => {
    it('does not use application storage as an authentication authority', () => {
        const browserFiles = ['app.js', 'auth.js', 'auth-state.js', 'index.html', 'auth.html'];
        const browserSource = browserFiles.map(file => fs.readFileSync(path.join(__dirname, '..', '..', file), 'utf8')).join('\n');
        expect(browserSource).not.toMatch(/weatherwise_user/);
        expect(browserSource).not.toMatch(/localStorage\.setItem\([^)]*password|sessionStorage\.setItem\([^)]*password/i);
        expect(browserSource).toContain('onAuthStateChanged');
        expect(browserSource).toContain('setPersistence');
    });
});