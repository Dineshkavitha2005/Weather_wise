// app.js - Main Application Logic for WeatherWise

// API Configuration
const API_KEY = window.WEATHERWISE_CONFIG?.openWeatherApiKey;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0';
const CHAT_API_URL = '/api/chat';
const CHAT_REQUEST_TIMEOUT_MS = 12000;

// Global State
let currentCity = 'London';
let currentLat = 51.5074;
let currentLon = -0.1278;
let currentLang = 'en';
let currentTheme = 'light';
let weatherData = null;
let forecastData = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let voiceMode = false;
let highlightedSuggestionIndex = -1;
let currentSuggestions = [];
let recentSearches = [];
let chatRequestInProgress = false;
const MAX_RECENT_SEARCHES = 5;
const LAST_WEATHER_STORAGE_KEY = 'weatherwise_last_weather';

// DOM Elements
const elements = {
    citySearch: document.getElementById('citySearch'),
    searchBtn: document.getElementById('searchBtn'),
    voiceSearchBtn: document.getElementById('voiceSearchBtn'),
    locationBtn: document.getElementById('locationBtn'),
    languageSelect: document.getElementById('languageSelect'),
    themeToggle: document.getElementById('themeToggle'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    toastContainer: document.getElementById('toastContainer'),
    suggestionsContainer: document.getElementById('suggestionsContainer'),
    suggestionsList: document.getElementById('suggestionsList'),
    
    // Current Weather
    cityName: document.getElementById('cityName'),
    currentDate: document.getElementById('currentDate'),
    weatherIcon: document.getElementById('weatherIcon'),
    currentTemp: document.getElementById('currentTemp'),
    weatherDescription: document.getElementById('weatherDescription'),
    feelsLike: document.getElementById('feelsLike'),
    humidity: document.getElementById('humidity'),
    windSpeed: document.getElementById('windSpeed'),
    visibility: document.getElementById('visibility'),
    pressure: document.getElementById('pressure'),
    uvIndex: document.getElementById('uvIndex'),
    sunrise: document.getElementById('sunrise'),
    sunset: document.getElementById('sunset'),
    
    // Forecasts
    weeklyForecast: document.getElementById('weeklyForecast'),
    hourlyForecast: document.getElementById('hourlyForecast'),
    monthlyCalendar: document.getElementById('monthlyCalendar'),
    currentMonth: document.getElementById('currentMonth'),
    prevMonth: document.getElementById('prevMonth'),
    nextMonth: document.getElementById('nextMonth'),
    
    // Monthly Stats
    avgHighTemp: document.getElementById('avgHighTemp'),
    avgLowTemp: document.getElementById('avgLowTemp'),
    rainyDays: document.getElementById('rainyDays'),
    sunnyDays: document.getElementById('sunnyDays'),
    
    // AI Prediction
    extendedForecast: document.getElementById('extendedForecast'),
    weatherTrends: document.getElementById('weatherTrends'),
    weatherAlerts: document.getElementById('weatherAlerts'),
    aiRecommendations: document.getElementById('aiRecommendations'),
    
    // Weather Map
    weatherMap: document.getElementById('weatherMap'),
    
    // Chatbot
    chatbotToggle: document.getElementById('chatbotToggle'),
    chatbotWindow: document.getElementById('chatbotWindow'),
    closeChatbot: document.getElementById('closeChatbot'),
    chatMessages: document.getElementById('chatMessages'),
    chatInput: document.getElementById('chatInput'),
    sendChatBtn: document.getElementById('sendChatBtn'),
    voiceChatBtn: document.getElementById('voiceChatBtn'),
    voiceModeBtn: document.getElementById('voiceModeBtn'),
    chatBadge: document.getElementById('chatBadge'),
    
    // Voice
    voiceOverlay: document.getElementById('voiceOverlay'),
    voiceStatus: document.getElementById('voiceStatus'),
    voiceTranscript: document.getElementById('voiceTranscript'),
    closeVoice: document.getElementById('closeVoice')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Load saved preferences
    loadPreferences();
    
    // Load recent searches
    loadRecentSearches();
    
    // Apply theme
    applyTheme();
    
    // Apply language
    applyLanguage();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check user authentication state
    checkUserAuth();
    
    // Initialize weather map
    setTimeout(() => {
        if (typeof initWeatherMap === 'function') {
            initWeatherMap();
        }
    }, 500);
    
    // Load default city weather immediately (no loading screen)
    fetchWeatherData(currentLat, currentLon);
}

// ==========================================
// Preferences Management
// ==========================================

function loadPreferences() {
    const savedLang = localStorage.getItem('weatherwise_lang');
    const savedTheme = localStorage.getItem('weatherwise_theme');
    const savedCity = localStorage.getItem('weatherwise_city');
    
    if (savedLang) {
        currentLang = savedLang;
        elements.languageSelect.value = savedLang;
    }
    
    if (savedTheme) {
        currentTheme = savedTheme;
    }
    
    if (savedCity) {
        currentCity = savedCity;
    }
}

function savePreferences() {
    localStorage.setItem('weatherwise_lang', currentLang);
    localStorage.setItem('weatherwise_theme', currentTheme);
    localStorage.setItem('weatherwise_city', currentCity);
}

// ==========================================
// User Authentication Management
// ==========================================

function checkUserAuth() {
    if (!window.firebase || !firebase.apps.length) {
        updateAuthUI(null);
        return;
    }
    firebase.auth().onAuthStateChanged(updateAuthUI);
}

function updateAuthUI(user) {
    const userDisplayName = document.getElementById('userDisplayName');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userAvatarBtn = document.getElementById('userAvatarBtn');
    
    if (user) {
        // User is logged in
        if (userDisplayName) {
            userDisplayName.textContent = user.displayName || user.email;
        }
        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'flex';
        
        // Update avatar icon
        if (userAvatarBtn) {
            userAvatarBtn.innerHTML = `<span class="user-initial">${(user.displayName || user.email).charAt(0).toUpperCase()}</span>`;
            userAvatarBtn.style.background = 'var(--accent-gradient)';
            userAvatarBtn.style.color = 'white';
            userAvatarBtn.style.fontWeight = '600';
        }
        
    } else {
        // User is not logged in
        if (userDisplayName) {
            userDisplayName.textContent = 'Guest';
        }
        if (loginBtn) loginBtn.style.display = 'flex';
        if (signupBtn) signupBtn.style.display = 'flex';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
    
    if (logoutBtn) {
        logoutBtn.onclick = handleLogout;
    }
}

async function handleLogout() {
    try {
        await firebase.auth().signOut();
        showToast(getTranslations(currentLang).logoutSuccess || 'Logged out successfully!', 'success');
    } catch (error) {
        showToast('Unable to log out. Please try again.', 'error');
    }
}

// ==========================================
// Theme Management
// ==========================================

function applyTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    const icon = elements.themeToggle.querySelector('i');
    icon.className = currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme();
    savePreferences();
}

// ==========================================
// Language Management
// ==========================================

function applyLanguage() {
    const t = getTranslations(currentLang);
    
    // Update all translatable elements
    document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        if (t[key]) {
            el.textContent = t[key];
        }
    });
    
    // Update placeholders
    document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
        const key = el.getAttribute('data-translate-placeholder');
        if (t[key]) {
            el.placeholder = t[key];
        }
    });
    
    // Update HTML lang attribute
    document.documentElement.lang = currentLang;
    
    // Handle RTL languages
    if (currentLang === 'ar') {
        document.documentElement.dir = 'rtl';
    } else {
        document.documentElement.dir = 'ltr';
    }

    updateVoiceLanguage();
    
    // Update weather map translations (layer buttons and legend)
    if (typeof updateMapTranslations === 'function') {
        updateMapTranslations();
    }
}

function changeLanguage(lang) {
    currentLang = lang;
    applyLanguage();
    savePreferences();
    
    // Refresh weather data with new language
    if (currentLat && currentLon) {
        fetchWeatherData(currentLat, currentLon);
    }
}

// ==========================================
// Event Listeners
// ==========================================

function setupEventListeners() {
    // Search
    elements.searchBtn.addEventListener('click', handleSearch);
    elements.citySearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            hideSuggestions();
            handleSearch();
        }
    });
    
    // Autocomplete suggestions
    elements.citySearch.addEventListener('input', handleSearchInput);
    elements.citySearch.addEventListener('keydown', handleSearchKeydown);
    elements.citySearch.addEventListener('focus', () => {
        const query = elements.citySearch.value.trim();
        if (query.length >= 2) {
            showSuggestions(query);
        } else if (recentSearches.length > 0) {
            showSuggestions('');
        }
    });
    
    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-input-wrapper')) {
            hideSuggestions();
        }
    });
    
    // Location
    elements.locationBtn.addEventListener('click', useCurrentLocation);
    
    // Voice Search
    elements.voiceSearchBtn.addEventListener('click', startVoiceSearch);
    
    // Theme Toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Language Select
    elements.languageSelect.addEventListener('change', (e) => {
        changeLanguage(e.target.value);
    });
    
    // Monthly Navigation
    elements.prevMonth.addEventListener('click', () => navigateMonth(-1));
    elements.nextMonth.addEventListener('click', () => navigateMonth(1));
    
    // Map Tabs
    document.querySelectorAll('.map-tab').forEach(tab => {
        tab.addEventListener('click', () => handleMapTabClick(tab));
    });
    
    // Chatbot
    elements.chatbotToggle.addEventListener('click', toggleChatbot);
    elements.closeChatbot.addEventListener('click', closeChatbot);
    elements.sendChatBtn.addEventListener('click', sendChatMessage);
    elements.chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
    elements.voiceChatBtn.addEventListener('click', startVoiceChat);
    elements.voiceModeBtn.addEventListener('click', toggleVoiceMode);
    
    // Quick Questions
    document.querySelectorAll('.quick-q').forEach(btn => {
        btn.addEventListener('click', () => {
            const question = btn.getAttribute('data-question');
            elements.chatInput.value = question;
            sendChatMessage();
        });
    });
    
    // Voice Overlay
    elements.closeVoice.addEventListener('click', closeVoiceOverlay);
}

// ==========================================
// API Functions
// ==========================================

// Country name to code mapping
const countryNameToCode = {
    'india': 'IN', 'usa': 'US', 'united states': 'US', 'america': 'US',
    'uk': 'GB', 'united kingdom': 'GB', 'england': 'GB', 'britain': 'GB',
    'canada': 'CA', 'australia': 'AU', 'germany': 'DE', 'france': 'FR',
    'italy': 'IT', 'spain': 'ES', 'japan': 'JP', 'china': 'CN',
    'brazil': 'BR', 'russia': 'RU', 'mexico': 'MX', 'south korea': 'KR',
    'netherlands': 'NL', 'switzerland': 'CH', 'sweden': 'SE', 'norway': 'NO',
    'denmark': 'DK', 'finland': 'FI', 'ireland': 'IE', 'new zealand': 'NZ',
    'singapore': 'SG', 'malaysia': 'MY', 'thailand': 'TH', 'indonesia': 'ID',
    'philippines': 'PH', 'vietnam': 'VN', 'pakistan': 'PK', 'bangladesh': 'BD',
    'sri lanka': 'LK', 'nepal': 'NP', 'uae': 'AE', 'united arab emirates': 'AE',
    'saudi arabia': 'SA', 'egypt': 'EG', 'south africa': 'ZA', 'nigeria': 'NG',
    'kenya': 'KE', 'argentina': 'AR', 'chile': 'CL', 'colombia': 'CO',
    'peru': 'PE', 'poland': 'PL', 'ukraine': 'UA', 'turkey': 'TR',
    'greece': 'GR', 'portugal': 'PT', 'belgium': 'BE', 'austria': 'AT',
    'czech republic': 'CZ', 'hungary': 'HU', 'israel': 'IL', 'qatar': 'QA'
};

function normalizeSearchQuery(query) {
    // Check if query contains a comma (city, country format)
    if (query.includes(',')) {
        const parts = query.split(',').map(p => p.trim());
        const city = parts[0];
        const countryPart = parts[parts.length - 1].toLowerCase();
        
        // Convert country name to code if needed
        const countryCode = countryNameToCode[countryPart] || countryPart.toUpperCase();
        
        return `${city},${countryCode}`;
    }
    return query;
}

async function searchCity(cityName) {
    try {
        // Normalize the search query
        const normalizedQuery = normalizeSearchQuery(cityName);

        const data = await fetchOpenWeather(
            `${GEO_URL}/direct?q=${encodeURIComponent(normalizedQuery)}&limit=5&appid=${API_KEY}`
        );

        if (data.length === 0) {
            // Try searching with just the city name if the full query failed
            const cityOnly = cityName.split(',')[0].trim();
            const retryData = await fetchOpenWeather(
                `${GEO_URL}/direct?q=${encodeURIComponent(cityOnly)}&limit=5&appid=${API_KEY}`
            );

            if (retryData.length === 0) {
                throw createWeatherError('CITY_NOT_FOUND', 'City not found');
            }

            return {
                lat: retryData[0].lat,
                lon: retryData[0].lon,
                name: retryData[0].name,
                country: retryData[0].country
            };
        }
        
        return {
            lat: data[0].lat,
            lon: data[0].lon,
            name: data[0].name,
            country: data[0].country
        };
    } catch (error) {
        throw error;
    }
}

async function fetchWeatherData(lat, lon) {
    showLoading();

    try {
        // Get OWM API language code (some languages like Tamil are not supported)
        const apiLang = typeof getOwmLangCode === 'function' ? getOwmLangCode(currentLang) : currentLang;
        
        const data = await WeatherUtils.fetchWeatherData(lat, lon, { apiKey: API_KEY, language: apiLang });
        weatherData = data.current;
        forecastData = data.forecast;
        saveLastWeather(data);

        // Update UI
        updateCurrentWeather();
        updateHourlyForecast();
        updateWeeklyForecast();
        updateMonthlyCalendar();
        updateAIPrediction();
        updateWeatherMap('temp');
        
        hideLoading();
        
        return true;
    } catch (error) {
        console.error('Error fetching weather data:', error);
        hideLoading();
        if (!restoreLastWeather()) {
            showWeatherError(error);
        }
        return false;
    }
}

function saveLastWeather(data) {
    try {
        localStorage.setItem(LAST_WEATHER_STORAGE_KEY, JSON.stringify({
            current: data.current,
            forecast: data.forecast,
            city: currentCity,
            lat: currentLat,
            lon: currentLon,
            savedAt: Date.now()
        }));
    } catch (error) {
        console.warn('Unable to save the last weather response.', error);
    }
}

function restoreLastWeather() {
    try {
        const saved = JSON.parse(localStorage.getItem(LAST_WEATHER_STORAGE_KEY));
        if (!saved?.current || !saved?.forecast) return false;

        weatherData = saved.current;
        forecastData = saved.forecast;
        currentCity = saved.city || currentCity;
        currentLat = saved.lat ?? currentLat;
        currentLon = saved.lon ?? currentLon;
        updateCurrentWeather();
        updateHourlyForecast();
        updateWeeklyForecast();
        updateMonthlyCalendar();
        updateAIPrediction();
        showToast('Showing your last saved forecast while offline.', 'info');
        return true;
    } catch (error) {
        console.warn('Unable to restore the last weather response.', error);
        return false;
    }
}

function createWeatherError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
}

async function fetchOpenWeather(url) {
    if (!API_KEY) {
        throw createWeatherError('INVALID_API_KEY', 'OpenWeatherMap API key is missing.');
    }

    let response;
    try {
        response = await fetch(url);
    } catch (error) {
        throw createWeatherError('NETWORK_ERROR', 'Unable to connect to OpenWeatherMap.');
    }

    let data = null;
    try {
        data = await response.json();
    } catch (error) {
        data = null;
    }

    if (!response.ok || (data && Number(data.cod) >= 400)) {
        if (response.status === 401) {
            throw createWeatherError('INVALID_API_KEY', 'OpenWeatherMap rejected the API key.');
        }
        if (Number(data?.cod) === 401) {
            throw createWeatherError('INVALID_API_KEY', 'OpenWeatherMap rejected the API key.');
        }
        if (response.status === 404) {
            throw createWeatherError('CITY_NOT_FOUND', 'City not found.');
        }
        if (Number(data?.cod) === 404) {
            throw createWeatherError('CITY_NOT_FOUND', 'City not found.');
        }
        throw createWeatherError('API_ERROR', data?.message || 'OpenWeatherMap is temporarily unavailable.');
    }

    if (!data) {
        throw createWeatherError('API_ERROR', 'OpenWeatherMap returned an invalid response.');
    }

    return data;
}

function showWeatherError(error) {
    weatherData = null;
    forecastData = null;
    elements.cityName.textContent = 'Weather unavailable';
    elements.currentDate.textContent = '';
    elements.weatherIcon.removeAttribute('src');
    elements.currentTemp.textContent = '--°';
    elements.weatherDescription.textContent = '--';
    elements.feelsLike.textContent = '--°';
    elements.humidity.textContent = '--%';
    elements.windSpeed.textContent = '-- km/h';
    elements.visibility.textContent = '-- km';
    elements.pressure.textContent = '-- hPa';
    elements.uvIndex.textContent = '--';
    elements.sunrise.textContent = '--:--';
    elements.sunset.textContent = '--:--';
    elements.weeklyForecast.innerHTML = '';
    elements.hourlyForecast.innerHTML = '';
    elements.monthlyCalendar.innerHTML = '';
    elements.weatherTrends.textContent = 'Weather insights are unavailable right now.';
    elements.aiRecommendations.innerHTML = '';

    const messages = {
        CITY_NOT_FOUND: 'We could not find that city. Check the spelling and try again.',
        INVALID_API_KEY: 'Weather service setup is incomplete. Please check the OpenWeatherMap API key.',
        NETWORK_ERROR: 'We could not reach the weather service. Check your connection and try again.',
        API_ERROR: 'The weather service is temporarily unavailable. Please try again shortly.'
    };
    showToast(messages[error.code] || messages.API_ERROR, 'error');
}

// ==========================================
// UI Update Functions
// ==========================================

function updateCurrentWeather() {
    if (!weatherData) return;
    
    const t = getTranslations(currentLang);
    
    // City name and date - Use the searched city name if available, otherwise use API response
    const displayCity = currentCity || weatherData.name;
    const translatedCity = getCityName(displayCity, currentLang);
    elements.cityName.textContent = `${translatedCity}, ${weatherData.sys.country}`;
    savePreferences();
    
    // Format date
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    elements.currentDate.textContent = now.toLocaleDateString(getLangCode(), options);
    
    // Weather icon
    const iconCode = weatherData.weather[0].icon;
    elements.weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
    elements.weatherIcon.alt = weatherData.weather[0].description;
    
    // Temperature
    elements.currentTemp.textContent = `${Math.round(weatherData.main.temp)}°C`;
    
    // Translate weather description for unsupported languages
    let weatherDesc = weatherData.weather[0].description;
    if (typeof getWeatherDescription === 'function') {
        weatherDesc = getWeatherDescription(weatherDesc, currentLang);
    }
    elements.weatherDescription.textContent = weatherDesc;
    
    // Details
    elements.feelsLike.textContent = `${Math.round(weatherData.main.feels_like)}°C`;
    elements.humidity.textContent = `${weatherData.main.humidity}%`;
    elements.windSpeed.textContent = `${Math.round(weatherData.wind.speed * 3.6)} km/h`;
    elements.visibility.textContent = `${(weatherData.visibility / 1000).toFixed(1)} km`;
    elements.pressure.textContent = `${weatherData.main.pressure} hPa`;
    
    // UV Index (estimated based on conditions)
    const uvEstimate = estimateUVIndex(weatherData);
    elements.uvIndex.textContent = uvEstimate;
    
    // Sunrise/Sunset
    const sunriseTime = new Date(weatherData.sys.sunrise * 1000);
    const sunsetTime = new Date(weatherData.sys.sunset * 1000);
    elements.sunrise.textContent = sunriseTime.toLocaleTimeString(getLangCode(), { hour: '2-digit', minute: '2-digit' });
    elements.sunset.textContent = sunsetTime.toLocaleTimeString(getLangCode(), { hour: '2-digit', minute: '2-digit' });
}

function updateHourlyForecast() {
    if (!forecastData) return;
    
    const t = getTranslations(currentLang);
    elements.hourlyForecast.innerHTML = '';
    
    // Get next 24 hours (8 * 3-hour intervals)
    const hourlyItems = forecastData.list.slice(0, 8);
    
    hourlyItems.forEach((item, index) => {
        const time = new Date(item.dt * 1000);
        const isNow = index === 0;
        
        // Translate weather description for unsupported languages
        let hourlyDesc = item.weather[0].description;
        if (typeof getWeatherDescription === 'function') {
            hourlyDesc = getWeatherDescription(hourlyDesc, currentLang);
        }
        
        const hourlyItem = document.createElement('div');
        hourlyItem.className = `hourly-item ${isNow ? 'now' : ''}`;
        hourlyItem.innerHTML = `
            <div class="hourly-time">${isNow ? t.now : time.toLocaleTimeString(getLangCode(), { hour: '2-digit', minute: '2-digit' })}</div>
            <img class="hourly-icon" src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" alt="${hourlyDesc}">
            <div class="hourly-temp">${Math.round(item.main.temp)}°</div>
        `;
        elements.hourlyForecast.appendChild(hourlyItem);
    });
}

function updateWeeklyForecast() {
    if (!forecastData) return;
    
    const t = getTranslations(currentLang);
    elements.weeklyForecast.innerHTML = '';
    
    // Group forecast by day
    const dailyData = {};
    forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000).toDateString();
        if (!dailyData[date]) {
            dailyData[date] = {
                temps: [],
                icons: [],
                descriptions: [],
                date: new Date(item.dt * 1000)
            };
        }
        dailyData[date].temps.push(item.main.temp);
        dailyData[date].icons.push(item.weather[0].icon);
        dailyData[date].descriptions.push(item.weather[0].description);
    });
    
    // Get unique days
    const days = Object.values(dailyData).slice(0, 7);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const shortDayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    
    days.forEach((day, index) => {
        const maxTemp = Math.round(Math.max(...day.temps));
        const minTemp = Math.round(Math.min(...day.temps));
        
        // Get most common icon
        const iconCounts = {};
        day.icons.forEach(icon => {
            iconCounts[icon] = (iconCounts[icon] || 0) + 1;
        });
        const mainIcon = Object.keys(iconCounts).reduce((a, b) => iconCounts[a] > iconCounts[b] ? a : b);
        
        const dayName = index === 0 ? t.today : t[dayNames[day.date.getDay()]];
        const shortDay = t[shortDayNames[day.date.getDay()]];
        
        // Translate weather description for unsupported languages
        let forecastDesc = day.descriptions[0];
        if (typeof getWeatherDescription === 'function') {
            forecastDesc = getWeatherDescription(forecastDesc, currentLang);
        }
        
        const card = document.createElement('div');
        card.className = `forecast-card ${index === 0 ? 'today' : ''}`;
        card.innerHTML = `
            <div class="forecast-day">${dayName}</div>
            <div class="forecast-date">${day.date.getDate()}/${day.date.getMonth() + 1}</div>
            <img class="forecast-icon" src="https://openweathermap.org/img/wn/${mainIcon}@2x.png" alt="Weather">
            <div class="forecast-temp">
                <span class="temp-high">${maxTemp}°</span>
                <span class="temp-low">${minTemp}°</span>
            </div>
            <div class="forecast-condition">${forecastDesc}</div>
        `;
        elements.weeklyForecast.appendChild(card);
    });
}

function updateMonthlyCalendar() {
    const t = getTranslations(currentLang);
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                        'july', 'august', 'september', 'october', 'november', 'december'];
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    
    // Update month display
    elements.currentMonth.textContent = `${t[monthNames[currentMonth]]} ${currentYear}`;
    
    // Clear calendar
    elements.monthlyCalendar.innerHTML = '';
    
    // Add day headers
    dayNames.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.textContent = t[day];
        elements.monthlyCalendar.appendChild(header);
    });
    
    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();
    
    // Add empty cells for days before first of month
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        elements.monthlyCalendar.appendChild(emptyDay);
    }
    
    // Generate weather data for the month (simulated for past/future dates)
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const isToday = date.toDateString() === today.toDateString();
        
        const forecastWeather = getForecastWeatherForDate(date);
        
        const dayCell = document.createElement('div');
        dayCell.className = `calendar-day ${isToday ? 'today' : ''}`;
        dayCell.innerHTML = `
            <div class="day-number">${day}</div>
            <img class="day-icon" src="https://openweathermap.org/img/wn/${forecastWeather?.icon || '01d'}@2x.png" alt="Weather">
            <div class="day-temp">${forecastWeather ? `${forecastWeather.high}°/${forecastWeather.low}°` : '--/--'}</div>
        `;
        elements.monthlyCalendar.appendChild(dayCell);
    }
    
    // Update monthly summary
    updateMonthlySummary();
}

function updateMonthlySummary() {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    let totalHigh = 0, totalLow = 0, rainy = 0, sunny = 0;
    let forecastDays = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const weather = getForecastWeatherForDate(date);
        if (!weather) continue;

        forecastDays++;
        totalHigh += weather.high;
        totalLow += weather.low;
        if (weather.isRainy) rainy++;
        if (weather.isSunny) sunny++;
    }
    
    elements.avgHighTemp.textContent = forecastDays ? `${Math.round(totalHigh / forecastDays)}°C` : '--';
    elements.avgLowTemp.textContent = forecastDays ? `${Math.round(totalLow / forecastDays)}°C` : '--';
    elements.rainyDays.textContent = forecastDays ? rainy : '--';
    elements.sunnyDays.textContent = forecastDays ? sunny : '--';
}

function getForecastWeatherForDate(date) {
    if (!forecastData?.list?.length) return null;

    const matchingItems = forecastData.list.filter(item => {
        return new Date(item.dt * 1000).toDateString() === date.toDateString();
    });
    if (!matchingItems.length) return null;

    const conditionCounts = {};
    matchingItems.forEach(item => {
        const condition = item.weather[0];
        const key = condition.id;
        if (!conditionCounts[key]) {
            conditionCounts[key] = { count: 0, icon: item.weather[0].icon };
        }
        conditionCounts[key].count++;
    });
    const dominantCondition = Object.values(conditionCounts)
        .sort((a, b) => b.count - a.count)[0];
    const rainProbability = Math.max(...matchingItems.map(item => item.pop || 0));
    const mainConditions = matchingItems.map(item => item.weather[0].main.toLowerCase());

    return {
        high: Math.round(Math.max(...matchingItems.map(item => item.main.temp))),
        low: Math.round(Math.min(...matchingItems.map(item => item.main.temp))),
        icon: dominantCondition.icon,
        isRainy: rainProbability >= 0.4 || mainConditions.some(condition => ['rain', 'drizzle', 'thunderstorm'].includes(condition)),
        isSunny: mainConditions.some(condition => condition === 'clear')
    };
}

function navigateMonth(direction) {
    currentMonth += direction;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    updateMonthlyCalendar();
}

// ==========================================
// AI Prediction Functions
// ==========================================

function updateAIPrediction() {
    if (!weatherData || !forecastData) return;
    
    const t = getTranslations(currentLang);
    
    // Generate extended forecast (2 weeks)
    generateExtendedForecast();
    
    // Generate weather trends analysis
    generateWeatherTrends();
    
    // Generate weather alerts
    generateWeatherAlerts();
    
    // Generate recommendations
    generateRecommendations();
}

function generateExtendedForecast() {
    elements.extendedForecast.innerHTML = '';

    const dailyForecasts = getDailyForecastSummaries();
    dailyForecasts.forEach(({ date, high, low, icon }) => {
        
        const dayEl = document.createElement('div');
        dayEl.className = 'extended-day';
        dayEl.innerHTML = `
            <div class="ext-date">${date.getDate()}/${date.getMonth() + 1}</div>
            <img class="ext-icon" src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="Weather">
            <div class="ext-temp">${high}°/${low}°</div>
        `;
        elements.extendedForecast.appendChild(dayEl);
    });
}

function generateWeatherTrends() {
    elements.weatherTrends.textContent = generateForecastInsight();
}

function getDailyForecastSummaries() {
    return WeatherUtils.parseForecastData(forecastData);
}

function generateForecastInsight() {
    const t = getTranslations(currentLang);
    const dailyForecasts = getDailyForecastSummaries();
    const today = dailyForecasts[0];
    const tomorrow = dailyForecasts[1];
    if (!today || !tomorrow) {
        return t.weatherGood;
    }

    const temperatureDifference = tomorrow.high - today.high;
    const temperatureTrend = temperatureDifference >= 2
        ? 'warmer'
        : temperatureDifference <= -2
            ? 'cooler'
            : 'similar';
    const condition = tomorrow.description.charAt(0).toLowerCase() + tomorrow.description.slice(1);

    if (tomorrow.rainChance - today.rainChance >= 20) {
        return `Tomorrow is likely ${temperatureTrend} with a higher chance of rain (${tomorrow.rainChance}%).`;
    }

    return temperatureTrend === 'similar'
        ? `Tomorrow looks similar, with ${condition}.`
        : `Tomorrow is likely ${temperatureTrend} with ${condition}.`;
}

function generateWeatherAlerts() {
    const t = getTranslations(currentLang);
    const alerts = [];
    
    const temp = weatherData.main.temp;
    const wind = weatherData.wind.speed;
    const description = weatherData.weather[0].main.toLowerCase();
    
    // Temperature alerts
    if (temp > 35) {
        alerts.push({ type: 'danger', icon: 'fa-temperature-high', message: 'Extreme heat warning! Stay hydrated and avoid prolonged sun exposure.' });
    } else if (temp < 0) {
        alerts.push({ type: 'warning', icon: 'fa-temperature-low', message: 'Freezing temperatures! Watch out for ice and dress warmly.' });
    }
    
    // Wind alerts
    if (wind > 15) {
        alerts.push({ type: 'warning', icon: 'fa-wind', message: 'Strong winds expected. Secure loose objects outdoors.' });
    }
    
    // Storm alerts
    if (description.includes('thunder') || description.includes('storm')) {
        alerts.push({ type: 'danger', icon: 'fa-bolt', message: 'Thunderstorm warning! Stay indoors and away from windows.' });
    }
    
    // Rain alerts
    if (description.includes('rain') || description.includes('drizzle')) {
        alerts.push({ type: 'info', icon: 'fa-umbrella', message: 'Rain expected. Don\'t forget your umbrella!' });
    }
    
    if (alerts.length === 0) {
        elements.weatherAlerts.innerHTML = `<p>${t.noAlerts}</p>`;
    } else {
        elements.weatherAlerts.innerHTML = alerts.map(alert => `
            <div class="alert-item ${alert.type}">
                <i class="fas ${alert.icon}"></i>
                <span>${alert.message}</span>
            </div>
        `).join('');
    }
}

function generateRecommendations() {
    const t = getTranslations(currentLang);
    const recommendations = [];
    
    const temp = weatherData.main.temp;
    const description = weatherData.weather[0].main.toLowerCase();
    const humidity = weatherData.main.humidity;
    
    // Clothing recommendations
    if (temp < 10) {
        recommendations.push({ icon: 'fa-jacket', message: t.wearCold });
    } else if (temp > 28) {
        recommendations.push({ icon: 'fa-shirt', message: t.wearHot });
    } else if (description.includes('rain')) {
        recommendations.push({ icon: 'fa-umbrella', message: t.wearRain });
    } else {
        recommendations.push({ icon: 'fa-shirt', message: t.wearMild });
    }
    
    // Activity recommendations
    if (temp >= 15 && temp <= 28 && !description.includes('rain')) {
        recommendations.push({ icon: 'fa-person-walking', message: t.outdoorActivities || 'Great weather for outdoor activities!' });
    }
    
    // Health recommendations
    if (temp > 30 || humidity > 80) {
        recommendations.push({ icon: 'fa-bottle-water', message: t.stayHydrated || 'Stay hydrated! Drink plenty of water.' });
    }
    
    // UV recommendations
    if (description.includes('clear') || description.includes('sun')) {
        recommendations.push({ icon: 'fa-sun', message: t.wearSunscreen || 'Don\'t forget sunscreen if going outdoors!' });
    }
    
    elements.aiRecommendations.innerHTML = recommendations.map(rec => `
        <div class="recommendation-item">
            <i class="fas ${rec.icon}"></i>
            <span>${rec.message}</span>
        </div>
    `).join('');
}

// ==========================================
// Weather Map Functions
// ==========================================

function handleMapTabClick(tab) {
    document.querySelectorAll('.map-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    const mapType = tab.getAttribute('data-map');
    updateWeatherMap(mapType);
}

function updateWeatherMap(type) {
    if (!elements.weatherMap) return;

    const layerMap = {
        'temp': 'temp_new',
        'precipitation': 'precipitation_new',
        'clouds': 'clouds_new',
        'wind': 'wind_new'
    };
    
    const layer = layerMap[type] || 'temp_new';
    const zoom = 5;
    const x = Math.floor((currentLon + 180) / 360 * Math.pow(2, zoom));
    const y = Math.floor((1 - Math.log(Math.tan(currentLat * Math.PI / 180) + 1 / Math.cos(currentLat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    
    elements.weatherMap.src = `https://tile.openweathermap.org/map/${layer}/${zoom}/${x}/${y}.png?appid=${API_KEY}`;
}

// ==========================================
// Search Functions
// ==========================================

async function handleSearch() {
    const query = elements.citySearch.value.trim();
    if (!query) return;
    
    hideSuggestions();
    
    try {
        showLoading();
        const location = await searchCity(query);
        currentLat = location.lat;
        currentLon = location.lon;
        currentCity = location.name;
        
        // Save to recent searches
        saveRecentSearch({
            name: location.name,
            country: location.country,
            lat: location.lat,
            lon: location.lon
        });
        
        await fetchWeatherData(currentLat, currentLon);
    } catch (error) {
        hideLoading();
        showWeatherError(error);
    }
}

// ==========================================
// Autocomplete Suggestions Functions
// ==========================================

function handleSearchInput(e) {
    const query = e.target.value.trim();
    
    if (query.length >= 2) {
        showSuggestions(query);
    } else if (query.length === 0 && recentSearches.length > 0) {
        showSuggestions('');
    } else {
        hideSuggestions();
    }
}

function handleSearchKeydown(e) {
    if (!elements.suggestionsContainer.classList.contains('active')) return;
    
    const items = elements.suggestionsList.querySelectorAll('.suggestion-item');
    
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            highlightedSuggestionIndex = Math.min(highlightedSuggestionIndex + 1, items.length - 1);
            updateHighlight(items);
            break;
            
        case 'ArrowUp':
            e.preventDefault();
            highlightedSuggestionIndex = Math.max(highlightedSuggestionIndex - 1, 0);
            updateHighlight(items);
            break;
            
        case 'Enter':
            e.preventDefault();
            if (highlightedSuggestionIndex >= 0 && currentSuggestions[highlightedSuggestionIndex]) {
                selectSuggestion(currentSuggestions[highlightedSuggestionIndex]);
            } else {
                hideSuggestions();
                handleSearch();
            }
            break;
            
        case 'Escape':
            hideSuggestions();
            break;
    }
}

function updateHighlight(items) {
    items.forEach((item, index) => {
        if (index === highlightedSuggestionIndex) {
            item.classList.add('highlighted');
            item.scrollIntoView({ block: 'nearest' });
        } else {
            item.classList.remove('highlighted');
        }
    });
}

function showSuggestions(query) {
    const results = searchCities(query);
    currentSuggestions = results;
    highlightedSuggestionIndex = -1;
    
    let html = '';
    
    // Show recent searches if no query or short query
    if (query.length < 2 && recentSearches.length > 0) {
        html += `<li class="suggestions-header"><i class="fas fa-history"></i> Recent Searches</li>`;
        html += recentSearches.map((item, index) => `
            <li class="suggestion-item recent-item" data-recent-index="${index}">
                <i class="fas fa-history"></i>
                <div class="suggestion-text">
                    <span class="suggestion-main">${getCityName(item.name, currentLang)}</span>
                    <span class="suggestion-sub">${item.country}</span>
                </div>
                <button class="remove-recent" data-index="${index}" title="Remove">
                    <i class="fas fa-times"></i>
                </button>
            </li>
        `).join('');
        elements.suggestionsList.innerHTML = html;
        addRecentSearchHandlers();
        elements.suggestionsContainer.classList.add('active');
        return;
    }
    
    if (results.length === 0) {
        // Show recent searches even when no results found
        if (recentSearches.length > 0) {
            html += `<li class="no-suggestions">
                <i class="fas fa-search"></i>
                <span>No cities found for "${query}"</span>
            </li>`;
            html += `<li class="suggestions-header"><i class="fas fa-history"></i> Recent Searches</li>`;
            html += recentSearches.map((item, index) => `
                <li class="suggestion-item recent-item" data-recent-index="${index}">
                    <i class="fas fa-history"></i>
                    <div class="suggestion-text">
                        <span class="suggestion-main">${getCityName(item.name, currentLang)}</span>
                        <span class="suggestion-sub">${item.country}</span>
                    </div>
                    <button class="remove-recent" data-index="${index}" title="Remove">
                        <i class="fas fa-times"></i>
                    </button>
                </li>
            `).join('');
            elements.suggestionsList.innerHTML = html;
            addRecentSearchHandlers();
        } else {
            elements.suggestionsList.innerHTML = `
                <li class="no-suggestions">
                    <i class="fas fa-search"></i>
                    <span>No cities found. Try a different search.</span>
                </li>
            `;
        }
    } else {
        elements.suggestionsList.innerHTML = results.map((item, index) => {
            const parts = item.display.split(', ');
            const mainText = parts[0];
            const subText = parts.slice(1).join(', ');
            const icon = item.type === 'state' ? 'fa-map' : 'fa-city';
            
            return `
                <li class="suggestion-item" data-index="${index}">
                    <i class="fas ${icon}"></i>
                    <div class="suggestion-text">
                        <span class="suggestion-main">${highlightMatch(mainText, query)}</span>
                        <span class="suggestion-sub">${subText}</span>
                    </div>
                    <span class="suggestion-type">${item.type}</span>
                </li>
            `;
        }).join('');
        
        // Add click handlers to suggestion items
        elements.suggestionsList.querySelectorAll('.suggestion-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                selectSuggestion(currentSuggestions[index]);
            });
            
            item.addEventListener('mouseenter', () => {
                highlightedSuggestionIndex = index;
                updateHighlight(elements.suggestionsList.querySelectorAll('.suggestion-item'));
            });
        });
    }
    
    elements.suggestionsContainer.classList.add('active');
}

function hideSuggestions() {
    elements.suggestionsContainer.classList.remove('active');
    highlightedSuggestionIndex = -1;
    currentSuggestions = [];
}

function selectSuggestion(suggestion) {
    elements.citySearch.value = suggestion.searchTerm;
    hideSuggestions();
    handleSearch();
}

function highlightMatch(text, query) {
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<strong>$1</strong>');
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ==========================================
// Recent Searches Functions
// ==========================================

function loadRecentSearches() {
    try {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            recentSearches = JSON.parse(saved);
        }
    } catch (e) {
        console.error('Error loading recent searches:', e);
        recentSearches = [];
    }
}

function saveRecentSearch(cityData) {
    // Check if already exists
    const existingIndex = recentSearches.findIndex(
        item => item.name.toLowerCase() === cityData.name.toLowerCase() && 
                item.country === cityData.country
    );
    
    // Remove if exists (to move to top)
    if (existingIndex !== -1) {
        recentSearches.splice(existingIndex, 1);
    }
    
    // Add to beginning
    recentSearches.unshift({
        name: cityData.name,
        country: cityData.country,
        lat: cityData.lat,
        lon: cityData.lon
    });
    
    // Keep only last MAX_RECENT_SEARCHES
    if (recentSearches.length > MAX_RECENT_SEARCHES) {
        recentSearches = recentSearches.slice(0, MAX_RECENT_SEARCHES);
    }
    
    // Save to localStorage
    try {
        localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    } catch (e) {
        console.error('Error saving recent searches:', e);
    }
}

function removeRecentSearch(index) {
    recentSearches.splice(index, 1);
    try {
        localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    } catch (e) {
        console.error('Error saving recent searches:', e);
    }
    // Refresh suggestions
    showSuggestions(elements.citySearch.value.trim());
}

function addRecentSearchHandlers() {
    // Add click handlers for recent items
    elements.suggestionsList.querySelectorAll('.recent-item').forEach((item) => {
        item.addEventListener('click', (e) => {
            // Don't trigger if clicking remove button
            if (e.target.closest('.remove-recent')) return;
            
            const index = parseInt(item.dataset.recentIndex);
            const recentCity = recentSearches[index];
            if (recentCity) {
                elements.citySearch.value = recentCity.name;
                hideSuggestions();
                currentLat = recentCity.lat;
                currentLon = recentCity.lon;
                currentCity = recentCity.name;
                fetchWeatherData(currentLat, currentLon);
            }
        });
    });
    
    // Add click handlers for remove buttons
    elements.suggestionsList.querySelectorAll('.remove-recent').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            removeRecentSearch(index);
        });
    });
}

async function useCurrentLocation() {
    try {
        const position = await getUserLocation({ timeout: 10000 });
        currentLat = position.coords.latitude;
        currentLon = position.coords.longitude;
        await fetchWeatherData(currentLat, currentLon);
        showToast(getTranslations(currentLang).successLocation, 'success');
    } catch (error) {
        // Silently fail - user can search manually
        console.log('Location access denied or unavailable');
    }
}

// ==========================================
// Voice Recognition Functions
// ==========================================

let recognition = null;

function getSpeechLanguage() {
    return speechLangCodes[currentLang] || 'en-US';
}

function updateVoiceLanguage() {
    if (recognition) {
        recognition.lang = getSpeechLanguage();
    }
}

function initVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = getSpeechLanguage();
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            elements.voiceTranscript.textContent = transcript;
            
            if (event.results[0].isFinal) {
                handleVoiceResult(transcript);
            }
        };
        
        recognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
            if (event.error === 'language-not-supported') {
                showToast(getTranslations(currentLang).voiceNotSupported, 'warning');
            }
            closeVoiceOverlay();
        };
        
        recognition.onend = () => {
            closeVoiceOverlay();
        };
        
        return true;
    }
    return false;
}

function startVoiceSearch() {
    if (!initVoiceRecognition()) {
        showToast(getTranslations(currentLang).voiceNotSupported, 'warning');
        return;
    }
    
    elements.voiceOverlay.classList.add('active');
    elements.voiceTranscript.textContent = '';
    recognition.start();
}

function startVoiceChat() {
    if (!initVoiceRecognition()) {
        showToast(getTranslations(currentLang).voiceNotSupported, 'warning');
        return;
    }
    
    elements.voiceOverlay.classList.add('active');
    elements.voiceTranscript.textContent = '';
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        elements.voiceTranscript.textContent = transcript;
        
        if (event.results[0].isFinal) {
            closeVoiceOverlay();
            elements.chatInput.value = transcript;
            sendChatMessage();
        }
    };
    
    recognition.start();
}

function handleVoiceResult(transcript) {
    closeVoiceOverlay();
    elements.citySearch.value = transcript;
    handleSearch();
}

function closeVoiceOverlay() {
    elements.voiceOverlay.classList.remove('active');
    if (recognition) {
        recognition.stop();
    }
}

// ==========================================
// Text-to-Speech Functions
// ==========================================

function getSpeechVoice(language) {
    if (!('speechSynthesis' in window)) return null;

    const voices = speechSynthesis.getVoices();
    const normalizedLanguage = language.toLowerCase().replace('_', '-');
    const baseLanguage = normalizedLanguage.split('-')[0];

    return voices.find(voice => voice.lang.toLowerCase().replace('_', '-') === normalizedLanguage)
        || voices.find(voice => voice.lang.toLowerCase().replace('_', '-').split('-')[0] === baseLanguage)
        || null;
}

function createSpeechUtterance(text) {
    const language = getSpeechLanguage();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getSpeechVoice(language);

    utterance.lang = language;
    if (voice) {
        utterance.voice = voice;
    }
    utterance.rate = 0.9;
    utterance.pitch = 1;

    return utterance;
}

function speakMessage(button) {
    if (!('speechSynthesis' in window)) {
        showToast(getTranslations(currentLang).speakNotSupported, 'warning');
        return;
    }
    
    const messageContent = button.parentElement.querySelector('p');
    const text = messageContent.textContent;
    
    speechSynthesis.speak(createSpeechUtterance(text));
}

function speakText(text) {
    if (!('speechSynthesis' in window)) return;
    
    speechSynthesis.speak(createSpeechUtterance(text));
}

function toggleVoiceMode() {
    voiceMode = !voiceMode;
    elements.voiceModeBtn.classList.toggle('active', voiceMode);
    
    if (voiceMode) {
        showToast('Voice mode enabled - I will speak responses', 'info');
    }
}

// ==========================================
// Chatbot Functions
// ==========================================

function formatWeatherContext() {
    if (!weatherData || !forecastData?.list?.length) return 'No live weather data is available.';

    const current = weatherData.weather?.[0];
    const dailyForecasts = getDailyForecastSummaries().slice(0, 5);
    const forecast = dailyForecasts.map(day => `${day.date.toDateString()}: ${day.low}-${day.high}°C, ${day.description}, rain chance ${day.rainChance}%`).join('\n');

    return [
        `Location: ${weatherData.name || currentCity}, ${weatherData.sys?.country || ''}`,
        `Current: ${Math.round(weatherData.main.temp)}°C, feels like ${Math.round(weatherData.main.feels_like)}°C, ${current?.description || 'unknown conditions'}`,
        `Humidity: ${weatherData.main.humidity}%, wind: ${Math.round((weatherData.wind?.speed || 0) * 3.6)} km/h`,
        'Forecast:',
        forecast
    ].join('\n');
}

function toggleChatbot() {
    elements.chatbotWindow.classList.toggle('active');
    elements.chatBadge.style.display = 'none';
}

function closeChatbot() {
    elements.chatbotWindow.classList.remove('active');
}

async function sendChatMessage() {
    if (chatRequestInProgress) return;

    const message = elements.chatInput.value.trim();
    if (!message) return;
    
    // Add user message
    addChatMessage(message, 'user');
    elements.chatInput.value = '';

    if (!weatherData || !forecastData?.list?.length) {
        addChatMessage('Weather data is still loading. Please wait a moment and try again.', 'bot');
        return;
    }

    chatRequestInProgress = true;
    elements.sendChatBtn.disabled = true;
    elements.chatInput.disabled = true;
    const loadingMessage = addChatMessage('Thinking', 'bot', true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CHAT_REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(CHAT_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                weatherContext: formatWeatherContext()
            }),
            signal: controller.signal
        });

        let data;
        try {
            data = await response.json();
        } catch {
            throw new Error('invalid-response');
        }

        if (!response.ok) {
            throw new Error(data.error || 'service-error');
        }

        const answer = data.answer?.trim();
        if (!answer) throw new Error('invalid-response');

        loadingMessage.remove();
        addChatMessage(answer, 'bot');
        if (voiceMode) speakText(answer);
    } catch (error) {
        loadingMessage.remove();
        const errorMessages = {
            aborted: 'The AI assistant took too long to respond. Please try again.',
            'invalid-response': 'The AI assistant returned an invalid response. Please try again.',
            'rate-limited': 'The AI assistant is busy right now. Please wait a moment and try again.',
            'invalid-api-key': 'The AI assistant is temporarily unavailable. Please try again later.',
            'service-error': 'The AI assistant is temporarily unavailable. Please try again later.',
            'network-error': 'I could not reach the AI assistant. Check your connection and try again.'
        };
        const errorCode = error.name === 'AbortError' ? 'aborted' : error.message;
        addChatMessage(errorMessages[errorCode] || errorMessages['network-error'], 'bot');
    } finally {
        clearTimeout(timeoutId);
        chatRequestInProgress = false;
        elements.sendChatBtn.disabled = false;
        elements.chatInput.disabled = false;
        elements.chatInput.focus();
    }
}

function addChatMessage(message, type, isLoading = false) {
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${type}-message${isLoading ? ' loading-message' : ''}`;
    messageEl.innerHTML = `<div class="message-avatar"><i class="fas fa-${type === 'bot' ? 'robot' : 'user'}"></i></div>`;

    const content = document.createElement('div');
    content.className = 'message-content';
    const paragraph = document.createElement('p');
    paragraph.textContent = message;
    content.appendChild(paragraph);

    if (type === 'bot' && !isLoading) {
        const speakButton = document.createElement('button');
        speakButton.className = 'speak-btn';
        speakButton.title = 'Read aloud';
        speakButton.innerHTML = '<i class="fas fa-volume-up"></i>';
        speakButton.addEventListener('click', () => speakMessage(speakButton));
        content.appendChild(speakButton);
    }

    messageEl.appendChild(content);
    elements.chatMessages.appendChild(messageEl);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    return messageEl;
}

// ==========================================
// Utility Functions
// ==========================================

function getLangCode() {
    const langCodes = {
        en: 'en-US',
        es: 'es-ES',
        fr: 'fr-FR',
        de: 'de-DE',
        hi: 'hi-IN',
        ta: 'ta-IN',
        zh: 'zh-CN',
        ar: 'ar-SA',
        pt: 'pt-BR',
        ja: 'ja-JP'
    };
    return langCodes[currentLang] || 'en-US';
}

function estimateUVIndex(data) {
    const clouds = data.clouds.all;
    const hour = new Date().getHours();
    const t = getTranslations(currentLang);
    
    // Base UV based on time of day
    let baseUV;
    if (hour < 6 || hour > 20) baseUV = 0;
    else if (hour < 8 || hour > 18) baseUV = 2;
    else if (hour < 10 || hour > 16) baseUV = 5;
    else baseUV = 8;
    
    // Adjust for clouds
    const cloudFactor = 1 - (clouds / 100) * 0.5;
    const uv = Math.round(baseUV * cloudFactor);
    
    if (uv <= 2) return `${uv} (${t.uvLow || 'Low'})`;
    if (uv <= 5) return `${uv} (${t.uvModerate || 'Moderate'})`;
    if (uv <= 7) return `${uv} (${t.uvHigh || 'High'})`;
    if (uv <= 10) return `${uv} (${t.uvVeryHigh || 'Very High'})`;
    return `${uv} (${t.uvExtreme || 'Extreme'})`;
}

function showLoading() {
    elements.loadingOverlay.classList.add('active');
}

function hideLoading() {
    elements.loadingOverlay.classList.remove('active');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Make speakMessage globally available
window.speakMessage = speakMessage;
