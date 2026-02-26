// app.js - Main Application Logic for WeatherWise

// API Configuration
const API_KEY = '56557251d5db2189c685db5c677e77a9';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0';

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
const MAX_RECENT_SEARCHES = 5;

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
    // Check localStorage and sessionStorage for logged in user
    let user = JSON.parse(localStorage.getItem('weatherwise_user'));
    if (!user) {
        user = JSON.parse(sessionStorage.getItem('weatherwise_user'));
    }
    
    const userDisplayName = document.getElementById('userDisplayName');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userAvatarBtn = document.getElementById('userAvatarBtn');
    
    if (user && user.isLoggedIn) {
        // User is logged in
        if (userDisplayName) {
            userDisplayName.textContent = `${user.firstName} ${user.lastName}`;
        }
        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'flex';
        
        // Update avatar icon
        if (userAvatarBtn) {
            userAvatarBtn.innerHTML = `<span class="user-initial">${user.firstName.charAt(0)}</span>`;
            userAvatarBtn.style.background = 'var(--accent-gradient)';
            userAvatarBtn.style.color = 'white';
            userAvatarBtn.style.fontWeight = '600';
        }
        
        // If user has default city, use it
        if (user.defaultCity && user.defaultCity.trim()) {
            currentCity = user.defaultCity;
            searchCity(user.defaultCity);
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
    
    // Add logout handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

function handleLogout() {
    // Clear user data
    localStorage.removeItem('weatherwise_user');
    sessionStorage.removeItem('weatherwise_user');
    
    // Show toast
    showToast(translations[currentLang].logoutSuccess || 'Logged out successfully!', 'success');
    
    // Refresh auth state
    setTimeout(() => {
        window.location.reload();
    }, 1000);
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
    const t = translations[currentLang];
    
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
    elements.locationBtn.addEventListener('click', getUserLocation);
    
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
        
        const response = await fetch(
            `${GEO_URL}/direct?q=${encodeURIComponent(normalizedQuery)}&limit=5&appid=${API_KEY}`
        );
        const data = await response.json();
        
        if (data.length === 0) {
            // Try searching with just the city name if the full query failed
            const cityOnly = cityName.split(',')[0].trim();
            const retryResponse = await fetch(
                `${GEO_URL}/direct?q=${encodeURIComponent(cityOnly)}&limit=5&appid=${API_KEY}`
            );
            const retryData = await retryResponse.json();
            
            if (retryData.length === 0) {
                throw new Error('City not found');
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
        
        // Fetch current weather
        const currentResponse = await fetch(
            `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=${apiLang}`
        );
        weatherData = await currentResponse.json();
        
        // Fetch 5-day forecast (3-hour intervals)
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=${apiLang}`
        );
        forecastData = await forecastResponse.json();
        
        // Update UI
        updateCurrentWeather();
        updateHourlyForecast();
        updateWeeklyForecast();
        updateMonthlyCalendar();
        updateAIPrediction();
        updateWeatherMap('temp');
        
        hideLoading();
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        hideLoading();
    }
}

// ==========================================
// UI Update Functions
// ==========================================

function updateCurrentWeather() {
    if (!weatherData) return;
    
    const t = translations[currentLang];
    
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
    
    const t = translations[currentLang];
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
    
    const t = translations[currentLang];
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
    const t = translations[currentLang];
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
        
        // Generate simulated weather for the month
        const simulatedWeather = generateSimulatedWeather(date);
        
        const dayCell = document.createElement('div');
        dayCell.className = `calendar-day ${isToday ? 'today' : ''}`;
        dayCell.innerHTML = `
            <div class="day-number">${day}</div>
            <img class="day-icon" src="https://openweathermap.org/img/wn/${simulatedWeather.icon}@2x.png" alt="Weather">
            <div class="day-temp">${simulatedWeather.high}°/${simulatedWeather.low}°</div>
        `;
        elements.monthlyCalendar.appendChild(dayCell);
    }
    
    // Update monthly summary
    updateMonthlySummary();
}

function updateMonthlySummary() {
    // Generate simulated monthly stats
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    let totalHigh = 0, totalLow = 0, rainy = 0, sunny = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const weather = generateSimulatedWeather(date);
        totalHigh += weather.high;
        totalLow += weather.low;
        if (weather.isRainy) rainy++;
        if (weather.isSunny) sunny++;
    }
    
    elements.avgHighTemp.textContent = `${Math.round(totalHigh / daysInMonth)}°C`;
    elements.avgLowTemp.textContent = `${Math.round(totalLow / daysInMonth)}°C`;
    elements.rainyDays.textContent = rainy;
    elements.sunnyDays.textContent = sunny;
}

function generateSimulatedWeather(date) {
    // Generate weather based on month and location
    const month = date.getMonth();
    const baseTemp = weatherData ? weatherData.main.temp : 20;
    
    // Seasonal adjustment
    const seasonalOffset = Math.sin((month - 6) * Math.PI / 6) * 10;
    
    // Random variation
    const randomHigh = baseTemp + seasonalOffset + (Math.random() * 6 - 3);
    const randomLow = randomHigh - 5 - Math.random() * 5;
    
    // Weather conditions
    const conditions = ['01d', '02d', '03d', '04d', '09d', '10d', '11d', '13d'];
    const weights = [0.3, 0.2, 0.15, 0.1, 0.1, 0.08, 0.05, 0.02];
    
    // Adjust for season
    let icon;
    const rand = Math.random();
    let cumulative = 0;
    for (let i = 0; i < conditions.length; i++) {
        cumulative += weights[i];
        if (rand < cumulative) {
            icon = conditions[i];
            break;
        }
    }
    icon = icon || '01d';
    
    return {
        high: Math.round(randomHigh),
        low: Math.round(randomLow),
        icon: icon,
        isRainy: ['09d', '10d', '11d'].includes(icon),
        isSunny: ['01d', '02d'].includes(icon)
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
    
    const t = translations[currentLang];
    
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
    
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        
        const weather = generateSimulatedWeather(date);
        
        const dayEl = document.createElement('div');
        dayEl.className = 'extended-day';
        dayEl.innerHTML = `
            <div class="ext-date">${date.getDate()}/${date.getMonth() + 1}</div>
            <img class="ext-icon" src="https://openweathermap.org/img/wn/${weather.icon}@2x.png" alt="Weather">
            <div class="ext-temp">${weather.high}°/${weather.low}°</div>
        `;
        elements.extendedForecast.appendChild(dayEl);
    }
}

function generateWeatherTrends() {
    const t = translations[currentLang];
    const temp = weatherData.main.temp;
    const humidity = weatherData.main.humidity;
    const description = weatherData.weather[0].main.toLowerCase();
    
    let analysis = '';
    
    // Temperature trend
    if (temp > 30) {
        analysis += t.weatherHot + ' ';
    } else if (temp < 10) {
        analysis += t.weatherCold + ' ';
    } else {
        analysis += t.weatherGood + ' ';
    }
    
    // Precipitation trend
    if (description.includes('rain') || description.includes('drizzle')) {
        analysis += t.weatherRain;
    }
    
    // Add humidity info
    if (humidity > 80) {
        analysis += ` ${t.humidity}: ${humidity}% (High)`;
    }
    
    elements.weatherTrends.textContent = analysis || t.weatherGood;
}

function generateWeatherAlerts() {
    const t = translations[currentLang];
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
    const t = translations[currentLang];
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

function getUserLocation() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                currentLat = position.coords.latitude;
                currentLon = position.coords.longitude;
                await fetchWeatherData(currentLat, currentLon);
                showToast(translations[currentLang].successLocation, 'success');
            },
            (error) => {
                // Silently fail - user can search manually
                console.log('Location access denied or unavailable');
            },
            { timeout: 10000 }
        );
    }
}

// ==========================================
// Voice Recognition Functions
// ==========================================

let recognition = null;

function initVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = speechLangCodes[currentLang] || 'en-US';
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            elements.voiceTranscript.textContent = transcript;
            
            if (event.results[0].isFinal) {
                handleVoiceResult(transcript);
            }
        };
        
        recognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
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
        showToast(translations[currentLang].voiceNotSupported, 'warning');
        return;
    }
    
    elements.voiceOverlay.classList.add('active');
    elements.voiceTranscript.textContent = '';
    recognition.start();
}

function startVoiceChat() {
    if (!initVoiceRecognition()) {
        showToast(translations[currentLang].voiceNotSupported, 'warning');
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

function speakMessage(button) {
    if (!('speechSynthesis' in window)) {
        showToast(translations[currentLang].speakNotSupported, 'warning');
        return;
    }
    
    const messageContent = button.parentElement.querySelector('p');
    const text = messageContent.textContent;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLangCodes[currentLang] || 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    speechSynthesis.speak(utterance);
}

function speakText(text) {
    if (!('speechSynthesis' in window)) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLangCodes[currentLang] || 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    speechSynthesis.speak(utterance);
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

function toggleChatbot() {
    elements.chatbotWindow.classList.toggle('active');
    elements.chatBadge.style.display = 'none';
}

function closeChatbot() {
    elements.chatbotWindow.classList.remove('active');
}

function sendChatMessage() {
    const message = elements.chatInput.value.trim();
    if (!message) return;
    
    // Add user message
    addChatMessage(message, 'user');
    elements.chatInput.value = '';
    
    // Check if user asked about a specific city
    const extractedCity = extractCityFromMessage(message);
    if (extractedCity && extractedCity !== weatherData?.name) {
        // Search for the city and load its weather
        searchCity(extractedCity);
    }
    
    // Generate AI response
    setTimeout(() => {
        const response = generateChatResponse(message);
        addChatMessage(response, 'bot');
        
        // Speak response if voice mode is enabled
        if (voiceMode) {
            speakText(response);
        }
    }, 500);
}

function addChatMessage(message, type) {
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${type}-message`;
    
    if (type === 'bot') {
        messageEl.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <p>${message}</p>
                <button class="speak-btn" onclick="speakMessage(this)">
                    <i class="fas fa-volume-up"></i>
                </button>
            </div>
        `;
    } else {
        messageEl.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="message-content">
                <p>${message}</p>
            </div>
        `;
    }
    
    elements.chatMessages.appendChild(messageEl);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function extractCityFromMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    // Common patterns for city queries
    const patterns = [
        /in\s+([a-zA-Z\s]+?)(?:\s*\?|$)/i,
        /(?:weather|forecast)\s+(?:in|for|at|of)\s+([a-zA-Z\s]+?)(?:\s*\?|$)/i,
        /(?:about|for)\s+([a-zA-Z\s]+?)(?:'s|s)?\s+weather/i,
        /^([a-zA-Z\s]+?)(?:'s)?\s+weather/i,
    ];
    
    let extractedCity = null;
    
    for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
            extractedCity = match[1].trim();
            break;
        }
    }
    
    if (!extractedCity) return null;
    
    // Search for the city in cities database
    const cityLower = extractedCity.toLowerCase();
    
    for (let cityData of citiesDatabase) {
        if (cityData.name.toLowerCase() === cityLower || 
            cityData.name.toLowerCase().includes(cityLower) ||
            cityLower.includes(cityData.name.toLowerCase())) {
            return cityData.name;
        }
    }
    
    return null;
}

function generateChatResponse(message) {
    const t = translations[currentLang];
    const lowerMessage = message.toLowerCase();
    
    // Try to extract city from message
    const extractedCity = extractCityFromMessage(message);
    
    if (!weatherData) {
        return "I'm still loading weather data. Please wait a moment and try again.";
    }
    
    const temp = weatherData.main.temp;
    // Translate weather description for unsupported languages
    let description = weatherData.weather[0].description;
    if (typeof getWeatherDescription === 'function') {
        description = getWeatherDescription(description, currentLang);
    }
    const humidity = weatherData.main.humidity;
    const city = extractedCity || weatherData.name;
    const feelsLike = weatherData.main.feels_like;
    const wind = weatherData.wind.speed;
    
    // Weather today
    if (lowerMessage.includes('today') || lowerMessage.includes('weather') || lowerMessage.includes('now') || 
        lowerMessage.includes('current') || lowerMessage.includes('आज') || lowerMessage.includes('இன்று')) {
        return `The current weather in ${city} is ${description} with a temperature of ${Math.round(temp)}°C. It feels like ${Math.round(feelsLike)}°C with ${humidity}% humidity.`;
    }
    
    // Rain forecast
    if (lowerMessage.includes('rain') || lowerMessage.includes('umbrella') || lowerMessage.includes('बारिश') || 
        lowerMessage.includes('மழை') || lowerMessage.includes('lluvia') || lowerMessage.includes('pluie')) {
        const willRain = description.includes('rain') || description.includes('drizzle') || description.includes('thunderstorm');
        if (willRain) {
            return t.weatherRain;
        } else {
            return `No rain is expected in ${city} right now. The current condition is ${description}.`;
        }
    }
    
    // What to wear
    if (lowerMessage.includes('wear') || lowerMessage.includes('clothes') || lowerMessage.includes('dress') ||
        lowerMessage.includes('पहन') || lowerMessage.includes('அணி') || lowerMessage.includes('vestir')) {
        if (temp < 10) return t.wearCold;
        if (temp > 28) return t.wearHot;
        if (description.includes('rain')) return t.wearRain;
        return t.wearMild;
    }
    
    // Temperature
    if (lowerMessage.includes('temperature') || lowerMessage.includes('temp') || lowerMessage.includes('hot') || 
        lowerMessage.includes('cold') || lowerMessage.includes('तापमान') || lowerMessage.includes('வெப்பநிலை')) {
        return `The current temperature in ${city} is ${Math.round(temp)}°C and it feels like ${Math.round(feelsLike)}°C.`;
    }
    
    // Humidity
    if (lowerMessage.includes('humidity') || lowerMessage.includes('humid') || lowerMessage.includes('आर्द्रता') || 
        lowerMessage.includes('ஈரப்பதம்')) {
        return `The humidity in ${city} is currently ${humidity}%. ${humidity > 70 ? 'It feels quite humid.' : 'The air is relatively comfortable.'}`;
    }
    
    // Wind
    if (lowerMessage.includes('wind') || lowerMessage.includes('windy') || lowerMessage.includes('हवा') || 
        lowerMessage.includes('காற்று')) {
        return `The wind speed in ${city} is ${Math.round(wind * 3.6)} km/h. ${wind > 10 ? 'It\'s quite windy today!' : 'It\'s relatively calm.'}`;
    }
    
    // Week forecast
    if (lowerMessage.includes('week') || lowerMessage.includes('forecast') || lowerMessage.includes('next') ||
        lowerMessage.includes('हफ्ते') || lowerMessage.includes('வாரம்')) {
        return `Based on the forecast for ${city}, expect varied conditions this week. Check the 7-day forecast panel for detailed information including temperatures and conditions for each day.`;
    }
    
    // Generic response
    return `In ${city}, it's currently ${Math.round(temp)}°C with ${description}. Humidity is at ${humidity}%. Is there anything specific you'd like to know about the weather?`;
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
    const t = translations[currentLang];
    
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
