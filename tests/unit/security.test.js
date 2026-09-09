const fs = require('fs');
const path = require('path');

describe('OpenAI browser security', () => {
    it('does not include an OpenAI key or direct OpenAI endpoint in browser files', () => {
        const browserFiles = ['app.js', 'config.js', 'config.example.js', 'index.html', 'auth.js', 'pwa.js', 'weatherMap.js'];
        const browserSource = browserFiles.map(file => fs.readFileSync(path.join(__dirname, '..', '..', file), 'utf8')).join('\n');
        expect(browserSource).not.toMatch(/openAiApiKey|OPENAI_API_KEY|api\.openai\.com|Bearer\s+\$\{/i);
    });
});