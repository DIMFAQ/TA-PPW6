// script.js - minimal frontend using Open-Meteo + Nominatim
const majorCities = ['Jakarta','Bandung','Surabaya','Yogyakarta','Denpasar','Medan','Makassar','London','New York','Tokyo','Paris'];
let favorites = JSON.parse(localStorage.getItem('wp_favorites') || '[]');
let lastCity = localStorage.getItem('wp_lastCity') || 'Jakarta';
let isCelsius = true;
let lastCoords = JSON.parse(localStorage.getItem('wp_lastCoords') || 'null');

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
const pressureEl = $('pressure');
const forecastHourly = $('forecastHourly');
const forecastFive = $('forecastFive');
const favoritesSection = $('favoritesSection');
const favoriteBtn = $('favoriteBtn') || null;
const refreshBtn = $('refreshBtn');
const openMapBtn = $('openMap');
const lastUpdated = $('lastUpdated');

// Helpers
function escapeHtml(s){ return String(s || '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
function setText(el, t){ if(!el) return; el.textContent = (t==null? '—': t); }
function tempLabel(c){ if(c==null) return '—'; return Math.round(isCelsius? c : (c*9/5+32)) + (isCelsius? '°C' : '°F'); }
function windLabel(mps){ if(mps==null) return '—'; return Math.round(mps*10)/10 + ' m/s'; }
function iconFor(code){ const map = {0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',61:'🌧️',63:'🌧️',65:'🌧️',71:'❄️',80:'🌧️',95:'⛈️'}; return map[code] || '🌤️'; }
function codeToText(code){ const map = {0:'Clear',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',48:'Depositing rime fog',51:'Light drizzle',61:'Rain',63:'Rain',65:'Heavy rain',71:'Snow',80:'Rain showers',95:'Thunderstorm'}; return map[code] || 'Unknown'; }

// Geocoding (Nominatim)
async function geocode(city){
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
  const res = await fetch(url, { headers:{ 'Accept-Language':'en' }});
  if(!res.ok) throw new Error('Geocode failed');
  const arr = await res.json();
  if(!arr || !arr[0]) throw new Error('Location not found');
  return { lat: parseFloat(arr[0].lat), lon: parseFloat(arr[0].lon), label: (arr[0].display_name || city).split(',')[0] };
}

// Open-Meteo fetch
async function fetchOpenMeteo(lat, lon){
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m,precipitation,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode,uv_index_max,sunset&forecast_days=5&timezone=auto`;
  // If you want to use server proxy: call api.php?url=<encodeURIComponent(url)>
  // Example: const proxy = `/api.php?url=${encodeURIComponent(url)}`; then fetch(proxy)
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
    setText(timestampEl, cw && cw.time ? new Date(cw.time).toLocaleString() : '—');
    setText(temperatureLarge, tempLabel(cw? cw.temperature : null));
    setText(weatherDescription, codeToText(cw? cw.weathercode : (daily && daily.weathercode? daily.weathercode[0] : null)));
    setText(humidityEl, hourly && hourly.relativehumidity_2m ? Math.round(hourly.relativehumidity_2m[0]) + '%' : '—');
    setText(windEl, cw ? (Math.round(cw.windspeed*10)/10 + ' m/s') : '—');
    setText(pressureEl, '—'); // not in open-meteo endpoint
    weatherIconLarge.innerText = iconFor(cw? cw.weathercode : 0);

    // hourly next 12
    forecastHourly.innerHTML = '';
    if(hourly && hourly.time){
      for(let i=0;i<Math.min(12, hourly.time.length); i++){
        const t = new Date(hourly.time[i]);
        const div = document.createElement('div');
        div.className = 'hour-item';
        div.innerHTML = `<div class="muted">${t.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                         <div style="font-size:22px">${iconFor(hourly.weathercode ? hourly.weathercode[i] : 0)}</div>
                         <div style="font-weight:700">${tempLabel(hourly.temperature_2m[i])}</div>
                         <div class="muted">${hourly.relativehumidity_2m ? Math.round(hourly.relativehumidity_2m[i]) + '%' : ''}</div>`;
        forecastHourly.appendChild(div);
      }
    }

    // daily 5-day
    forecastFive.innerHTML = '';
    if(daily && daily.time){
      for(let i=0;i<Math.min(daily.time.length, 5); i++){
        const d = daily.time[i];
        const tile = document.createElement('div');
        tile.className = 'card-inner';
        tile.innerHTML = `<div class="muted">${new Date(d).toLocaleDateString(undefined, {weekday:'short', month:'short', day:'numeric'})}</div>
                          <div style="font-size:20px; margin-top:6px">${iconFor(daily.weathercode[i])}</div>
                          <div class="muted">${codeToText(daily.weathercode[i])}</div>
                          <div style="font-weight:700; margin-top:6px">${tempLabel(daily.temperature_2m_min[i])} / ${tempLabel(daily.temperature_2m_max[i])}</div>`;
        forecastFive.appendChild(tile);
      }
    }

    setText(lastUpdated, new Date().toLocaleString());
    // persist
    lastCoords = {lat, lon};
    lastCity = label;
    localStorage.setItem('wp_lastCoords', JSON.stringify(lastCoords));
    localStorage.setItem('wp_lastCity', lastCity);
    renderFavorites();
  }catch(err){
    alert('Error: ' + err.message);
    console.error(err);
  }
}

async function showByCity(city){
  try{
    const geo = await geocode(city);
    await showByCoords(geo.lat, geo.lon, geo.label);
  }catch(err){
    alert('Lookup failed: ' + err.message);
  }
}

function renderFavorites(){
  if(!favorites || favorites.length===0){
    favoritesSection.innerText = 'No favorites';
    return;
  }
  favoritesSection.innerHTML = '';
  favorites.forEach(f=>{
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.justifyContent = 'space-between';
    div.style.alignItems = 'center';
    div.style.marginBottom = '6px';
    div.innerHTML = `<div>${escapeHtml(f)}</div><div><button class="btn small" data-city="${escapeHtml(f)}">Load</button></div>`;
    const btn = div.querySelector('button');
    btn.addEventListener('click', ()=> showByCity(f));
    favoritesSection.appendChild(div);
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  // UI bindings
  searchInput.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){ const q = searchInput.value.trim(); if(q) showByCity(q); }
  });
  refreshBtn.addEventListener('click', ()=> {
    if(lastCoords) showByCoords(lastCoords.lat, lastCoords.lon, lastCity);
    else showByCity(lastCity);
  });
  if(favoriteBtn){
    favoriteBtn.addEventListener('click', ()=>{
      const name = locationName.textContent;
      if(!name || name==='—') return;
      if(favorites.includes(name)) favorites = favorites.filter(x=>x!==name);
      else favorites.unshift(name);
      localStorage.setItem('wp_favorites', JSON.stringify(favorites));
      renderFavorites();
    });
  }
  openMapBtn.addEventListener('click', ()=>{
    if(lastCoords && lastCoords.lat){
      window.open(`https://www.openstreetmap.org/?mlat=${lastCoords.lat}&mlon=${lastCoords.lon}#map=10/${lastCoords.lat}/${lastCoords.lon}`, '_blank');
    }else{
      alert('No coordinate available');
    }
  });

  renderFavorites();
  // initial load: try geolocation then fallback to lastCity
  if(lastCoords && lastCoords.lat){
    showByCoords(lastCoords.lat, lastCoords.lon, lastCity);
  } else if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(pos=>{
      showByCoords(pos.coords.latitude, pos.coords.longitude, 'Your location');
    }, err=>{
      showByCity(lastCity);
    }, {timeout:5000});
  } else {
    showByCity(lastCity);
  }
});
