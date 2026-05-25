// weatherMap.js - Interactive Weather Map for WeatherWise
// Map Configuration
const MAP_CONFIG = {
    defaultCenter: [20, 0],
    defaultZoom: 2,
    minZoom: 2,
    maxZoom: 18,
    tileProviders: {
        standard: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    }
};
// OpenWeatherMap API Key
const OWM_API_KEY = '56557251d5db2189c685db5c677e77a9';

// Weather Map Layers
const WEATHER_LAYERS = {
    temp: {
        name: 'Temperature',
        translationKey: 'temperature',
        icon: 'fa-temperature-high',
        url: `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${OWM_API_KEY}`,
        legend: [
            { color: '#821692', label: '-40°C' },
            { color: '#0000FF', label: '-20°C' },
            { color: '#00BFFF', label: '0°C' },
            { color: '#00FF00', label: '20°C' },
            { color: '#FFFF00', label: '30°C' },
            { color: '#FF0000', label: '40°C' }
        ]
    },
    precipitation: {
        name: 'Precipitation',
        translationKey: 'precipitation',
        icon: 'fa-cloud-rain',
        url: `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OWM_API_KEY}`,
        legend: [
            { color: '#E8F5FF', label: 'Light' },
            { color: '#87CEEB', label: 'Moderate' },
            { color: '#4169E1', label: 'Heavy' },
            { color: '#0000CD', label: 'Very Heavy' }
        ]
    },
    clouds: {
        name: 'Clouds',
        translationKey: 'clouds',
        icon: 'fa-cloud',
        url: `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${OWM_API_KEY}`,
        legend: [
            { color: 'rgba(255,255,255,0.1)', label: 'Clear' },
            { color: 'rgba(255,255,255,0.5)', label: 'Partly' },
            { color: 'rgba(255,255,255,0.8)', label: 'Cloudy' },
            { color: 'rgba(200,200,200,1)', label: 'Overcast' }
        ]
    },
    wind: {
        name: 'Wind Speed',
        translationKey: 'windSpeed',
        icon: 'fa-wind',
        url: `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${OWM_API_KEY}`,
        legend: [
            { color: '#00FF00', label: '0-5 m/s' },
            { color: '#FFFF00', label: '5-10 m/s' },
            { color: '#FFA500', label: '10-20 m/s' },
            { color: '#FF0000', label: '20+ m/s' }
        ]
    },
    pressure: {
        name: 'Pressure',
        translationKey: 'pressure',
        icon: 'fa-gauge-high',
        url: `https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${OWM_API_KEY}`,
        legend: [
            { color: '#FF0000', label: 'Low' },
            { color: '#FFFF00', label: 'Normal' },
            { color: '#00FF00', label: 'High' }
        ]
    }
};

// Current active layer type for tracking
let currentLayerType = 'temp';

// Map state
let weatherMap = null;
let currentLayer = null;
let currentWeatherLayer = null;
let markers = [];
let isMapInitialized = false;

// Initialize Weather Map
function initWeatherMap() {
    if (isMapInitialized) return;
    
    const mapContainer = document.getElementById('weatherMapContainer');
    if (!mapContainer) return;
    
    // Create map
    weatherMap = L.map('weatherMapContainer', {
        center: MAP_CONFIG.defaultCenter,
        zoom: MAP_CONFIG.defaultZoom,
        minZoom: MAP_CONFIG.minZoom,
        maxZoom: MAP_CONFIG.maxZoom,
        zoomControl: false
    });
    
    // Add zoom control to top-right
    L.control.zoom({ position: 'topright' }).addTo(weatherMap);
    
    // Add base tile layer
    updateBaseLayer();
    
    // Add default weather layer (temperature)
    setWeatherLayer('temp');
    
    // Setup layer controls
    setupLayerControls();
    
    // Setup map search
    setupMapSearch();
    
    // Get user's location
    getUserLocation();
    
    isMapInitialized = true;
}

// Update base layer based on theme
function updateBaseLayer() {
    if (!weatherMap) return;
    
    const isDark = document.body.classList.contains('dark-theme');
    const tileUrl = isDark ? MAP_CONFIG.tileProviders.dark : MAP_CONFIG.tileProviders.standard;
    
    if (currentLayer) {
        weatherMap.removeLayer(currentLayer);
    }
    
    currentLayer = L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(weatherMap);
}

// Set weather layer
function setWeatherLayer(layerType) {
    if (!weatherMap) return;
    
    const layer = WEATHER_LAYERS[layerType];
    if (!layer) return;
    
    // Track current layer type for translation updates
    currentLayerType = layerType;
    
    // Remove current weather layer
    if (currentWeatherLayer) {
        weatherMap.removeLayer(currentWeatherLayer);
    }
    
    // Add new weather layer
    currentWeatherLayer = L.tileLayer(layer.url, {
        opacity: 0.7,
        maxZoom: 18
    }).addTo(weatherMap);
    
    // Update active button
    document.querySelectorAll('.map-layer-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.layer === layerType);
    });
    
    // Update legend
    updateLegend(layer, layerType);
}

// Get translated layer name
function getLayerName(layer) {
    if (typeof translations !== 'undefined' && typeof currentLang !== 'undefined') {
        const t = translations[currentLang];
        if (t && t[layer.translationKey]) {
            return t[layer.translationKey];
        }
    }
    return layer.name;
}

// Update legend
function updateLegend(layer, layerType) {
    const legendContainer = document.getElementById('mapLegend');
    if (!legendContainer) return;
    
    const layerName = getLayerName(layer);
    
    legendContainer.innerHTML = `
        <h4><i class="fas ${layer.icon}"></i> ${layerName}</h4>
        <div class="legend-items">
            ${layer.legend.map(item => `
                <div class="legend-item">
                    <span class="legend-color" style="background: ${item.color}"></span>
                    <span class="legend-label">${item.label}</span>
                </div>
            `).join('')}
        </div>
    `;
}

// Setup layer controls
function setupLayerControls() {
    const controlsContainer = document.getElementById('mapLayerControls');
    if (!controlsContainer) return;
    
    controlsContainer.innerHTML = Object.entries(WEATHER_LAYERS).map(([key, layer]) => {
        const layerName = getLayerName(layer);
        return `
            <button class="map-layer-btn ${key === 'temp' ? 'active' : ''}" 
                    data-layer="${key}"
                    data-translate-key="${layer.translationKey}"
                    onclick="setWeatherLayer('${key}')"
                    title="${layerName}">
                <i class="fas ${layer.icon}"></i>
                <span>${layerName}</span>
            </button>
        `;
    }).join('');
}

// Update map translations when language changes
function updateMapTranslations() {
    // Update layer control buttons
    setupLayerControls();
    
    // Update current legend
    if (currentLayerType && WEATHER_LAYERS[currentLayerType]) {
        updateLegend(WEATHER_LAYERS[currentLayerType], currentLayerType);
    }
}

// Setup map search
function setupMapSearch() {
    const searchInput = document.getElementById('mapSearchInput');
    if (!searchInput) return;
    
    let highlightedIndex = -1;
    
    // Input event for autocomplete
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        highlightedIndex = -1;
        if (query.length >= 2) {
            showMapSuggestions(query);
        } else {
            hideMapSuggestions();
        }
    });
    
    // Keyboard navigation
    searchInput.addEventListener('keydown', (e) => {
        const suggestionsList = document.getElementById('mapSuggestionsList');
        const items = suggestionsList?.querySelectorAll('.suggestion-item') || [];
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            highlightedIndex = Math.min(highlightedIndex + 1, items.length - 1);
            updateMapHighlight(items, highlightedIndex);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            highlightedIndex = Math.max(highlightedIndex - 1, 0);
            updateMapHighlight(items, highlightedIndex);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0 && items[highlightedIndex]) {
                items[highlightedIndex].click();
            } else {
                const query = searchInput.value.trim();
                if (query) {
                    searchLocation(query);
                    hideMapSuggestions();
                }
            }
        } else if (e.key === 'Escape') {
            hideMapSuggestions();
        }
    });
    
    // Hide suggestions on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.map-search')) {
            hideMapSuggestions();
        }
    });
}

// Show map suggestions
function showMapSuggestions(query) {
    const container = document.getElementById('mapSuggestionsContainer');
    const list = document.getElementById('mapSuggestionsList');
    if (!container || !list || typeof citiesDatabase === 'undefined') return;
    
    const queryLower = query.toLowerCase();
    
    // Filter cities from database
    const matchingCities = citiesDatabase.filter(city => {
        const cityName = city.name.toLowerCase();
        const stateName = city.state ? city.state.toLowerCase() : '';
        const countryName = city.country.toLowerCase();
        return cityName.includes(queryLower) || 
               stateName.includes(queryLower) || 
               countryName.includes(queryLower);
    }).slice(0, 8);
    
    if (matchingCities.length === 0) {
        list.innerHTML = `
            <li class="no-suggestions">
                <i class="fas fa-search"></i>
                No cities found
            </li>
        `;
    } else {
        list.innerHTML = matchingCities.map((city, index) => `
            <li class="suggestion-item" data-index="${index}" 
                onclick="selectMapSuggestion('${city.name}', '${city.state || ''}', '${city.country}')">
                <i class="fas fa-map-marker-alt"></i>
                <div class="suggestion-text">
                    <span class="suggestion-main">${city.name}</span>
                    <span class="suggestion-sub">${city.state ? city.state + ', ' : ''}${city.country}</span>
                </div>
            </li>
        `).join('');
    }
    
    container.classList.add('active');
}

// Hide map suggestions
function hideMapSuggestions() {
    const container = document.getElementById('mapSuggestionsContainer');
    if (container) {
        container.classList.remove('active');
    }
}

// Update highlight for keyboard navigation
function updateMapHighlight(items, index) {
    items.forEach((item, i) => {
        item.classList.toggle('highlighted', i === index);
    });
}

// Select map suggestion
function selectMapSuggestion(cityName, state, country) {
    const searchInput = document.getElementById('mapSearchInput');
    const searchTerm = state ? `${cityName}, ${state}, ${country}` : `${cityName}, ${country}`;
    
    if (searchInput) {
        searchInput.value = searchTerm;
    }
    
    hideMapSuggestions();
    searchLocation(searchTerm);
}

// Search location on map
async function searchLocation(query) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${OWM_API_KEY}`
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
            const { lat, lon, name, country } = data[0];
            
            // Pan to location
            weatherMap.setView([lat, lon], 10);
            
            // Add marker with weather info
            await addWeatherMarker(lat, lon, name, country);
        } else {
            showMapToast('Location not found', 'error');
        }
    } catch (error) {
        console.error('Search error:', error);
        showMapToast('Search failed', 'error');
    }
}

// Add weather marker
async function addWeatherMarker(lat, lon, name, country) {
    try {
        // Get weather data
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OWM_API_KEY}`
        );
        const weather = await response.json();
        
        // Create custom icon
        const iconHtml = `
            <div class="weather-marker">
                <img src="https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png" alt="weather">
                <span class="marker-temp">${Math.round(weather.main.temp)}°</span>
            </div>
        `;
        
        const customIcon = L.divIcon({
            html: iconHtml,
            className: 'weather-marker-container',
            iconSize: [60, 60],
            iconAnchor: [30, 30]
        });
        
        // Remove existing markers
        markers.forEach(m => weatherMap.removeLayer(m));
        markers = [];
        
        // Add new marker
        const marker = L.marker([lat, lon], { icon: customIcon })
            .addTo(weatherMap)
            .bindPopup(`
                <div class="map-popup">
                    <h3>${name}, ${country}</h3>
                    <div class="popup-weather">
                        <img src="https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png" alt="weather">
                        <div class="popup-details">
                            <span class="popup-temp">${Math.round(weather.main.temp)}°C</span>
                            <span class="popup-desc">${weather.weather[0].description}</span>
                        </div>
                    </div>
                    <div class="popup-stats">
                        <div><i class="fas fa-tint"></i> ${weather.main.humidity}%</div>
                        <div><i class="fas fa-wind"></i> ${weather.wind.speed} m/s</div>
                        <div><i class="fas fa-gauge-high"></i> ${weather.main.pressure} hPa</div>
                    </div>
                </div>
            `)
            .openPopup();
        
        markers.push(marker);
        
    } catch (error) {
        console.error('Weather marker error:', error);
    }
}

// Get user's location
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                // Get location name
                try {
                    const response = await fetch(
                        `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${OWM_API_KEY}`
                    );
                    const data = await response.json();
                    
                    if (data && data.length > 0) {
                        const { name, country } = data[0];
                        weatherMap.setView([latitude, longitude], 8);
                        await addWeatherMarker(latitude, longitude, name, country);
                    }
                } catch (error) {
                    console.error('Reverse geocoding error:', error);
                }
            },
            (error) => {
                console.log('Geolocation not available:', error.message);
            }
        );
    }
}

// Show map toast
function showMapToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `map-toast ${type}`;
    toast.textContent = message;
    
    const mapContainer = document.querySelector('.weather-map-wrapper');
    if (mapContainer) {
        mapContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// Toggle fullscreen
function toggleMapFullscreen() {
    const mapWrapper = document.querySelector('.weather-map-wrapper');
    if (!mapWrapper) return;
    
    if (!document.fullscreenElement) {
        mapWrapper.requestFullscreen().then(() => {
            setTimeout(() => weatherMap.invalidateSize(), 100);
        });
    } else {
        document.exitFullscreen().then(() => {
            setTimeout(() => weatherMap.invalidateSize(), 100);
        });
    }
}

// Recenter map
function recenterMap() {
    if (weatherMap) {
        getUserLocation();
    }
}

// Change map style
function changeMapStyle(style) {
    if (!weatherMap) return;
    
    if (currentLayer) {
        weatherMap.removeLayer(currentLayer);
    }
    
    const tileUrl = MAP_CONFIG.tileProviders[style] || MAP_CONFIG.tileProviders.standard;
    
    currentLayer = L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(weatherMap);
    
    // Update style buttons
    document.querySelectorAll('.map-style-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.style === style);
    });
}

// Listen for theme changes
const themeObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
            updateBaseLayer();
        }
    });
});

// Start observing body for theme changes
document.addEventListener('DOMContentLoaded', () => {
    themeObserver.observe(document.body, { attributes: true });
});

// Export functions
window.initWeatherMap = initWeatherMap;
window.setWeatherLayer = setWeatherLayer;
window.toggleMapFullscreen = toggleMapFullscreen;
window.recenterMap = recenterMap;
window.changeMapStyle = changeMapStyle;
window.searchLocation = searchLocation;
