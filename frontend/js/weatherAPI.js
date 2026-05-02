// WEATHER PAGE LOGIC (SEPARATED)
document.addEventListener('DOMContentLoaded', () => {
    const cityInput = document.getElementById('cityInput');
    const searchBtn = document.getElementById('searchBtn');
    const geoBtn    = document.getElementById('geoBtn');

    if (cityInput && searchBtn && geoBtn) {
        const API_KEY = '61a3e1f7cc44db9a650ac15efb9862b4';
        const errorContainer = document.getElementById('errorContainer');
        const inlineLoader = document.getElementById('inlineLoader');
        const displayArea = document.getElementById('weatherMainDisplay');

        function toggleLoading(isLoading) {
            inlineLoader.style.display = isLoading ? "flex" : "none";
            if (isLoading) {
                errorContainer.style.display = "none";
                displayArea.style.opacity = "0.3"; 
            } else {
                displayArea.style.opacity = "1";
            }
        }

        function triggerError(msg) {
            document.getElementById('errorMsg').innerText = msg;
            errorContainer.style.display = "flex";
            displayArea.style.display = "none";
            toggleLoading(false);
            setTimeout(() => { errorContainer.style.display = "none"; }, 5000);
        }

        async function fetchWeatherData(lat, lon, label) {
            toggleLoading(true);
            try {
                const [wRes, fRes] = await Promise.all([
                    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`),
                    fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`)
                ]);

                if (!wRes.ok) throw new Error("City not found. Please try again.");

                updateUI(await wRes.json(), await fRes.json(), label);
                displayArea.style.display = "flex";
                displayArea.classList.add('weather-reveal');
            } catch (err) {
                triggerError(err.message);
            } finally {
                toggleLoading(false);
            }
        }

        async function fetchByCity(cityName) {
            toggleLoading(true);
            try {
                const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`);
                const geoData = await geoRes.json();
                if (!geoData.length) throw new Error("City not found. Please try again.");
                
                const { lat, lon, name, country } = geoData[0];
                await fetchWeatherData(lat, lon, `${name}, ${country}`);
            } catch (err) {
                triggerError(err.message);
            }
        }

        function updateUI(current, forecast, label) {
            document.getElementById('wLocationTitle').innerText = (label === "Sensor") ? `${current.name}, ${current.sys.country}` : label;
            document.getElementById('wMainTemp').innerText = `${Math.round(current.main.temp)}°C`;
            document.getElementById('wMainDesc').innerText = current.weather[0].description;
            document.getElementById('wFeelsLike').innerText = `Feels Like: ${Math.round(current.main.feels_like)}°C`;
            document.getElementById('wDateTime').innerText = `As of ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
            document.getElementById('wMainIcon').src = `https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`;
            document.getElementById('wHumidity').innerText = `${current.main.humidity}%`;
            document.getElementById('wWind').innerText = `${current.wind.speed} m/s`;
            document.getElementById('wClouds').innerText = `${current.clouds.all}%`;
            document.getElementById('wPressure').innerText = `${current.main.pressure} hPa`;

            const grid = document.getElementById('forecastGrid');
            grid.innerHTML = '';
            const processed = new Set();
            processed.add(new Date().getDate());

            forecast.list.forEach(item => {
                const d = new Date(item.dt * 1000);
                if (!processed.has(d.getDate()) && d.getHours() >= 12 && processed.size < 6) {
                    processed.add(d.getDate());
                    grid.innerHTML += `
                        <div class="col forecast-day py-3 px-1">
                            <p class="text-primary fw-bold m-0 small">${d.toLocaleDateString('en-US', {weekday:'short'})}</p>
                            <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" width="40">
                            <h6 class="fw-bold text-dark m-0">${Math.round(item.main.temp)}°</h6>
                        </div>`;
                }
            });

            generateInsights(current.main.temp, current.weather[0].main);
        }

        function generateInsights(temp, condition) {
            const box = document.getElementById('wInsightsBox');
            let content = "";
            if (temp >= 32) {
                content = `<h6 class="fw-bold text-danger mb-3">☀️ Summer Surge</h6><ul class="small mb-0"><li>Stock Cold Water & Sodas</li><li>Promote Halo-halo / Ice Cream</li></ul>`;
            } else if (condition.includes("Rain")) {
                content = `<h6 class="fw-bold text-primary mb-3">🌧️ Rainy Conditions</h6><ul class="small mb-0"><li>Stock Hot Coffee & Noodles</li><li>Highlight Umbrellas</li></ul>`;
            } else {
                content = `<h6 class="fw-bold text-success mb-3">🌤️ Balanced Demand</h6><ul class="small mb-0"><li>Maintain Daily Essentials</li><li>Display Impulse Snacks</li></ul>`;
            }
            box.innerHTML = content;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        searchBtn.addEventListener('click', () => { if (cityInput.value.trim()) fetchByCity(cityInput.value.trim()); });
        cityInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') searchBtn.click(); });
        
        geoBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (p) => fetchWeatherData(p.coords.latitude, p.coords.longitude, "Sensor"),
                    () => { }
                );
            }
        });

        geoBtn.click();
    }
});