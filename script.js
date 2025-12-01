const majorCities = ['Jakarta','Bandung','Surabaya','Yogyakarta','Denpasar','Medan','Makassar','London','New York','Tokyo','Paris'];
let favorites = JSON.parse(localStorage.getItem('wp_favorites') || '[]');
let lastCity = localStorage.getItem('wp_lastCity') || 'Jakarta';
let isCelsius = true;
let lastCoords = JSON.parse(localStorage.getItem('wp_lastCoords') || 'null');
let isDarkTheme = localStorage.getItem('wp_theme') !== 'light'; 

const $ = id => document.getElementById(id);
const searchInput = $('searchInput');
const suggestionsBox = $('suggestions');
const locationName = $('locationName');
const timestampEl = $('timestamp');
const temperatureLarge = $('temperatureLarge');
const weatherDescription = $('weatherDescription');
const weatherIconLarge = $('weatherIconLarge');
const humidityEl = $('humidity');
const windEl = $('windSpeed');
const forecastHourly = $('forecastHourly');
const forecastFive = $('forecastFive');
const favoriteBtn = $('favoriteBtn') || null;
const refreshBtn = $('refreshBtn');
const openMapBtn = $('openMap');
const lastUpdated = $('lastUpdated');
const nearbyLocations = $('nearbyLocations');
const themeToggleBtn = $('themeToggleBtn');
const tempToggleBtn = $('tempToggleBtn');
const uvIndexMax = $('uvIndexMax');
const precipitation = $('precipitation');
const aqi = $('aqi');
const sunsetTime = $('sunsetTime');
const minMaxTempEl = $('minMaxTemp'); 
const favoritesSection = $('favoritesSection');

function escapeHtml(s){ return String(s || '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
function setText(el, t){ if(!el) return; el.textContent = (t==null? '—': t); }
function tempLabel(c){ if(c==null) return '—'; return Math.round(isCelsius? c : (c*9/5+32)) + (isCelsius? '°C' : '°F'); }
function windLabel(mps){ if(mps==null) return '—'; return Math.round(mps*10)/10 + ' m/s'; }
function iconFor(code){ 
  const map = {
    0: 'fa-sun',
    1: 'fa-cloud-sun',
    2: 'fa-cloud-meatball',
    3: 'fa-cloud',
    45: 'fa-smog', 48: 'fa-smog',
    51: 'fa-cloud-drizzle', 61: 'fa-cloud-rain',
    63: 'fa-cloud-showers-heavy', 65: 'fa-cloud-showers-heavy',
    71: 'fa-snowflake',
    80: 'fa-cloud-rain',
    95: 'fa-bolt-lightning'
  }; 
  const iconClass = map[code] || 'fa-sun';
  return `<i class="fas ${iconClass}"></i>`;
}
function codeToText(code){ const map = {0:'Cerah',1:'Umumnya cerah',2:'Sebagian berawan',3:'Mendung',45:'Kabut',48:'Kabut Beku',51:'Gerimis Ringan',61:'Hujan',63:'Hujan',65:'Hujan Deras',71:'Salju',80:'Hujan Badai',95:'Badai Petir'}; return map[code] || 'Tidak diketahui'; }
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function applyTheme(isDark) {
    isDarkTheme = isDark;
    if (isDark) {
        document.body.classList.remove('light-theme');
        localStorage.setItem('wp_theme', 'dark');
        if (themeToggleBtn) themeToggleBtn.textContent = '🌙';
    } else {
        document.body.classList.add('light-theme');
        localStorage.setItem('wp_theme', 'light');
        if (themeToggleBtn) themeToggleBtn.textContent = '☀️';
    }
}

async function geocode(city){
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
  const res = await fetch(url, { headers:{ 'Accept-Language':'en' }});
  if(!res.ok) throw new Error('Geocode failed');
  const arr = await res.json();
  if(!arr || !arr[0]) throw new Error('Location not found');
  return { lat: parseFloat(arr[0].lat), lon: parseFloat(arr[0].lon), label: (arr[0].display_name || city).split(',')[0] };
}

async function fetchSuggestions(query) {
    if (query.length < 3) {
        suggestionsBox.classList.add('hidden');
        return [];
    }
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`;
    const res = await fetch(url);
    if(!res.ok) return [];
    const arr = await res.json();
    return arr.map(item => ({ 
        name: (item.display_name || item.address.city || item.address.town || item.address.village || item.address.country),
    }));
}

function renderSuggestions(suggestions) {
    suggestionsBox.innerHTML = '';
    if (suggestions.length === 0) {
        suggestionsBox.classList.add('hidden');
        return;
    }

    suggestions.forEach(s => {
        const displayName = s.name.split(',').slice(0, 2).join(', ');
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.textContent = displayName;
        div.addEventListener('click', () => {
            searchInput.value = displayName;
            showByCity(displayName);
            suggestionsBox.classList.add('hidden');
        });
        suggestionsBox.appendChild(div);
    });

    suggestionsBox.classList.remove('hidden');
}

async function fetchOpenMeteo(lat, lon){
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m,precipitation,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode,uv_index_max,sunset&forecast_days=10&timezone=auto`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('Weather fetch failed');
  return await res.json();
}

async function showByCoords(lat, lon, label){
  try{
    const data = await fetchOpenMeteo(lat, lon);
    const cw = data.current_weather;
    const hourly = data.hourly;
    const daily = data.daily;

    setText(locationName, label || `${lat.toFixed(3)},${lon.toFixed(3)}`);
    setText(timestampEl, cw && cw.time ? new Date(cw.time).toLocaleTimeString('id-ID', {weekday: 'short', month: 'short', day: 'numeric', hour:'2-digit', minute:'2-digit'}) : '—'); 
    setText(temperatureLarge, tempLabel(cw? cw.temperature : null));
    setText(weatherDescription, codeToText(cw? cw.weathercode : (daily && daily.weathercode? daily.weathercode[0] : null)));
    
    weatherIconLarge.innerHTML = iconFor(cw? cw.weathercode : 0);
    
    setText(minMaxTempEl, daily.temperature_2m_min && daily.temperature_2m_max ? `${tempLabel(daily.temperature_2m_min[0])} / ${tempLabel(daily.temperature_2m_max[0])}` : '—');
    
    const feelsLikeEl = $('feelsLike');
    if(feelsLikeEl){
      feelsLikeEl.textContent = `Terasa seperti ${tempLabel(cw? cw.temperature : null)}`;
    }

    if(daily && daily.time && daily.time.length > 0){
        setText(humidityEl, hourly && hourly.relativehumidity_2m ? Math.round(hourly.relativehumidity_2m[0]) + '%' : '—');
        setText(windEl, cw ? (Math.round(cw.windspeed*10)/10 + ' m/s') : '—');
        setText(uvIndexMax, daily.uv_index_max ? Math.round(daily.uv_index_max[0]) : '—');
        setText(aqi, daily.temperature_2m_min && daily.temperature_2m_max ? `${tempLabel(daily.temperature_2m_min[0])} / ${tempLabel(daily.temperature_2m_max[0])}` : '—');
        setText(sunsetTime, daily.sunset ? new Date(daily.sunset[0]).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '—');
        setText(precipitation, '—'); 
    } else {
        setText(humidityEl, '—');
        setText(windEl, '—');
        setText(uvIndexMax, '—');
        setText(aqi, '—');
        setText(sunsetTime, '—');
        setText(precipitation, '—');
    }

    forecastHourly.innerHTML = '';
    if(hourly && hourly.time){
      for(let i=0;i<Math.min(12, hourly.time.length); i++){
        const t = new Date(hourly.time[i]);
        const div = document.createElement('div');
        div.className = 'hour-item forecast-day-item'; 
        div.innerHTML = `<div class="muted">${t.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</div>
                         <div style="font-size:22px">${iconFor(hourly.weathercode ? hourly.weathercode[i] : 0)}</div>
                         <div style="font-weight:700">${tempLabel(hourly.temperature_2m[i])}</div>
                         <div class="muted">${hourly.relativehumidity_2m ? Math.round(hourly.relativehumidity_2m[i]) + '%' : ''}</div>`;
        forecastHourly.appendChild(div);
      }
    }

    forecastFive.innerHTML = '';
    if(daily && daily.time){
      for(let i=0;i<Math.min(daily.time.length, 10); i++){ 
        const d = daily.time[i];
        const dayName = new Date(d).toLocaleDateString('id-ID', {weekday:'short'});
        const tempMin = tempLabel(daily.temperature_2m_min[i]);
        const tempMax = tempLabel(daily.temperature_2m_max[i]);

        const div = document.createElement('div');
        div.className = 'forecast-day-item';
        div.innerHTML = `<div class="font-semibold">${dayName}</div>
                         <div style="font-size:24px; margin:5px 0">${iconFor(daily.weathercode[i])}</div>
                         <div style="font-weight:700">${tempMax}</div>
                         <div class="muted">${tempMin}</div>`;
        forecastFive.appendChild(div);
      }
    }

    setText(lastUpdated, new Date().toLocaleString('id-ID'));
    lastCoords = {lat, lon};
    localStorage.setItem('wp_lastCoords', JSON.stringify(lastCoords));
    localStorage.setItem('wp_lastCity', lastCity);
    renderNearbyLocations(); 
    renderFavorites();
  }catch(err){
    alert('Error: ' + err.message);
    console.error(err);
  }
}

async function fetchWeatherForCity(city) {
    try {
        const geo = await geocode(city);
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(geo.lat)}&longitude=${encodeURIComponent(geo.lon)}&current_weather=true&timezone=auto`;
        const res = await fetch(url);
        if(!res.ok) throw new Error('Weather fetch failed');
        const data = await res.json();
        
        const cw = data.current_weather;
        const temp = cw ? cw.temperature : null;
        const code = cw ? cw.weathercode : null;
        
        return {
            city: geo.label,
            temp: temp,
            description: codeToText(code),
            lat: geo.lat,
            lon: geo.lon
        };
    } catch (err) {
        return null;
    }
}

async function renderNearbyLocations() {
    if(!nearbyLocations) return;

    const currentCity = lastCity || 'Jakarta';
    const citiesToChooseFrom = majorCities.filter(c => c !== currentCity);
    const randomCities = shuffleArray(citiesToChooseFrom).slice(0, 10);

    nearbyLocations.innerHTML = '';

    const weatherPromises = randomCities.map(city => fetchWeatherForCity(city));
    const results = await Promise.all(weatherPromises);

    const validResults = results.filter(r => r !== null && r.temp !== null);
    
    if (validResults.length === 0) {
        nearbyLocations.innerHTML = '<div class="muted text-sm col-span-2">Tidak dapat memuat lokasi terdekat.</div>';
        return;
    }

    validResults.forEach(r => {
        const tempStr = tempLabel(r.temp);
        const tile = document.createElement('div');
        tile.className = 'favorites-list-item cursor-pointer'; 
        tile.setAttribute('onclick', `showByCity('${escapeHtml(r.city)}')`);
        tile.innerHTML = `<div><div class="font-semibold">${escapeHtml(r.city)}</div>
                          <div class="muted text-sm">${tempStr}</div>
                          <div class="muted text-sm">${escapeHtml(r.description)}</div></div>`;
        nearbyLocations.appendChild(tile);
    });
}


async function showByCity(city){
  try{
    const geo = await geocode(city);
    await showByCoords(geo.lat, geo.lon, geo.label);
  }catch(err){
    alert('Gagal mencari lokasi: ' + err.message);
  }
}

function renderFavorites(){
  if(!favoritesSection) return;
  if(!favorites || favorites.length===0){
    favoritesSection.innerText = 'Belum ada lokasi favorit yang ditambahkan.';
    return;
  }
  favoritesSection.innerHTML = '';
  favorites.forEach(f=>{
    const div = document.createElement('div');
    div.className = 'favorites-list-item cursor-pointer';
    div.innerHTML = `<div>${escapeHtml(f)}</div><div><button class="btn small" data-city="${escapeHtml(f)}">Muat</button></div>`;
    const btn = div.querySelector('button');
    btn.addEventListener('click', ()=> showByCity(f));
    favoritesSection.appendChild(div);
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  if (localStorage.getItem('wp_theme') === 'dark') {
      applyTheme(true);
  } else {
      applyTheme(false);
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      applyTheme(!isDarkTheme);
    });
  }
  
  if(tempToggleBtn){
      tempToggleBtn.addEventListener('click', ()=>{
          isCelsius = !isCelsius;
          if(tempToggleBtn) tempToggleBtn.textContent = isCelsius ? '°C' : '°F';
          if(lastCoords){
              showByCoords(lastCoords.lat, lastCoords.lon, lastCity);
          } else {
              showByCity(lastCity);
          }
      });
      tempToggleBtn.textContent = isCelsius ? '°C' : '°F';
  }

  let debounceTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimeout);
    const query = e.target.value.trim();
    if (query.length < 3) {
        renderSuggestions([]);
        return;
    }
    debounceTimeout = setTimeout(async () => {
        const suggestions = await fetchSuggestions(query);
        renderSuggestions(suggestions);
    }, 300); 

  });
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
        suggestionsBox.classList.add('hidden');
    }
  });

  searchInput.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){ 
        suggestionsBox.classList.add('hidden');
        const q = searchInput.value.trim(); 
        if(q) showByCity(q); 
    }
  });
  refreshBtn.addEventListener('click', ()=> {
    if(lastCoords) showByCoords(lastCoords.lat, lastCoords.lon, lastCity);
    else showByCity(lastCity);
  });
  
  if(favoriteBtn){
    favoriteBtn.addEventListener('click', ()=>{
      const name = locationName.textContent;
      if(!name || name==='—') return;
      if(favorites.includes(name)) {
        favorites = favorites.filter(x=>x!==name);
        alert(`Lokasi "${name}" dihapus dari favorit.`);
      } else {
        favorites.unshift(name);
        alert(`Lokasi "${name}" ditambahkan ke favorit.`);
      }
      localStorage.setItem('wp_favorites', JSON.stringify(favorites));
      renderFavorites();
    });
  }
  
  openMapBtn.addEventListener('click', ()=>{
    if(lastCoords && lastCoords.lat){
      window.open(`https://www.openstreetmap.org/?mlat=${lastCoords.lat}&mlon=${lastCoords.lon}#map=10/${lastCoords.lat}/${lastCoords.lon}`, '_blank');
    }else{
      alert('Tidak ada koordinat yang tersedia');
    }
  });

  const initialLoad = () => {
      if(!lastCity) lastCity = 'Jakarta';
      
      if (lastCoords && lastCoords.lat) {
          showByCoords(lastCoords.lat, lastCoords.lon, lastCity);
      } else if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(pos => {
              showByCoords(pos.coords.latitude, pos.coords.longitude, 'Lokasi Anda');
          }, err => {
              showByCity(lastCity);
          }, { timeout: 5000 });
      } else {
          showByCity(lastCity);
      }
  };

  initialLoad();
});