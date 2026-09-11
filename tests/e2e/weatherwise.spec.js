const { test, expect } = require('@playwright/test');

const currentWeather = { name: 'London', sys: { country: 'GB', sunrise: 0, sunset: 3600 }, main: { temp: 15, feels_like: 14, humidity: 60, pressure: 1012 }, wind: { speed: 2 }, visibility: 10000, clouds: { all: 0 }, weather: [{ icon: '01d', description: 'clear sky', main: 'Clear', id: 800 }] };
const forecast = { list: Array.from({ length: 8 }, (_, index) => ({ dt: 1767261600 + index * 10800, main: { temp: 15 + index }, pop: 0.1, weather: [{ icon: '01d', description: 'clear sky', main: 'Clear', id: 800 }] })) };

async function mockWeather(page) {
    await page.route('**/api/weather**', async route => {
        const url = new URL(route.request().url());
        const type = url.searchParams.get('type');
        if (type === 'current') return route.fulfill({ json: currentWeather });
        if (type === 'forecast') return route.fulfill({ json: forecast });
        if (type === 'geocode') return route.fulfill({ json: [{ lat: 40.7, lon: -74, name: 'New York', country: 'US' }] });
        return route.fulfill({ status: 404, json: { error: 'not-found' } });
    });
    await page.route('**/api/chat', async route => {
        const request = route.request();
        const payload = request.postDataJSON();
        if (payload.message !== 'Will it rain today?' || !payload.weatherContext.includes('Location: London')) {
            await route.fulfill({ status: 400, json: { error: 'invalid-request' } });
            return;
        }
        await route.fulfill({ json: { answer: 'The weather is clear and mild.' } });
    });
}

test.beforeEach(async ({ page }) => {
    await mockWeather(page);
    await page.goto('/index.html');
    await expect(page.locator('#cityName')).not.toHaveText('Loading...', { timeout: 10000 });
});

test('searches for a city and refreshes the weather view', async ({ page }) => {
    await page.locator('#citySearch').fill('New York');
    await page.locator('#searchBtn').click();
    await expect(page.locator('#cityName')).toContainText('New York');
});

test('sends a chatbot query and renders the assistant response', async ({ page }) => {
    await page.locator('#chatbotToggle').click();
    await page.locator('#chatInput').fill('Will it rain today?');
    await page.locator('#sendChatBtn').click();
    await expect(page.locator('#chatMessages')).toContainText('The weather is clear and mild.');
});

test('switches the interface language', async ({ page }) => {
    await page.locator('#languageSelect').selectOption('es');
    await expect(page.locator('[data-translate="hourlyForecast"]')).toHaveText('Pronóstico de 24 horas');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
});