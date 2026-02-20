// === DOM ELEMENTS ===
const elements = {
    searchCity: document.getElementById("cityName"),
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


// === CONSTANT ===
const API_KEY = 'a3c916c3f52e751e38f64aacd03e598a';
const API_ENDPOINT = {
    GEOCODING: 'https://geocoding-api.open-meteo.com/v1/search',
    WEATHER: 'https://api.openweathermap.org/data/2.5/weather'
}

// === UTILITY FUNCTIONS ===
function formatUnixTime(UnixTimestamp) {
    const date = new Date(UnixTimestamp * 1000);
    const hours = date.getHours();
    const minutes = ("0" + date.getMinutes()).slice(-2);
    return `${hours}:${minutes}`;
}

const formatTemperature = (temp, unit = 'C') => `${Math.round(temp)}°${unit}`;
const formatWindSpeed = (speed) => `${speed.toFixed(2)} m/s`;
const formatVisibility = (meters) => `${(meters / 1000). toFixed(1)} km`

// === API FUNCTION ===
function getCityLocation(cityName) {
    const cityAPI = `${API_ENDPOINT.GEOCODING}?name=${cityName}&count=1`

    return fetch(cityAPI)
        .then(response => response.json())
        .then(data => {
            if (!data.results || data.results.length === 0) {
                throw new Error('City not found');
            }

            const city = data.results[0]

            return {
                name: city.name,
                country: city.country,
                latitude: city.latitude,
                longitude: city.longitude 
            };

        });
};

function getWeatherData (lat, lon) {
    const weatherUrl = `${API_ENDPOINT.WEATHER}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`

    return fetch(weatherUrl)
    .then(response => response.json())
}

// === UI FUNCTION === 
function updateWeatherDisplay(weatherData) {
    // Current weather 
    elements.currentCityName.textContent = weatherData.name;
    elements.currentFeels.textContent = weatherData.weather[0].main;
    elements.currentTemptValue.textContent = formatTemperature(weatherData.main.temp);
    
    // Wind & visibility
    elements.windStatus.textContent = formatWindSpeed(weatherData.wind.speed);
    elements.eyeVisibility.textContent = formatVisibility(weatherData.visibility);

    // Sun times
    elements.sunriseTime.textContent = formatUnixTime(weatherData.sys.sunrise);
    elements.sunsetTime.textContent = formatUnixTime(weatherData.sys.sunset);

    // Aditional metrics
    elements.humidity.textContent = `${weatherData.main.humidity}%`;
    elements.windDirection.textContent = `${weatherData.wind.deg}°`;
    elements.pressure.textContent = `${weatherData.main.pressure} hPa`
}

function showLoading() {
    elements.currentCityName.textContent = 'Loading...';
    elements.currentTempeValue.textContent = '--°C';
}

function showError(message) {
    alert(`Could not find weather data: ${message}`);
}

function searchWeather (cityName) {
    console.log('Search for:', cityName);

    getCityLocation(cityName)
        .then(cityData => {
            console.log('Found:', cityData.name, cityData.country);
            console.log('Coordinates:', cityData.latitude, cityData.longitude);

            return getWeatherData(cityData.latitude, cityData.longitude);
        })
        .then(weatherData => {
            console.log(weatherData)
            updateWeatherDisplay(weatherData)
        })
        .catch(error => {
            console.error('Error:', error.message);
            showError(error.message)
        })
}

// === EVENT HANDLERS ===
elements.searchCity.addEventListener('keydown', (event) => {
    if (event.key === 'Enter'){
        event.preventDefault()
        const cityName = elements.searchCity.value
        console.log(cityName)
        searchWeather(cityName);
        searchCity.value = '';
    }
});


document.getElementById("todayDate").textContent = `${new Date().toLocaleDateString()}`
searchWeather('Jakarta');