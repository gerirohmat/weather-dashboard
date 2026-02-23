// === DOM ELEMENTS ===
const elements = {
    searchCity: document.getElementById("cityName"),
    suggestionsDropdown: document.getElementById("suggestion-dropdown"),
    suggestionsList: document.getElementById('suggestions-list'),
    suggestionsLoading: document.getElementById('suggestions-loading'),
    noResults: document.getElementById('no-results'),

    currentTemptValue: document.getElementById("currentTemptValue"),
    currentCityName: document.getElementById("currentCityName"),
    currentFeels: document.getElementById("currentFeels"),
    windStatus: document.getElementById("windStatus"),
    eyeVisibility: document.getElementById("eyeVisibility"),
    sunriseTime: document.getElementById("sunriseTime"),
    sunsetTime: document.getElementById("sunsetTime"),
    humidity: document.getElementById("humidity"),
    pressure: document.getElementById("pressure"),
    windDirection: document.getElementById("windDirection"),
}

let debounceTimer = null;
let currentSuggestions = [];
let highlightedIndex = -1;
let lastSearchedCity = '';


// === CONSTANT ===
const CONFIG = {
    ENDPOINTS: {
        GEOCODING: 'https://geocoding-api.open-meteo.com/v1/search',
        WEATHER: 'https://api.open-meteo.com/v1/forecast'
    },
    DEFAULT_CITY: 'jakarta',
    AUTOCOMPLETE: {
        MIN_CHARS: 3,
        DEBOUNCE_DELAY: 200,
        MAX_RESULTS: 100
    }
};

// === WEATHER CONDOTION CODE ===
const WEATHER_CODES = {
    0: { 
        description: 'Clear sky', 
        icon: 'fa-sun',
        image: 'clear-sky.png'
    },
    1: { 
        description: 'Mainly clear', 
        icon: 'fa-cloud-sun',
        image: 'partly-cloudy.png'
    },
    2: { 
        description: 'Partly cloudy', 
        icon: 'fa-cloud-sun',
        image: 'partly-cloudy.png'
    },
    3: { 
        description: 'Overcast', 
        icon: 'fa-cloud',
        image: 'cloudy.png'
    },
    45: { 
        description: 'Foggy', 
        icon: 'fa-smog',
        image: 'fog.png'
    },
    48: { 
        description: 'Depositing rime fog', 
        icon: 'fa-smog',
        image: 'fog.png'
    },
    51: { 
        description: 'Light drizzle', 
        icon: 'fa-cloud-rain',
        image: 'drizzle.png'
    },
    53: { 
        description: 'Moderate drizzle', 
        icon: 'fa-cloud-rain',
        image: 'drizzle.png'
    },
    55: { 
        description: 'Dense drizzle', 
        icon: 'fa-cloud-showers-heavy',
        image: 'drizzle.png'
    },
    61: { 
        description: 'Slight rain', 
        icon: 'fa-cloud-rain',
        image: 'rain.png'
    },
    63: { 
        description: 'Moderate rain', 
        icon: 'fa-cloud-showers-heavy',
        image: 'rain.png'
    },
    65: { 
        description: 'Heavy rain', 
        icon: 'fa-cloud-showers-heavy',
        image: 'heavy-rain.png'
    },
    71: { 
        description: 'Slight snow', 
        icon: 'fa-snowflake',
        image: 'snow.png'
    },
    73: { 
        description: 'Moderate snow', 
        icon: 'fa-snowflake',
        image: 'snow.png'
    },
    75: { 
        description: 'Heavy snow', 
        icon: 'fa-snowflake',
        image: 'snow.png'
    },
    80: { 
        description: 'Slight rain showers', 
        icon: 'fa-cloud-rain',
        image: 'rain.png'
    },
    81: { 
        description: 'Moderate rain showers', 
        icon: 'fa-cloud-showers-heavy',
        image: 'rain.png'
    },
    82: { 
        description: 'Violent rain showers', 
        icon: 'fa-cloud-showers-heavy',
        image: 'heavy-rain.png'
    },
    85: { 
        description: 'Slight snow showers', 
        icon: 'fa-snowflake',
        image: 'snow.png'
    },
    86: { 
        description: 'Heavy snow showers', 
        icon: 'fa-snowflake',
        image: 'snow.png'
    },
    95: { 
        description: 'Thunderstorm', 
        icon: 'fa-bolt',
        image: 'thunderstorm.png'
    },
    96: { 
        description: 'Thunderstorm with slight hail', 
        icon: 'fa-bolt',
        image: 'thunderstorm.png'
    },
    99: { 
        description: 'Thunderstorm with heavy hail', 
        icon: 'fa-bolt',
        image: 'thunderstorm.png'
    }
};

// Utility function
function getWeatherInfo(code) {
    return WEATHER_CODES[code] || {
        description: 'Unknown',
        icon: 'fa-question',
        image: 'unknown.png'
    };
}

// === AUTOCOMPLETE FUCTION ===
function showNoResults(){
    elements.suggestionsList.innerHTML = '';
    elements.noResults.classList.remove('hidden');
    elements.suggestionsDropdown.classList.remove('hidden');
}

function hideDropdown() {
    elements.suggestionsDropdown.classList.add('hidden');
    currentSuggestions = []
    highlightedIndex = -1
}

// === API FUNCTION ===

async function fetchCitySuggestions(query) {
    const url = `${CONFIG.ENDPOINTS.GEOCODING}?name=${encodeURIComponent(query)}&count=${CONFIG.AUTOCOMPLETE.MAX_RESULTS}&language=en&format=json`;
    
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Failed to fetch suggestions');
        }

        const data = await response.json();
        return data.results || [];

    } catch (error){
        console.log('Error fetching suggestions : ', error);
        return [];
    }
}

function displaySuggestions(suggestions) {
    if (suggestions.legth === 0){
        showNoResults();
        return;
    }

    currentSuggestions = suggestions;
    elements.suggestionsList.innerHTML = '';
    elements.noResults.classList.add('hidden');
    elements.suggestionsDropdown.classList.remove('hidden');

    suggestions.forEach((city, index) => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.dataset.index = index;

        const locationParts = [city.name];
        if (city.admin1) locationParts.push(city.admin1);
        locationParts.push(city.country);

        item.innerHTML = `
            <i class="fa-solid fa-location-dot"></i>
            <div class="suggestion-info">
                <div class="suggestion-name">${city.name}</div>
                <div class="suggestion-details">${locationParts.join(', ')}</div>
            </div>
        `;

        item.addEventListener('click', () => {
            selectSuggestion(city);
        });
        
        // Hover handler
        item.addEventListener('mouseenter', () => {
            highlightedIndex = index;
            updateHighlight();
        });
        
        elements.suggestionsList.appendChild(item);
    })
}

function updateHighlight() {
    const items = elements.suggestionsList.querySelectorAll('.suggestions-item');
    items.forEach((item, index) => {
        if(index === highlightedIndex){
            item.classList.add('highlighted');
        } else {
            item.classList.remove('highlighted');
        }
    });
}

function selectSuggestion(city) {
    elements.searchCity.value = city.name;
    lastSearchedCity = city.name;
    hideDropdown();

    searchWeather(city.name, city.latitude, city.longitude);
}

function handleSearchInput(){
    const query = elements.searchCity.value.trim();

    if (debounceTimer) {
        clearTimeout(debounceTimer)
    }

    if (query.length < CONFIG.AUTOCOMPLETE.MIN_CHARS){
        hideDropdown();
        return;
    }

    debounceTimer = setTimeout(async () => {
        const suggestions = await fetchCitySuggestions(query);
        displaySuggestions(suggestions);
    }, CONFIG.AUTOCOMPLETE.DEBOUNCE_DELAY);
}

function handleKeyboardNavigation(event){
    if (elements.suggestionsDropdown.classList.contains('hidden')){
        return
    }

    switch (event.key){
        case 'ArrowDown':
            event.preventDefault();
            highlightedIndex = Math.min(highlightedIndex + 1, currentSuggestions.length - 1);
            updateHighlight();
            break;

        case 'ArrowUp':
            event.preventDefault();
            highlightedIndex = Math.max(highlightedIndex -1, -1);
            updateHighlight();
            break;

        case 'Enter':
            event.preventDefault();
            
            if (highlightedIndex >= 0 && currentSuggestions[highlightedIndex]){
                selectSuggestion(currentSuggestions[highlightedIndex]);
            }

            else if (currentSuggestions.length > 0){
                selectSuggestion(currentSuggestions[0])
            }

            else {
                const query = elements.searchCity.value.trim();
                if (query.length >= CONFIG.AUTOCOMPLETE.MIN_CHARS){
                    hideDropdown();
                    searchWeatherByName(query);
                }
            }
            break;

        case 'Escape':
            event.preventDefault();
            hideDropdown();
            elements.searchCity.blur();
            break;
    }
}

function handleClickOutside(event) {
    if (!elements.searchCity.contains(event.target) && 
        !elements.suggestionsDropdown.contains(event.target)) {
        hideDropdown();
    }
}

async function getCityLocation(cityName) {
    const url = `${CONFIG.ENDPOINTS.GEOCODING}?name=${cityName}&count=10&language=en&format=json`

    const response = await fetch(url);
    const data = await response.json();

    if (!data.results || data.results.legth === 0){
        throw new Error('City not found');
    }

    return data.results[0];
};

async function getWeatherData (lat, lon) {
    
    const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,

        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m',

        hourly: 'temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,visibility,wind_direction_10m',

        daily: 'temperature_2m_max,temperature_2m_min,sunset,sunrise,weather_code',
        
        timezone: 'auto'
    });

    const url = `${CONFIG.ENDPOINTS.WEATHER}?${params}`;

    const response = await fetch(url);

    if(!response.ok) {
        throw new Error('Failed rp fetch weater data')
    }

    return await response.json();
}

// === UI FUNCTION === 
function displayCurrentWeather(weatherData, cityName){
    const current = weatherData.current;
    const weatherInfo = getWeatherInfo(current.weather_code);

    elements.currentCityName.textContent = cityName;
    elements.currentTemptValue.textContent = `${Math.round(current.temperature_2m)}°C`
    elements.currentFeels.textContent = weatherInfo.description;

    const iconElement = document.querySelector('.weather-condition i');
    if(iconElement){
        iconElement.className = `fa-solid ${weatherInfo.icon}`
    }

    elements.humidity.textContent = `${current.relative_humidity_2m}%`
    elements.windStatus.textContent = `${current.wind_speed_10m}km/h`
    elements.windDirection.textContent = `${current.wind_direction_10m}°`
    elements.pressure.textContent = `${current.surface_pressure} hPa`
}

// === DISPLAY HOURLY FORECAST (24 HOURS) ===
function displayHourlyForecast(hourlyData){
    const container = document.getElementById('hourly-forecast-list');
    if(!container) return;

    container.innerHTML = ''

    for(let i = 0; i < 24; i++){
        const time = new Date(hourlyData.time[i]);
        const hour = time.getHours();
        const temp = Math.round(hourlyData.temperature_2m[i])
        const weatherInfo = getWeatherInfo(hourlyData.weather_code[i]);

        const hourCard = document.createElement('div');
    hourCard.className = 'forecast-temp';
    hourCard.innerHTML = `
        <p class="time">${hour} : 00 </p>
            <div class="forecast-temp-detail">
                <i class="fa-solid ${weatherInfo.icon}"></i>
                <p class="forecast-temp-value">${temp}°C</p>
            </div>
    `;

    container.appendChild(hourCard)
    }
}

// === DISPLAY DAILY FORECAST (NEXT 7 DAYS) ===
function displayDailyForecast(dailyData) {
    const container = document.getElementById('seven-days-list');
    if(!container) return;

    container.innerHTML = ''

    for (let i = 1; i < 7; i++){
        const date = new Date(dailyData.time[i]);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const maxTemp = Math.round(dailyData.temperature_2m_max[i]);
        const minTemp = Math.round(dailyData.temperature_2m_min[i]);
        const weatherInfo = getWeatherInfo(dailyData.weather_code[i]);
        
        const dayCard = document.createElement('div');
        dayCard.className = 'the-day'
        dayCard.innerHTML =  `
            <div class="day-temp">
                <i class="fa-solid ${weatherInfo.icon}"></i>
                <h2 class="days-temp">${maxTemp}°C</h2>
                <span class="temp-separator">/</span>
                <h2 class="days-temp">${minTemp}°C</h2>
            </div>
            <p>${dateStr}</p>
            <p>${dayName}</p>
        `;

        container.appendChild(dayCard)
    }
}

// === Search Function ===
async function searchWeather(cityName, lat, lon) {
    try {
        console.log('Search for: ', cityName);

        const weatherData = await getWeatherData(lat, lon);
        displayCurrentWeather(weatherData, cityName);
        displayDailyForecast(weatherData.daily);
        displayHourlyForecast(weatherData.hourly);


        
        console.log('✅ Weather updated successfully!');

    } catch (error) {
        console.error('Error :', error.message);
        alert(`Error fetching weather: ${error.message}`);
    }
}

async function searchWeatherByName(cityName) {
    try {
        console.log(`🔍 Searching weather for: ${cityName}`);
        
        const cityData = await getCityLocation(cityName);
        const weatherData = await getWeatherData(cityData.latitude, cityData.longitude);


        displayCurrentWeather(weatherData, cityData.name);
        console.log(weatherData.hourly)
        displayDailyForecast(weatherData.daily);
        displayHourlyForecast(weatherData.hourly);

        console.log('✅ Weather updated successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        
        // If city not found and we have last searched city, keep that
        if (error.message === 'City not found' && lastSearchedCity) {
            alert(`City "${cityName}" not found. Showing weather for ${lastSearchedCity}`);
            elements.searchCity.value = lastSearchedCity;
        } else {
            alert(`Error: ${error.message}`);
        }
    }
}

// === EVENT HANDLERS ===
document.addEventListener('DOMContentLoaded', () => {
    // Input event for autocomplete
    elements.searchCity.addEventListener('input', handleSearchInput);
    
    // Keyboard navigation
    elements.searchCity.addEventListener('keydown', handleKeyboardNavigation);
    
    // Click outside to close
    document.addEventListener('click', handleClickOutside);
    
    // Initialize with default city
    searchWeatherByName(CONFIG.DEFAULT_CITY);
    
    // Update today's date
    document.getElementById('todayDate').textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});