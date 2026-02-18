const searchCity = document.getElementById("cityName");
const currentTemptValue = document.getElementById("currentTemptValue");
const currentCityName = document.getElementById("currentCityName");
const currentFeels = document.getElementById("currentFeels");
const windStatus = document.getElementById("windStatus");
const eyeVisibility = document.getElementById("eyeVisibility");
const sunriseTime = document.getElementById("sunriseTime");
const sunsetTime = document.getElementById("sunsetTime");
const humidity = document.getElementById("humidity");
const preasure = document.getElementById("preasure");
const windDirection = document.getElementById("windDirection");

document.getElementById("todayDate").textContent = `${new Date().toLocaleDateString()}`

const APIKey = 'a3c916c3f52e751e38f64aacd03e598a'

searchWeather('Jakarta');

searchCity.addEventListener('keydown', (event) => {
    if (event.key === 'Enter'){
        event.preventDefault()
        const cityName = searchCity.value
        console.log(cityName)
        searchWeather(cityName);
        searchCity.value = '';
    }
});

function getCityLocation(cityName) {
    const cityAPI = `https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1`

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
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${APIKey}&units=metric`

    return fetch(weatherUrl)
    .then(response => response.json())
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

            const cityName = weatherData.name;
            currentCityName.textContent = `${cityName}`;

            const feelsLike = weatherData.weather[0].main;
            currentFeels.textContent = `${feelsLike}`;

            const temp = weatherData.main.temp;
            currentTemptValue.textContent = `${temp}°C`;

            const currentWind = weatherData.wind.speed;
            windStatus.textContent = `${currentWind} meter/sec`

            const visible = weatherData.visibility;
            eyeVisibility.textContent = `${visible} meter`

            const sunriseDay = weatherData.sys.sunrise;
            var date = new Date(sunriseDay * 1000);
            var sunriseHours = date.getHours();
            var sunriseMinutes = "0" + date.getMinutes();
            var sunriseActualTime = `${sunriseHours}:${sunriseMinutes.substr(-2)}`
            sunriseTime.textContent = `${sunriseActualTime}`

            const sunsetDay = weatherData.sys.sunset;
            var date = new Date(sunsetDay * 1000);
            var sunsetHours = date.getHours();
            var sunsetMinutes = "0" + date.getMinutes();
            var sunsetActualTime = `${sunsetHours}:${sunsetMinutes.substr(-2)}`
            sunsetTime.textContent = `${sunsetActualTime}`;

            const currentHumidity = weatherData.main.humidity;
            humidity.textContent = `${currentHumidity} %`;

            const currentWindDirect = weatherData.wind.deg;
            windDirection.textContent = `${currentWindDirect}°`

            const currentPreasure = weatherData.main.pressure;
            preasure.textContent = `${currentPreasure} hPa`;
        })
        .catch(error => {
            console.error('Error:', error.message)
        })
}

