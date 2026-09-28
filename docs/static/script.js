// ==================== STATIC DATA (fully client-side, no backend) ====================
const LOCATION_DATABASE = {
    "Mumbai": {
        lat: 19.0760, lon: 72.8777,
        description: "Metropolitan coastal city known for finance, entertainment, and commerce",
        population: "20.96 million", climate: "Tropical monsoon climate",
        attractions: ["Gateway of India", "Marine Drive", "Taj Mahal Palace Hotel", "Elephanta Caves"],
        best_time: "October to May", cuisine: "North Indian, Coastal seafood, Street food",
        transport: "Local trains, buses, auto-rickshaws, metro", industries: "Finance, Film, IT, Tourism"
    },
    "Delhi": {
        lat: 28.7041, lon: 77.1025,
        description: "Capital city of India, blending ancient history with modern development",
        population: "32.94 million", climate: "Semi-arid subtropical climate",
        attractions: ["Red Fort", "India Gate", "Jama Masjid", "Qutb Minar", "Lotus Temple"],
        best_time: "October to March", cuisine: "Mughlai, Punjabi, Street food",
        transport: "Metro, DTC buses, auto-rickshaws", industries: "Government, IT, Tourism, Education"
    },
    "Bangalore": {
        lat: 12.9716, lon: 77.5946,
        description: "IT hub of India with pleasant climate and vibrant tech culture",
        population: "8.44 million", climate: "Tropical highland climate",
        attractions: ["Lalbagh Garden", "Vidhana Soudha", "Bangalore Palace", "ISKCON Temple"],
        best_time: "October to February", cuisine: "South Indian, Coastal, Continental",
        transport: "Metro, buses, auto-rickshaws, app-based cabs", industries: "Information Technology, Biotechnology, Aerospace"
    },
    "Goa": {
        lat: 15.4909, lon: 73.8278,
        description: "Coastal paradise known for beaches, churches, and laid-back lifestyle",
        population: "1.47 million", climate: "Tropical monsoon climate",
        attractions: ["Baga Beach", "Basilica of Bom Jesus", "Fort Aguada", "Dudhsagar Falls"],
        best_time: "November to March", cuisine: "Goan seafood, Portuguese-influenced",
        transport: "Taxis, motorcycles, buses", industries: "Tourism, Agriculture, Mining, Fishing"
    },
    "Kolkata": {
        lat: 22.5726, lon: 88.3639,
        description: "Cultural capital of India with rich literary and artistic heritage",
        population: "14.7 million", climate: "Subtropical climate with monsoon",
        attractions: ["Victoria Memorial", "Howrah Bridge", "Belur Math", "Indian Museum"],
        best_time: "November to February", cuisine: "Bengali cuisine, Fish curry, Sweets",
        transport: "Metro, trams, buses, auto-rickshaws", industries: "Education, Publishing, Cinema, Tourism"
    },
    "Jaipur": {
        lat: 26.9124, lon: 75.7873,
        description: "Pink City known for its magnificent architecture and royal heritage",
        population: "3.73 million", climate: "Hot semi-arid climate",
        attractions: ["City Palace", "Jantar Mantar", "Hawa Mahal", "Albert Hall Museum"],
        best_time: "October to March", cuisine: "Rajasthani, Marwari cuisine",
        transport: "Buses, auto-rickshaws, taxis", industries: "Tourism, Handicrafts, Textiles, Gemstones"
    },
    "Chennai": {
        lat: 13.0827, lon: 80.2707,
        description: "Major Bay of Bengal port city, gateway to South India's culture and automobile industry",
        population: "11.5 million", climate: "Tropical wet and dry climate",
        attractions: ["Marina Beach", "Kapaleeshwarar Temple", "Fort St. George", "San Thome Basilica"],
        best_time: "November to February", cuisine: "Tamil cuisine, Filter coffee, Dosa varieties",
        transport: "Metro, MTC buses, suburban trains, auto-rickshaws", industries: "Automobile, IT, Healthcare, Port trade"
    },
    "Kochi": {
        lat: 9.9312, lon: 76.2673,
        description: "Historic Arabian Sea port city famed for its backwaters, spice trade, and Chinese fishing nets",
        population: "2.1 million", climate: "Tropical monsoon climate",
        attractions: ["Fort Kochi", "Chinese Fishing Nets", "Mattancherry Palace", "Marine Drive Kochi"],
        best_time: "October to March", cuisine: "Kerala seafood, Appam, Karimeen curry",
        transport: "Kochi Metro, ferries, auto-rickshaws, buses", industries: "Shipping, Tourism, Spice trade, IT"
    },
    "Visakhapatnam": {
        lat: 17.6868, lon: 83.2185,
        description: "Major eastern seaboard port city and naval base overlooking the Bay of Bengal",
        population: "2.35 million", climate: "Tropical savanna climate",
        attractions: ["RK Beach", "Kailasagiri", "Submarine Museum", "Araku Valley"],
        best_time: "October to February", cuisine: "Andhra cuisine, Spicy seafood",
        transport: "Buses, auto-rickshaws, suburban trains", industries: "Shipping, Steel, Naval defense, Tourism"
    },
    "Surat": {
        lat: 21.1702, lon: 72.8311,
        description: "Diamond and textile hub on the Gujarat coast along the Tapi river estuary",
        population: "7.5 million", climate: "Tropical wet and dry climate",
        attractions: ["Dumas Beach", "Surat Castle", "Dutch Garden", "Sardar Patel Museum"],
        best_time: "November to February", cuisine: "Gujarati cuisine, Surti locho, Undhiyu",
        transport: "City buses, BRTS, auto-rickshaws", industries: "Diamond polishing, Textiles, Chemicals"
    }
};

// Curated Potential Fishing Zones (PFZ-style) along the Indian coastline
const FISHING_ZONES = [
    { name: "Ratnagiri Coastal Waters", region: "Maharashtra", lat: 16.98, lon: 73.10, species: "Pomfret, Mackerel, Tuna",
      description: "A productive stretch off the Konkan coast where upwelling currents draw pomfret and mackerel shoals close to shore during the post-monsoon season." },
    { name: "Veraval Fishing Grounds", region: "Gujarat", lat: 20.90, lon: 70.10, species: "Bombay Duck, Prawns, Ribbonfish",
      description: "One of India's busiest fishing harbours, with shallow continental-shelf waters rich in bombay duck and prawn stocks year-round." },
    { name: "Kochi Backwater Coast", region: "Kerala", lat: 9.90, lon: 76.10, species: "Sardine, Mackerel, Shrimp",
      description: "Nutrient-rich waters near the Kochi estuary mouth that support dense sardine and shrimp aggregations, especially before the southwest monsoon." },
    { name: "Chennai Coastal Belt", region: "Tamil Nadu", lat: 13.05, lon: 80.35, species: "Seer fish, Tuna, Prawns",
      description: "A traditional Bay of Bengal fishing ground favoured by local trawlers for seer fish and tuna, best fished in calmer post-monsoon months." },
    { name: "Visakhapatnam Deep Sea Zone", region: "Andhra Pradesh", lat: 17.70, lon: 83.45, species: "Tuna, Shark, Mackerel",
      description: "Deeper offshore waters off Vizag known for larger pelagic species like tuna and shark, requiring bigger vessels and longer trips." },
    { name: "Paradip Fishing Harbour Waters", region: "Odisha", lat: 20.30, lon: 86.80, species: "Hilsa, Pomfret, Prawns",
      description: "Estuarine-influenced waters near the Mahanadi delta that see strong hilsa runs during the monsoon and post-monsoon period." },
    { name: "Goa Continental Shelf", region: "Goa", lat: 15.35, lon: 73.60, species: "Mackerel, Sardine, Kingfish",
      description: "A shallow, well-monitored shelf zone off Goa's coastline offering steady mackerel and kingfish catches for small and medium boats." },
    { name: "Mumbai Offshore Bank", region: "Maharashtra", lat: 18.90, lon: 72.60, species: "Bombay Duck, Pomfret",
      description: "A historic fishing bank serving Mumbai's Sassoon Dock fleet, valued for bombay duck and pomfret close to the metropolitan coastline." },
    { name: "Tuticorin Gulf of Mannar Zone", region: "Tamil Nadu", lat: 8.75, lon: 78.25, species: "Sardine, Tuna, Shrimp",
      description: "Waters within the biodiverse Gulf of Mannar, balancing active sardine and shrimp fisheries with nearby marine protected areas." },
    { name: "Digha Coastal Waters", region: "West Bengal", lat: 21.60, lon: 87.65, species: "Hilsa, Bhetki, Prawns",
      description: "Shallow Bay of Bengal waters off Digha popular with West Bengal's fishing fleet for hilsa and bhetki, especially in cooler months." },
    { name: "Mangalore Fishing Grounds", region: "Karnataka", lat: 12.85, lon: 74.75, species: "Mackerel, Sardine, Squid",
      description: "A busy Arabian Sea fishing ground off Karnataka's coast supplying Mangalore's harbours with mackerel and squid catches." },
    { name: "Kakinada Bay Zone", region: "Andhra Pradesh", lat: 16.95, lon: 82.35, species: "Prawns, Crab, Pomfret",
      description: "Sheltered bay waters near the Godavari delta known for prawn and crab farming grounds alongside wild-catch pomfret." },
    { name: "Puri Coastal Belt", region: "Odisha", lat: 19.80, lon: 85.90, species: "Hilsa, Prawns, Catfish",
      description: "Traditional Odisha fishing waters near Puri, seasonally rich in hilsa runs and catfish close to the shoreline." },
    { name: "Alappuzha Backwater Coast", region: "Kerala", lat: 9.45, lon: 76.20, species: "Pearl Spot, Shrimp, Sardine",
      description: "Backwater-influenced coastal waters off Alappuzha, a key source of pearl spot (karimeen) and shrimp for Kerala's fisheries." },
];

// WMO weather codes -> short human readable description
const WEATHER_CODE_DESCRIPTIONS = {
    0: "Clear sky", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing rime fog",
    51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
    80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
    95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Severe thunderstorm with hail",
};

const COMMON_SMALL_TALK = new Set([
    "hi", "hello", "hey", "hey there", "thanks", "thank you", "ok", "okay",
    "bye", "goodbye", "good morning", "good evening", "good night", "yes", "no",
    "help", "who are you", "how are you", "what can you do", "hola",
]);

// Localization layer: regional language options for translating assistant replies
const LANGUAGE_OPTIONS = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'Hindi' },
    { code: 'ta', label: 'Tamil' },
    { code: 'te', label: 'Telugu' },
    { code: 'bn', label: 'Bengali' },
    { code: 'mr', label: 'Marathi' },
    { code: 'gu', label: 'Gujarati' },
    { code: 'kn', label: 'Kannada' },
    { code: 'ml', label: 'Malayalam' },
    { code: 'pa', label: 'Punjabi' },
    { code: 'or', label: 'Odia' },
];

const SPEECH_LOCALES = {
    en: 'en-IN',
    hi: 'hi-IN',
    ta: 'ta-IN',
    te: 'te-IN',
    bn: 'bn-IN',
    mr: 'mr-IN',
    gu: 'gu-IN',
    kn: 'kn-IN',
    ml: 'ml-IN',
    pa: 'pa-IN',
    or: 'or-IN',
};

const SPEECH_LANGUAGE_ALIASES = {
    en: ['en-in', 'en-us', 'en-gb', 'en'],
    hi: ['hi-in', 'hi'],
    ta: ['ta-in', 'ta'],
    te: ['te-in', 'te'],
    bn: ['bn-in', 'bn-bd', 'bn'],
    mr: ['mr-in', 'mr'],
    gu: ['gu-in', 'gu'],
    kn: ['kn-in', 'kn'],
    ml: ['ml-in', 'ml'],
    pa: ['pa-in', 'pa-pk', 'pa'],
    or: ['or-in', 'or'],
};

// Free, keyless public APIs called directly from the browser (CORS-enabled) — no server needed
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WIKIPEDIA_SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/";
const MARINE_FORECAST_URL = "https://marine-api.open-meteo.com/v1/marine";
const WEATHER_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const TRANSLATE_URL = "https://api.mymemory.translated.net/get";
const MAX_TRANSLATION_WORDS = 4000;
const TRANSLATION_CHUNK_CHARACTERS = 450;

// ==================== STATE ====================
let map;
let activeMarker = null;
let activeCircle = null;
let originMarker = null;
let routeLine = null;
let fishingMarkers = [];
let selectedLanguage = 'en';
let missionRouteMetadata = null;

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    setupTabs();
    setupSearch();
    setupChat();
    setupLanguageSelect();
    loadAllKnownLocations();
    loadFishingZones();
    checkMissionBackend();
});

// AI Mission Mode needs the Flask backend (ui.py) - it has no client-side
// fallback. Probe a lightweight existing endpoint on load so a clear warning
// shows up front instead of a confusing failure after the user tries it.
async function checkMissionBackend() {
    let reachable = false;
    try {
        const res = await fetch('/api/get-locations', { cache: 'no-store' });
        reachable = res.ok;
    } catch (err) {
        reachable = false;
    }

    if (reachable) return;

    const banner = document.getElementById('backendWarningBanner');
    if (banner) {
        banner.classList.remove('hidden');
        const closeBtn = document.getElementById('backendWarningClose');
        if (closeBtn) closeBtn.addEventListener('click', () => banner.classList.add('hidden'));
    }

}

function setupTabs() {
    const tabs = document.querySelectorAll('.top-tab');
    const panels = document.querySelectorAll('.tab-panel');

    tabs.forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));

    function switchTab(tabName) {
        tabs.forEach(tab => {
            const isActive = tab.dataset.tab === tabName;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', String(isActive));
        });
        panels.forEach(panel => {
            const isActive = panel.id === `tab-${tabName}`;
            panel.classList.toggle('active', isActive);
            panel.hidden = !isActive;
        });

        if (tabName === 'home' && map) {
            requestAnimationFrame(() => map.invalidateSize());
        }
    }

    window.switchTab = switchTab;
}

// Keyless basemap styles, mirrored in ui.py's TILE_STYLES whitelist. Each style
// needs its own direct fallback URL for when the backend proxy is unreachable.
const STYLE_FALLBACK_URLS = {
    standard: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    humanitarian: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    topo: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
};

// Builds a tile layer routed through our backend proxy (User-Agent/Referer
// identification, rate-limit backoff, caching) with an automatic fallback to
// a free/keyless mirror if the proxy is unreachable (e.g. standalone mode).
function buildProxiedTileLayer(style, attribution) {
    const proxyTileUrl = `/api/tiles/{z}/{x}/{y}.png?style=${encodeURIComponent(style)}`;
    const fallbackTileUrl = STYLE_FALLBACK_URLS[style] || STYLE_FALLBACK_URLS.standard;
    const MAX_TILE_FALLBACK_RETRIES = 2; // safety cap so a persistent failure can't retry forever
    const tileRetryCounts = new WeakMap();

    const layer = L.tileLayer(proxyTileUrl, { maxZoom: 19, minZoom: 0, attribution });

    layer.on('tileerror', (error) => {
        const tile = error.tile;
        const coords = error.coords;
        if (!tile || !coords) return;

        const retries = tileRetryCounts.get(tile) || 0;
        if (retries >= MAX_TILE_FALLBACK_RETRIES) return;
        tileRetryCounts.set(tile, retries + 1);

        tile.src = fallbackTileUrl
            .replace('{z}', coords.z)
            .replace('{x}', coords.x)
            .replace('{y}', coords.y);
    });

    return layer;
}

function initMap() {
    try {
        map = L.map('map', {
            zoomControl: true,
            attributionControl: false,
            zoomSnap: 1,         // integer zoom steps, matching openstreetmap.org
            zoomDelta: 1,
            minZoom: 0,          // full world zoom range, same as openstreetmap.org
            maxZoom: 19,
            worldCopyJump: true, // continuous horizontal panning across the antimeridian, like osm.org
            fadeAnimation: true,
            markerZoomAnimation: true,
        }).setView([20.5937, 78.9629], 6); // closer initial view over India than before
    } catch (err) {
        console.error('Failed to initialize map:', err);
        return;
    }

    // Registering the attribution control (even with the map's own built-in
    // one disabled) makes Leaflet auto-add/remove each layer's `attribution`
    // text as the user switches base layers below - no manual bookkeeping needed.
    L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);

    const osmAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors';

    const terrainLayer = buildProxiedTileLayer('topo', `${osmAttribution}, SRTM &mdash; Style: &copy; <a href="https://opentopomap.org" target="_blank">OpenTopoMap</a> (CC-BY-SA)`);
    terrainLayer.addTo(map);

    // Metric scale bar so zoomed-in distances are easy to read
    L.control.scale({ position: 'bottomleft', metric: true, imperial: false }).addTo(map);
}

function setupLanguageSelect() {
    const select = document.getElementById('languageSelect');
    if (!select) return;
    select.innerHTML = LANGUAGE_OPTIONS.map(l => `<option value="${l.code}">${l.label}</option>`).join('');
    select.addEventListener('change', () => { selectedLanguage = select.value; });
}

// Translates text between languages via a free translation API. Defaults to
// English -> target (for AI replies); pass sourceLangCode explicitly to
// translate user input the other way (e.g. regional language -> English).
async function translateText(text, targetLangCode, sourceLangCode = 'en') {
    if (!text || targetLangCode === sourceLangCode) return null;
    try {
        const words = text.trim().split(/\s+/).slice(0, MAX_TRANSLATION_WORDS);
        const chunks = [];
        let currentChunk = '';

        for (const word of words) {
            const candidate = currentChunk ? `${currentChunk} ${word}` : word;
            if (currentChunk && candidate.length > TRANSLATION_CHUNK_CHARACTERS) {
                chunks.push(currentChunk);
                currentChunk = word;
            } else {
                currentChunk = candidate;
            }
        }
        if (currentChunk) chunks.push(currentChunk);

        const translatedChunks = [];
        for (const chunk of chunks) {
            const res = await fetch(`${TRANSLATE_URL}?q=${encodeURIComponent(chunk)}&langpair=${sourceLangCode}|${targetLangCode}`);
            if (!res.ok) return null;
            const data = await res.json();
            const translatedChunk = data.responseData && data.responseData.translatedText;
            if (!translatedChunk) return null;
            translatedChunks.push(translatedChunk);
        }

        return translatedChunks.join(' ');
    } catch (err) {
        return null;
    }
}

// Updates the floating weather-stats window with coordinates + live conditions for the mapped point
function updateWeatherStatsBox(name, lat, lon, marine) {
    const box = document.getElementById('weatherStatsBox');
    if (!box) return;

    if (typeof lat !== 'number' || typeof lon !== 'number') {
        box.classList.add('hidden');
        return;
    }

    const status = (marine && marine.safety_status) || null;
    const statusLabel = { safe: 'Safe', caution: 'Caution', danger: 'Danger' }[status] || 'n/a';

    box.classList.remove('hidden');
    box.innerHTML = `
        <div class="wsb-title"><i class="fas fa-location-dot"></i> ${escapeHtml(name)}</div>
        <div class="wsb-coords">${lat.toFixed(3)}°, ${lon.toFixed(3)}°</div>
        <div class="wsb-stats">
            <span><i class="fas fa-temperature-half"></i> ${marine && marine.temperature_c != null ? `${marine.temperature_c}°C` : 'n/a'}</span>
            <span><i class="fas fa-water"></i> ${marine && marine.wave_height_m != null ? `${marine.wave_height_m} m` : 'n/a'}</span>
            <span><i class="fas fa-wind"></i> ${marine && marine.wind_speed_kmh != null ? `${marine.wind_speed_kmh} km/h` : 'n/a'}</span>
        </div>
        ${status ? `<div class="wsb-status safety-${status}">${statusLabel}</div>` : ''}
    `;
}

// Mark every curated location on the map with a descriptive tooltip so the map isn't empty on first load
function loadAllKnownLocations() {
    Object.entries(LOCATION_DATABASE).forEach(([name, details]) => {
        L.circleMarker([details.lat, details.lon], {
            radius: 7,
            color: '#4FD1E8',
            fillColor: '#4FD1E8',
            fillOpacity: 0.6,
            weight: 2
        })
            .addTo(map)
            .bindTooltip(`<b>${escapeHtml(name)}</b><br>${escapeHtml(details.description)}`, { direction: 'top' })
            .on('click', () => askAboutMarker(`Tell me about ${name}`));
    });
}

// ==================== GEO MATH (distance & direction, no backend needed) ====================
function toRad(deg) { return deg * Math.PI / 180; }
function toDeg(rad) { return rad * 180 / Math.PI; }

function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearingCompass(lat1, lon1, lat2, lon2) {
    const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
    const brng = (toDeg(Math.atan2(y, x)) + 360) % 360;
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return dirs[Math.round(brng / 22.5) % 16];
}

function findNearestFishingZone(lat, lon) {
    let nearest = null, minDist = Infinity;
    FISHING_ZONES.forEach(zone => {
        const d = haversineKm(lat, lon, zone.lat, zone.lon);
        if (d < minDist) { minDist = d; nearest = zone; }
    });
    if (!nearest) return null;
    return {
        ...nearest,
        distance_km: Math.round(minDist * 10) / 10,
        bearing: bearingCompass(lat, lon, nearest.lat, nearest.lon),
    };
}

// ==================== LIVE DATA (direct browser calls to public APIs) ====================
async function geocodePlace(query) {
    try {
        const res = await fetch(`${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
        if (!res.ok) return null;
        const data = await res.json();
        return (data.results && data.results[0]) || null;
    } catch (err) {
        return null;
    }
}

async function fetchWikipediaSummary(title) {
    try {
        const res = await fetch(WIKIPEDIA_SUMMARY_URL + encodeURIComponent(title));
        if (!res.ok) return null;
        const data = await res.json();
        return data.extract || null;
    } catch (err) {
        return null;
    }
}

function assessMarineSafety(waveHeight, windSpeedKmh, weatherCode) {
    let status = 'safe';
    const reasons = [];

    if ([95, 96, 99].includes(weatherCode)) {
        status = 'danger';
        reasons.push('Thunderstorm activity in the area');
    }
    if (waveHeight != null) {
        if (waveHeight >= 2.5) { status = 'danger'; reasons.push(`High waves (${waveHeight} m)`); }
        else if (waveHeight >= 1.5 && status !== 'danger') { status = 'caution'; reasons.push(`Moderate waves (${waveHeight} m)`); }
    }
    if (windSpeedKmh != null) {
        if (windSpeedKmh >= 40) { status = 'danger'; reasons.push(`Strong winds (${windSpeedKmh} km/h)`); }
        else if (windSpeedKmh >= 25 && status !== 'danger') { status = 'caution'; reasons.push(`Breezy conditions (${windSpeedKmh} km/h)`); }
    }
    if (!reasons.length) reasons.push('Calm sea and clear weather');

    return { status, reasons };
}

// ORCA "ocean analytics" + "weather intelligence" agents, running entirely client-side
async function fetchMarineConditions(lat, lon) {
    try {
        const [marineRes, weatherRes] = await Promise.all([
            fetch(`${MARINE_FORECAST_URL}?latitude=${lat}&longitude=${lon}&current=wave_height,wave_direction,wave_period,swell_wave_height&timezone=auto`),
            fetch(`${WEATHER_FORECAST_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code,precipitation&timezone=auto`),
        ]);
        const marineCurrent = (await marineRes.json()).current || {};
        const weatherCurrent = (await weatherRes.json()).current || {};

        const waveHeight = marineCurrent.wave_height;
        const windSpeed = weatherCurrent.wind_speed_10m;
        const weatherCode = weatherCurrent.weather_code;
        const { status, reasons } = assessMarineSafety(waveHeight, windSpeed, weatherCode);

        return {
            wave_height_m: waveHeight,
            wave_period_s: marineCurrent.wave_period,
            swell_wave_height_m: marineCurrent.swell_wave_height,
            wind_speed_kmh: windSpeed,
            wind_direction_deg: weatherCurrent.wind_direction_10m,
            temperature_c: weatherCurrent.temperature_2m,
            precipitation_mm: weatherCurrent.precipitation,
            weather_description: WEATHER_CODE_DESCRIPTIONS[weatherCode] || 'Unknown',
            safety_status: status,
            safety_reasons: reasons,
        };
    } catch (err) {
        return null;
    }
}

// AI-agent-style discovery for any place on Earth: geocode + Wikipedia + live marine conditions
async function discoverPlace(query) {
    const geo = await geocodePlace(query);
    if (!geo) return null;

    const shortName = geo.name || query;
    const region = geo.admin1;
    const country = geo.country || 'Unknown';
    const fullAddress = [shortName, region, country].filter(Boolean).join(', ');
    const summary = (await fetchWikipediaSummary(shortName)) || (await fetchWikipediaSummary(query));

    const lat = parseFloat(geo.latitude);
    const lon = parseFloat(geo.longitude);
    const marine = await fetchMarineConditions(lat, lon);

    return {
        lat, lon,
        description: summary || `${shortName} — ${fullAddress}`,
        full_address: fullAddress,
        place_type: geo.feature_code || 'Place',
        country,
        population: geo.population ? geo.population.toLocaleString() : null,
        source: 'live',
        marine,
    };
}

function findCuratedMatch(placeCandidate) {
    if (!placeCandidate) return null;
    return Object.entries(LOCATION_DATABASE).find(([name]) =>
        placeCandidate.includes(name.toLowerCase()) || name.toLowerCase().includes(placeCandidate)) || null;
}

async function resolveCoordinates(placeCandidate) {
    const curated = findCuratedMatch(placeCandidate);
    if (curated) return { lat: curated[1].lat, lon: curated[1].lon, label: curated[0] };

    const geo = await geocodePlace(placeCandidate);
    if (!geo) return null;
    return { lat: parseFloat(geo.latitude), lon: parseFloat(geo.longitude), label: geo.name || titleCase(placeCandidate) };
}

function titleCase(str) {
    return str.replace(/\b\w/g, c => c.toUpperCase());
}

// ==================== FISHING ZONES PANEL ====================
async function loadFishingZones() {
    const subtitle = document.getElementById('fishingSubtitle');
    if (subtitle) subtitle.textContent = 'Fetching live conditions...';

    const zonesWithData = await Promise.all(FISHING_ZONES.map(async zone => ({
        ...zone,
        marine: await fetchMarineConditions(zone.lat, zone.lon),
    })));

    renderFishingZonesList(zonesWithData);
    markFishingZonesOnMap(zonesWithData);

    if (subtitle) subtitle.textContent = `${zonesWithData.length} known fishing zones along the Indian coast`;
}

function renderFishingZonesList(zones) {
    const container = document.getElementById('fishingZonesList');
    if (!container) return;

    const critical = zones.filter(z => z.marine && z.marine.safety_status !== 'safe');
    const criticalHtml = critical.length ? `
        <div class="critical-alerts-box">
            <h4><i class="fas fa-triangle-exclamation"></i> Critical Areas (${critical.length})</h4>
            ${critical.map(z => `
                <div class="critical-alert-item safety-${z.marine.safety_status}">
                    <span class="alert-name">${escapeHtml(z.name)}</span>
                    <span class="alert-reason">${escapeHtml(z.marine.safety_reasons.join('; '))}</span>
                </div>`).join('')}
        </div>` : `
        <div class="critical-alerts-box safety-safe">
            <i class="fas fa-check-circle"></i> No critical alerts currently
        </div>`;

    const zonesHtml = zones.map(renderFishingZoneCard).join('');

    container.innerHTML = `${criticalHtml}<div class="fishing-zone-cards">${zonesHtml}</div>`;

    container.querySelectorAll('.fishing-zone-card').forEach(card => {
        card.addEventListener('click', () => {
            const zone = FISHING_ZONES.find(z => z.name === card.dataset.zone);
            if (zone) focusMapOnFishingZone(zone);
        });
    });
}

function renderFishingZoneCard(zone) {
    const status = (zone.marine && zone.marine.safety_status) || 'safe';
    const statusLabel = { safe: 'Safe', caution: 'Caution', danger: 'Danger' }[status] || 'Unknown';
    const wave = zone.marine && zone.marine.wave_height_m != null ? `${zone.marine.wave_height_m} m` : 'n/a';
    const wind = zone.marine && zone.marine.wind_speed_kmh != null ? `${zone.marine.wind_speed_kmh} km/h` : 'n/a';
    const temp = zone.marine && zone.marine.temperature_c != null ? `${zone.marine.temperature_c}°C` : 'n/a';
    const weather = zone.marine ? zone.marine.weather_description : 'n/a';

    return `
        <div class="fishing-zone-card safety-${status}" data-zone="${escapeHtml(zone.name)}">
            <div class="fzc-header">
                <span class="fzc-name"><i class="fas fa-location-crosshairs"></i> ${escapeHtml(zone.name)}</span>
                <span class="fzc-badge safety-${status}">${statusLabel}</span>
            </div>
            <p class="fzc-region">${escapeHtml(zone.region)}</p>
            <p class="fzc-description">${escapeHtml(zone.description || '')}</p>
            <p class="fzc-species"><i class="fas fa-fish"></i> ${escapeHtml(zone.species)}</p>
            <div class="fzc-conditions">
                <span><i class="fas fa-temperature-half"></i> ${temp}</span>
                <span><i class="fas fa-water"></i> ${wave}</span>
                <span><i class="fas fa-wind"></i> ${wind}</span>
                <span><i class="fas fa-cloud"></i> ${escapeHtml(weather)}</span>
            </div>
        </div>`;
}

function markFishingZonesOnMap(zones) {
    fishingMarkers.forEach(m => map.removeLayer(m));
    fishingMarkers = [];

    const safetyColors = { safe: '#3DDC84', caution: '#F5A623', danger: '#E8453C' };

    zones.forEach(zone => {
        const status = (zone.marine && zone.marine.safety_status) || 'safe';
        const color = safetyColors[status] || '#3DDC84';
        const isCritical = status !== 'safe';

        const icon = L.divIcon({
            className: `fishing-zone-icon ${isCritical ? `pulse-marker safety-${status}` : ''}`,
            html: `<i class="fas fa-fish" style="color:${color}"></i>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
        });

        const marker = L.marker([zone.lat, zone.lon], { icon }).addTo(map)
            .bindTooltip(`<b>${escapeHtml(zone.name)}</b><br>${escapeHtml(zone.region)} — ${status.toUpperCase()}`, { direction: 'top' })
            .on('click', () => askAboutMarker(`Nearest fishing zone from ${zone.region}`));

        fishingMarkers.push(marker);
    });
}

function focusMapOnFishingZone(zone) {
    renderLocationDetails(zone.name, {
        lat: zone.lat, lon: zone.lon,
        description: `${zone.description || ''} Common catch: ${zone.species}.`,
        full_address: zone.region,
        marine: zone.marine,
        source: 'fishing-zone',
    });
    focusMapOn(zone.name, { lat: zone.lat, lon: zone.lon, marine: zone.marine });
}

// ==================== SEARCH ====================
function setupSearch() {
    const input = document.getElementById('locationSearch');
    const btn = document.getElementById('searchBtn');

    btn.addEventListener('click', () => runSearch());
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') runSearch();
    });
}

function runSearch() {
    const input = document.getElementById('locationSearch');
    const query = input.value.trim();
    if (!query) return;
    searchLocation(query);
}

async function searchLocation(query) {
    setDetailsLoading();

    const normalized = query.trim().toLowerCase();
    const curated = findCuratedMatch(normalized);

    if (curated) {
        const [name, details] = curated;
        const marine = await fetchMarineConditions(details.lat, details.lon);
        const data = { ...details, marine };
        renderLocationDetails(name, data);
        focusMapOn(name, data);
        return;
    }

    const discovered = await discoverPlace(query);
    if (discovered) {
        renderLocationDetails(titleCase(query.trim()), discovered);
        focusMapOn(titleCase(query.trim()), discovered);
    } else {
        renderNotFound(`Couldn't recognize "${query}". Try a different spelling or a nearby well-known place.`);
    }
}

function setDetailsLoading() {
    document.getElementById('detailsSubtitle').textContent = 'Searching...';
    document.getElementById('locationDetails').innerHTML = `
        <div class="empty-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Looking up location...</p>
        </div>`;
}

function renderNotFound(message) {
    document.getElementById('detailsSubtitle').textContent = 'Location not found';
    document.getElementById('locationDetails').innerHTML = `
        <div class="empty-state">
            <i class="fas fa-map-marker-alt"></i>
            <p>${escapeHtml(message)}</p>
            <p class="hint">Try searching for: Mumbai, Delhi, Bangalore, Goa, Kolkata, Jaipur, or any coastal town worldwide</p>
        </div>`;
}

function renderLocationDetails(name, data) {
    document.getElementById('detailsSubtitle').textContent = data.source === 'live'
        ? 'Live result via geocoding & Wikipedia'
        : data.source === 'fishing-zone'
            ? 'Live fishing zone conditions'
            : 'Curated location data';

    const infoRows = [
        ['fa-users', 'Population', data.population],
        ['fa-cloud-sun', 'Climate', data.climate],
        ['fa-calendar-check', 'Best time to visit', data.best_time],
        ['fa-utensils', 'Cuisine', data.cuisine],
        ['fa-bus', 'Transport', data.transport],
        ['fa-industry', 'Industries', data.industries],
        ['fa-flag', 'Country', data.country],
        ['fa-tag', 'Place type', data.place_type],
    ].filter(([, , value]) => !!value);

    const infoGridHtml = infoRows.map(([icon, label, value]) => `
        <div class="info-item">
            <i class="fas ${icon}"></i>
            <div>
                <span class="info-label">${label}</span>
                <span class="info-value">${escapeHtml(value)}</span>
            </div>
        </div>`).join('');

    const attractionsHtml = (data.attractions && data.attractions.length) ? `
        <div class="attractions-section">
            <h4><i class="fas fa-star"></i> Top Attractions</h4>
            <div class="attraction-tags">
                ${data.attractions.map(a => `<span class="tag">${escapeHtml(a)}</span>`).join('')}
            </div>
        </div>` : '';

    const marineHtml = renderMarineSection(data.marine);

    document.getElementById('locationDetails').innerHTML = `
        <div class="location-detail-card">
            <div class="detail-header">
                <h3><i class="fas fa-map-pin"></i> ${escapeHtml(name)}</h3>
                <span class="badge-source">${data.source === 'live' ? 'Live Data' : data.source === 'fishing-zone' ? 'Fishing Zone' : 'Curated'}</span>
            </div>
            <p class="detail-description">${escapeHtml(data.description || '')}</p>
            ${data.full_address ? `<p class="detail-address"><i class="fas fa-location-dot"></i> ${escapeHtml(data.full_address)}</p>` : ''}
            ${marineHtml}
            ${infoRows.length ? `<div class="info-grid">${infoGridHtml}</div>` : ''}
            ${attractionsHtml}
        </div>`;
}

function renderMarineSection(marine) {
    if (!marine) return '';
    const status = marine.safety_status || 'safe';
    const statusLabel = { safe: 'Safe to Venture', caution: 'Exercise Caution', danger: 'Not Safe' }[status] || 'Unknown';
    const statusIcon = { safe: 'fa-circle', caution: 'fa-triangle-exclamation', danger: 'fa-stop' }[status] || 'fa-circle-info';

    const rows = [
        ['fa-temperature-half', 'Temperature', marine.temperature_c != null ? `${marine.temperature_c}°C` : null],
        ['fa-water', 'Wave height', marine.wave_height_m != null ? `${marine.wave_height_m} m` : null],
        ['fa-wind', 'Wind speed', marine.wind_speed_kmh != null ? `${marine.wind_speed_kmh} km/h` : null],
        ['fa-cloud', 'Weather', marine.weather_description || null],
    ].filter(([, , value]) => !!value);

    const rowsHtml = rows.map(([icon, label, value]) => `
        <div class="info-item">
            <i class="fas ${icon}"></i>
            <div>
                <span class="info-label">${label}</span>
                <span class="info-value">${escapeHtml(value)}</span>
            </div>
        </div>`).join('');

    const reasons = (marine.safety_reasons || []).map(r => escapeHtml(r)).join('; ');

    return `
        <div class="marine-section safety-${status}">
            <div class="safety-badge safety-${status}">
                <i class="fas ${statusIcon}"></i> ${statusLabel}
            </div>
            <p class="safety-reasons">${reasons}</p>
            ${rows.length ? `<div class="info-grid">${rowsHtml}</div>` : ''}
        </div>`;
}

function focusMapOn(name, data) {
    const lat = data.lat, lon = data.lon;
    if (typeof lat !== 'number' || typeof lon !== 'number') return;

    if (activeMarker) map.removeLayer(activeMarker);
    if (activeCircle) map.removeLayer(activeCircle);
    if (originMarker) { map.removeLayer(originMarker); originMarker = null; }
    if (routeLine) { map.removeLayer(routeLine); routeLine = null; }

    const safetyColors = { safe: '#3DDC84', caution: '#F5A623', danger: '#E8453C' };
    const status = data.marine && data.marine.safety_status;
    const color = safetyColors[status] || '#E8453C';

    activeMarker = L.marker([lat, lon]).addTo(map);

    activeCircle = L.circle([lat, lon], {
        radius: 15000,
        color: color,
        fillColor: color,
        fillOpacity: 0.15,
        weight: 2
    }).addTo(map);

    map.flyTo([lat, lon], 12, { duration: 1.2 });
    updateWeatherStatsBox(name, lat, lon, data.marine);
}

// Draws the searched origin, the nearest fishing zone, and a connecting route between them
function focusRouteBetween(origin, zone) {
    if (activeMarker) { map.removeLayer(activeMarker); activeMarker = null; }
    if (activeCircle) { map.removeLayer(activeCircle); activeCircle = null; }
    if (originMarker) { map.removeLayer(originMarker); originMarker = null; }
    if (routeLine) { map.removeLayer(routeLine); routeLine = null; }

    const safetyColors = { safe: '#3DDC84', caution: '#F5A623', danger: '#E8453C' };
    const status = zone.marine && zone.marine.safety_status;
    const color = safetyColors[status] || '#3DDC84';

    originMarker = L.marker([origin.lat, origin.lon]).addTo(map);

    activeMarker = L.marker([zone.lat, zone.lon]).addTo(map);

    activeCircle = L.circle([zone.lat, zone.lon], {
        radius: 15000, color, fillColor: color, fillOpacity: 0.15, weight: 2
    }).addTo(map);

    routeLine = L.polyline([[origin.lat, origin.lon], [zone.lat, zone.lon]], {
        color: '#4FD1E8', weight: 3, dashArray: '6 8'
    }).addTo(map);

    map.fitBounds(routeLine.getBounds(), { padding: [60, 60] });
    updateWeatherStatsBox(zone.name, zone.lat, zone.lon, zone.marine);
}

// ==================== CHAT ====================
function setupChat() {
    const input = document.getElementById('chatInput');
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });

    const trackerCloseBtn = document.getElementById('missionTrackerClose');
    if (trackerCloseBtn) {
        trackerCloseBtn.addEventListener('click', () => {
            document.getElementById('missionTracker')?.classList.add('hidden');
        });
    }

    setupSpeechRecognition(input);
}

function setupSpeechRecognition(input) {
    const micButton = document.getElementById('micButton');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!micButton || !SpeechRecognition) {
        if (micButton) micButton.classList.add('unsupported');
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    let isListening = false;
    let committedText = '';
    let hasDictatedText = false;
    let recognitionFailed = false;

    const setListeningState = (listening) => {
        isListening = listening;
        micButton.classList.toggle('listening', listening);
        micButton.setAttribute('aria-pressed', String(listening));
        micButton.title = listening ? 'Stop dictation' : 'Speak your query';
        micButton.innerHTML = listening
            ? '<i class="fas fa-stop"></i>'
            : '<i class="fas fa-microphone"></i>';
    };

    micButton.addEventListener('click', () => {
        if (isListening) {
            recognition.stop();
            return;
        }

        committedText = input.value.trim();
        hasDictatedText = false;
        recognitionFailed = false;
        recognition.lang = getSpeechLocale(selectedLanguage);
        setListeningState(true);
        try {
            recognition.start();
        } catch (error) {
            setListeningState(false);
        }
    });

    recognition.addEventListener('result', (event) => {
        let interimText = '';
        let finalText = '';
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
            const transcript = event.results[index][0].transcript;
            if (event.results[index].isFinal) finalText += transcript;
            else interimText += transcript;
        }

        if (finalText.trim()) {
            committedText = `${committedText} ${finalText.trim()}`.trim();
            hasDictatedText = true;
        }
        input.value = `${committedText}${interimText ? ` ${interimText}` : ''}`.trim();
    });

    recognition.addEventListener('end', () => {
        setListeningState(false);
        input.value = committedText || input.value;
        if (!recognitionFailed && hasDictatedText && input.value.trim()) {
            sendChatMessage();
        }
    });

    recognition.addEventListener('error', () => {
        recognitionFailed = true;
        setListeningState(false);
        input.value = committedText || input.value;
    });
}

function askAssistant(text, options = {}) {
    document.getElementById('chatInput').value = text;
    sendChatMessage(options);
}

function askAboutMarker(text) {
    if (window.switchTab) window.switchTab('home');
    askAssistant(text, { showDetails: false });
}

function askMissionExample() {
    document.getElementById('chatInput').value = 'Head 30 km offshore from 14.7110 N, 74.2640 E today';
    sendChatMessage();
}

// Extracts a place name following a preposition, e.g. "near Goa", "from Mumbai tomorrow"
function extractPrepositionPlace(messageLower) {
    const match = messageLower.match(/(?:near|in|at|around|for|off|from)\s+([a-z][a-z\s]{1,40}?)(?:\s+(?:today|tomorrow|now|tonight)\b|[?.!]|$)/);
    return match ? match[1].trim() : null;
}

async function sendChatMessage(options = {}) {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;

    input.value = '';
    input.disabled = true;

    try {
        await runMissionFlow(message);
    } finally {
        input.disabled = false;
        input.focus();
    }
}

// ==================== AI MISSION MODE (CrewAI Planner -> Weather/Geospatial -> Judge) ====================
// Drives the live agent pipeline in mission_agent.py: the Planner's offshore
// coordinates are plotted on the map the instant they arrive, the Weather
// Analyst's readings update the same marker/stats box, and once the Judge
// finishes reviewing everything, its verdict is posted to chat (translated
// into the selected language, mirroring the input translation below).
const MISSION_STEP_ORDER = ['planner', 'weather', 'geospatial', 'judge'];
let missionStageProgress = { weather: false, geospatial: false };

function resetMissionTracker() {
    const tracker = document.getElementById('missionTracker');
    if (!tracker) return;
    tracker.classList.remove('hidden');
    missionStageProgress = { weather: false, geospatial: false };
    missionRouteMetadata = null;
    MISSION_STEP_ORDER.forEach(step => setMissionStepState(step, 'pending', 'Waiting…'));

    const verdictCard = document.getElementById('missionVerdictCard');
    if (verdictCard) { verdictCard.classList.add('hidden'); verdictCard.innerHTML = ''; }
}

function setMissionStepState(step, state, detail) {
    const el = document.querySelector(`.mission-step[data-step="${step}"]`);
    if (!el) return;

    el.classList.remove('pending', 'active', 'done', 'error');
    el.classList.add(state);

    if (detail !== undefined) {
        const detailEl = el.querySelector('.mission-step-detail');
        if (detailEl) detailEl.textContent = detail;
    }

    const icons = {
        pending: '<i class="fas fa-circle"></i>',
        active: '<i class="fas fa-circle-notch fa-spin"></i>',
        done: '<i class="fas fa-check-circle"></i>',
        error: '<i class="fas fa-triangle-exclamation"></i>',
    };
    const statusEl = el.querySelector('.mission-step-status');
    if (statusEl) statusEl.innerHTML = icons[state] || icons.pending;
}

// The Judge has no tool call of its own to hook into, so its step only turns
// active once both upstream agents (weather + geospatial) have reported in.
function maybeActivateJudgeStep() {
    if (missionStageProgress.weather && missionStageProgress.geospatial) {
        setMissionStepState('judge', 'active', 'Reviewing weather & fishery reports…');
    }
}

// Marks whichever step is still in-flight as failed (used for hard pipeline errors)
function markMissionTrackerError(message) {
    const activeStep = MISSION_STEP_ORDER.find(step => {
        const el = document.querySelector(`.mission-step[data-step="${step}"]`);
        return el && (el.classList.contains('active') || el.classList.contains('pending'));
    });
    if (activeStep) setMissionStepState(activeStep, 'error', message || 'Failed');
}

async function runMissionFlow(rawMessage) {
    appendChatMessage(rawMessage, 'user');
    resetMissionTracker();
    setMissionStepState('planner', 'active', 'Extracting location & time…');

    // Input translation: let the user describe their mission in their chosen
    // language, translate to English before it reaches the agents.
    let missionQuery = rawMessage;
    if (selectedLanguage !== 'en') {
        const translatedIn = await translateText(rawMessage, 'en', selectedLanguage);
        if (translatedIn) missionQuery = translatedIn;
    }

    const typingEl = appendTypingIndicator();
    appendChatMessage('🧭 Analysis dispatched — Planner → Weather → Fishery → Judge agents are working...', 'assistant');

    let startRes;
    try {
        startRes = await fetch('/api/mission/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: missionQuery }),
        });
    } catch (networkErr) {
        typingEl.remove();
        const message = `Could not reach the AI analysis backend (${networkErr.message}). Make sure the Flask server is running ("python ui.py") and this page is open at http://localhost:5000.`;
        appendChatMessage(message, 'assistant');
        markMissionTrackerError('Backend unreachable');
        return;
    }

    const rawBody = await startRes.text();
    let startData;
    try {
        startData = JSON.parse(rawBody);
    } catch (parseErr) {
        typingEl.remove();
        const snippet = rawBody.trim().slice(0, 160) || '(empty response)';
        const message = `The backend replied with something unexpected (HTTP ${startRes.status}), not mission data: "${snippet}". This usually means a different server answered on this port, or ui.py hit an unhandled error — check the terminal running "python ui.py".`;
        appendChatMessage(message, 'assistant');
        markMissionTrackerError(`HTTP ${startRes.status}: non-JSON response`);
        return;
    }

    if (!startData.success) {
        typingEl.remove();
        appendChatMessage(startData.error || 'Could not start the mission.', 'assistant');
        markMissionTrackerError(startData.error);
        return;
    }

    try {
        await listenToMissionStream(startData.mission_id, typingEl);
    } catch (streamErr) {
        typingEl.remove();
        appendChatMessage(`Lost connection to the mission stream: ${streamErr.message}`, 'assistant');
        markMissionTrackerError('Stream connection lost');
    }
}

// Opens an SSE stream and resolves once the mission finishes (judge verdict or error)
function listenToMissionStream(missionId, typingEl) {
    return new Promise((resolve, reject) => {
        let source;
        try {
            source = new EventSource(`/api/mission/stream/${missionId}`);
        } catch (err) {
            reject(err);
            return;
        }
        let settled = false;

        const finish = () => {
            if (settled) return;
            settled = true;
            typingEl.remove();
            source.close();
            resolve();
        };

        source.onmessage = async (evt) => {
            let msg;
            try { msg = JSON.parse(evt.data); } catch (err) { return; }
            await handleMissionEvent(msg);
            if (msg.stage === 'done' || msg.stage === 'error') finish();
        };

        source.onerror = () => finish();
    });
}

async function handleMissionEvent(msg) {
    const stage = msg.stage;
    const payload = msg.payload || {};

    if (stage === 'planner') {
        setMissionStepState('planner', 'done', missionPlannerDetail(payload));
        setMissionStepState('weather', 'active', 'Fetching live sea & wind data…');
        setMissionStepState('geospatial', 'active', 'Fetching chlorophyll & SST…');
        renderMissionPlanner(payload);
    } else if (stage === 'weather') {
        missionStageProgress.weather = true;
        setMissionStepState('weather', payload.error ? 'error' : 'done', missionWeatherDetail(payload));
        maybeActivateJudgeStep();
        renderMissionWeather(payload);
    } else if (stage === 'geospatial') {
        missionStageProgress.geospatial = true;
        setMissionStepState('geospatial', payload.error ? 'error' : 'done', missionGeospatialDetail(payload));
        maybeActivateJudgeStep();
        renderMissionGeospatial(payload);
    } else if (stage === 'judge') {
        setMissionStepState('judge', 'done', 'Verdict ready');
        await renderMissionVerdict(payload.verdict || 'No verdict returned.');
    } else if (stage === 'land_blocked') {
        appendChatMessage(payload.message || 'The requested coordinates are on land. Please provide an offshore direction and distance.', 'assistant');
    } else if (stage === 'error') {
        appendChatMessage(`⚠️ Mission error: ${payload.message || 'Unknown error'}`, 'assistant');
        markMissionTrackerError(payload.message);
    } else if (stage === 'done' && payload && payload.success === false && !payload.blocked) {
        appendChatMessage(`⚠️ Mission failed: ${payload.error || 'Unknown error'}`, 'assistant');
        markMissionTrackerError(payload.error);
    }
}

function missionPlannerDetail(payload) {
    const target = payload.target_marine_coordinates || {};
    const label = payload.resolved_coastal_hub || payload.input_location || 'target';
    if (typeof target.lat === 'number' && typeof target.lon === 'number') {
        return `${label} → ${target.lat}°, ${target.lon}°`;
    }
    return String(label);
}

function missionWeatherDetail(payload) {
    if (payload.error) return payload.error;
    const ocean = payload.ocean_state || {};
    const atmo = payload.atmospheric_state || {};
    const wave = ocean.wave_height_meters ?? ocean.wave_height;
    const wind = atmo.wind_speed_kmh ?? atmo.wind_speed_10m;
    return `Wave ${wave ?? 'n/a'} m · Wind ${wind ?? 'n/a'} km/h`;
}

function missionGeospatialDetail(payload) {
    if (payload.error) return payload.error;
    return `Chl ${payload.chlorophyll_mg_m3 ?? 'n/a'} mg/m³ · SST ${payload.sea_surface_temp_celsius ?? 'n/a'}°C`;
}

// Stage 1 (Planner): plot the resolved offshore coordinates on the map immediately
function renderMissionPlanner(payload) {
    const target = payload.target_marine_coordinates || {};
    const origin = payload.origin_coordinates || {};
    const label = payload.resolved_coastal_hub || payload.input_location || 'Mission Target';
    missionRouteMetadata = payload.route_metadata || null;
    renderMissionRouteDetails(missionRouteMetadata);

    appendChatMessage(
        `📍 Planner locked the offshore target: ${label} → ${target.lat ?? '?'}°, ${target.lon ?? '?'}° (${payload.offshore_distance_km ?? '?'} km ${escapeHtml(payload.coast_region || '')})`,
        'assistant'
    );

    if (typeof target.lat !== 'number' || typeof target.lon !== 'number') return;

    if (activeMarker) { map.removeLayer(activeMarker); activeMarker = null; }
    if (activeCircle) { map.removeLayer(activeCircle); activeCircle = null; }
    if (originMarker) { map.removeLayer(originMarker); originMarker = null; }
    if (routeLine) { map.removeLayer(routeLine); routeLine = null; }

    if (typeof origin.lat === 'number' && typeof origin.lon === 'number') {
        originMarker = L.marker([origin.lat, origin.lon]).addTo(map);
        routeLine = L.polyline([[origin.lat, origin.lon], [target.lat, target.lon]], {
            color: '#4FD1E8', weight: 3, dashArray: '6 8'
        }).addTo(map);
    }

    activeMarker = L.marker([target.lat, target.lon]).addTo(map);

    activeCircle = L.circle([target.lat, target.lon], {
        radius: 15000, color: '#4FD1E8', fillColor: '#4FD1E8', fillOpacity: 0.15, weight: 2
    }).addTo(map);

    const bounds = routeLine ? routeLine.getBounds() : L.latLngBounds([[target.lat, target.lon], [target.lat, target.lon]]);
    map.fitBounds(bounds, { padding: [60, 60] });

    updateWeatherStatsBox(label, target.lat, target.lon, null);
}

// Stage 2 (Weather Analyst): update the same map marker/stats box with live conditions
function renderMissionWeather(payload) {
    if (payload.error) {
        appendChatMessage(`⚠️ Weather analyst error: ${payload.error}`, 'assistant');
        return;
    }

    const coords = payload.coordinates || {};
    const ocean = payload.ocean_state || {};
    const atmo = payload.atmospheric_state || {};
    const waveHeight = ocean.wave_height_meters ?? ocean.wave_height ?? null;
    const windSpeed = atmo.wind_speed_kmh ?? atmo.wind_speed_10m ?? null;

    const { status, reasons } = assessMarineSafety(waveHeight, windSpeed, null);
    const statusEmoji = { safe: '✅', caution: '⚠️', danger: '🚨' }[status] || 'ℹ️';

    appendChatMessage(
        `🌊 Weather analyst (${payload.scheduled_time || 'live'}): wave ${waveHeight ?? 'n/a'} m, wind ${windSpeed ?? 'n/a'} km/h — ${statusEmoji} ${status.toUpperCase()} (${reasons.join('; ')})`,
        'assistant'
    );

    if (typeof coords.lat !== 'number' || typeof coords.lon !== 'number') return;

    const safetyColors = { safe: '#3DDC84', caution: '#F5A623', danger: '#E8453C' };
    const color = safetyColors[status] || '#4FD1E8';
    if (activeCircle) activeCircle.setStyle({ color, fillColor: color });
    updateWeatherStatsBox('Mission Target', coords.lat, coords.lon, {
        wave_height_m: waveHeight,
        wind_speed_kmh: windSpeed,
        safety_status: status,
    });
}

// Stage 3 (Geospatial/Fishery Analyst) - reported in chat alongside the weather update
function renderMissionGeospatial(payload) {
    if (payload.error) {
        appendChatMessage(`⚠️ Fishery analyst error: ${payload.error}`, 'assistant');
        return;
    }
    appendChatMessage(
        `🐟 Fishery analyst: chlorophyll ${payload.chlorophyll_mg_m3 ?? 'n/a'} mg/m³, SST ${payload.sea_surface_temp_celsius ?? 'n/a'}°C`,
        'assistant'
    );

    if (payload.incois_advisory_url) renderMissionRouteDetails(missionRouteMetadata, payload.incois_advisory_url);
}

function renderMissionRouteDetails(route = null, advisoryUrl = null) {
    const details = document.getElementById('locationDetails');
    if (!details || !route) return;

    let section = details.querySelector('.mission-route-detail');
    if (!section) {
        section = document.createElement('section');
        section.className = 'mission-route-detail';
        details.appendChild(section);
    }

    const depth = route.depth_mtr || {};
    const latitude = route.latitude_dms || {};
    const longitude = route.longitude_dms || {};
    const sourceUrl = advisoryUrl || route.incois_advisory_url;
    const value = (item) => item == null || item === '' ? 'Unavailable' : escapeHtml(item);

    section.innerHTML = `
        <div class="mission-route-detail-header">
            <h3><i class="fas fa-compass"></i> Marine Route Advisory</h3>
            ${sourceUrl ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">INCOIS <i class="fas fa-external-link-alt"></i></a>` : ''}
        </div>
        <div class="mission-route-grid">
            <div><span>From the coast of</span><strong>${value(route.from_coast)}</strong></div>
            <div><span>Direction</span><strong>${value(route.direction)}</strong></div>
            <div><span>Bearing (deg)</span><strong>${value(route.bearing_degrees)}</strong></div>
            <div><span>Distance (km)</span><strong>${value(route.distance_km)}</strong></div>
            <div><span>Depth (mtr), from-to</span><strong>${value(depth.from)} → ${value(depth.to)}</strong></div>
            <div><span>Latitude (DMS), from-to</span><strong>${value(latitude.from)} → ${value(latitude.to)}</strong></div>
            <div><span>Longitude (DMS), from-to</span><strong>${value(longitude.from)} → ${value(longitude.to)}</strong></div>
        </div>`;
}

// Stage 4 (Judge): final verdict, shown once the whole crew has finished
async function renderMissionVerdict(verdictText) {
    appendMissionVerdict(verdictText);
    showMissionVerdictCard(verdictText);
    renderMissionVerdictDetails(verdictText);

    let speechText = verdictText;
    let speechLanguage = 'en';
    if (selectedLanguage !== 'en') {
        const translated = await translateText(verdictText, selectedLanguage);
        if (translated) {
            const langLabel = (LANGUAGE_OPTIONS.find(l => l.code === selectedLanguage) || {}).label || selectedLanguage;
            appendLocalizedMessage(translated, langLabel, selectedLanguage, true);
            appendMissionVerdictTranslation(translated, langLabel, selectedLanguage);
            renderMissionVerdictDetails(verdictText, translated, langLabel);
            speechText = translated;
            speechLanguage = selectedLanguage;
        }
    }

    // Speak only after the Judge verdict (and its optional translation) is ready.
    speakFinalAdvice(speechText, speechLanguage);
    sendVerdictBySms(speechText);
}

function sendVerdictBySms(verdictText) {
    fetch('/api/sms/send-verdict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verdict: verdictText }),
    }).then(async response => {
        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(result.error || `SMS request failed (${response.status})`);
        }
        return response.json();
    }).catch(error => {
        // SMS delivery is supplementary; a Fast2SMS failure must not hide the verdict.
        console.warn('Could not send final verdict by SMS:', error.message);
    });
}

function renderMissionVerdictDetails(verdictText, translatedText = null, translatedLabel = null) {
    const details = document.getElementById('locationDetails');
    if (!details) return;

    let section = details.querySelector('.mission-verdict-detail');
    if (!section) {
        section = document.createElement('section');
        section.className = 'mission-verdict-detail';
        details.appendChild(section);
    }

    const translationHtml = translatedText
        ? `<div class="mission-verdict-detail-translation"><span class="localized-label">${escapeHtml(translatedLabel)}</span><div class="verdict-rich-text">${formatVerdictText(translatedText)}</div></div>`
        : '';
    section.innerHTML = `
        <div class="mission-verdict-detail-header">
            <h3><i class="fas fa-flag-checkered"></i> Final Mission Verdict</h3>
            <span class="badge-source">AI Mission</span>
        </div>
        <div class="verdict-rich-text">${formatVerdictText(verdictText)}</div>
        ${translationHtml}`;
}

function showMissionVerdictCard(text) {
    const card = document.getElementById('missionVerdictCard');
    if (!card) return;
    card.classList.remove('hidden');
    card.innerHTML = `
        <div class="mission-verdict-card-label"><i class="fas fa-flag-checkered"></i> Final Verdict <button class="verdict-speak-button" type="button" title="Read final advice aloud" aria-label="Read final advice aloud"><i class="fas fa-volume-high"></i></button></div>
        <div class="mission-verdict-card-text verdict-rich-text">${formatVerdictText(text)}</div>
        <div id="missionVerdictTranslation" class="mission-verdict-translation hidden"></div>`;
    card.querySelector('.verdict-speak-button').addEventListener('click', () => speakFinalAdvice(text, 'en'));
}

function appendMissionVerdictTranslation(text, langLabel, languageCode) {
    const wrap = document.getElementById('missionVerdictTranslation');
    if (!wrap) return;
    wrap.classList.remove('hidden');
    wrap.innerHTML = `<span class="localized-label">${escapeHtml(langLabel)} <button class="verdict-speak-button" type="button" title="Read translated advice aloud" aria-label="Read translated advice aloud"><i class="fas fa-volume-high"></i></button></span><div class="verdict-rich-text">${formatVerdictText(text)}</div>`;
    wrap.querySelector('.verdict-speak-button').addEventListener('click', () => speakFinalAdvice(text, languageCode));
}

function appendMissionVerdict(text) {
    const chatMessages = document.getElementById('chatMessages');
    const wrapper = document.createElement('div');
    wrapper.className = 'message assistant-message mission-verdict-message';
    wrapper.innerHTML = `
        <div class="message-avatar"><i class="fas fa-gavel"></i></div>
        <div class="message-content">
            <span class="mission-verdict-label"><i class="fas fa-flag-checkered"></i> Final Verdict <button class="verdict-speak-button" type="button" title="Read final advice aloud" aria-label="Read final advice aloud"><i class="fas fa-volume-high"></i></button></span>
            <div class="verdict-rich-text">${formatVerdictText(text)}</div>
        </div>`;
    chatMessages.appendChild(wrapper);
    wrapper.querySelector('.verdict-speak-button').addEventListener('click', () => speakFinalAdvice(text, 'en'));
    scrollChatToBottom();
}

async function speakFinalAdvice(text, languageCode = selectedLanguage) {
    if (!('speechSynthesis' in window)) return;
    const speechLanguage = languageCode || 'en';
    const voices = await getSpeechVoices();
    window.speechSynthesis.cancel();
    const advice = extractRecommendationText(text, speechLanguage);
    const utterance = new SpeechSynthesisUtterance(advice);
    const locale = getSpeechLocale(speechLanguage);
    utterance.lang = locale;
    const aliases = SPEECH_LANGUAGE_ALIASES[speechLanguage] || SPEECH_LANGUAGE_ALIASES.en;
    const matchingVoice = voices.find(voice => {
        const voiceLocale = voice.lang.toLowerCase().replace('_', '-');
        return aliases.some(alias => voiceLocale === alias || voiceLocale.startsWith(`${alias}-`));
    });
    if (matchingVoice) utterance.voice = matchingVoice;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
}

function extractRecommendationText(text, languageCode) {
    const labels = {
        en: ['Recommendation', 'Suggestion', 'Advice'],
        hi: ['Recommendation', 'सुझाव', 'सिफारिश', 'अनुशंसा'],
        ta: ['Recommendation', 'பரிந்துரை'],
        te: ['Recommendation', 'సిఫార్సు'],
        bn: ['Recommendation', 'সুপারিশ'],
        mr: ['Recommendation', 'शिफारस'],
        gu: ['Recommendation', 'ભલામણ'],
        kn: ['Recommendation', 'ಶಿಫಾರಸು'],
        ml: ['Recommendation', 'ശുപാർശ'],
        pa: ['Recommendation', 'ਸਿਫ਼ਾਰਸ਼', 'ਸੁਝਾਅ'],
        or: ['Recommendation', 'ସୁପାରିଶ'],
    }[languageCode] || ['Recommendation', 'Suggestion', 'Advice'];
    const escapedLabels = labels.map(label => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const recommendationPattern = new RegExp(`(?:${escapedLabels.join('|')})\\s*:?\\s*`, 'i');
    const match = recommendationPattern.exec(String(text || ''));
    if (!match) return String(text || '').trim();

    const remaining = String(text || '').slice(match.index + match[0].length);
    const nextSection = remaining.search(/\s+(?:Safety|PFZ|सुरक्षा|संभावना|பாதுகாப்பு|సురక్ష|নিরাপত্তা|शिफारस|भलामण)\s*:/i);
    return (nextSection >= 0 ? remaining.slice(0, nextSection) : remaining)
        .replace(/^\*+|\*+$/g, '')
        .trim();
}

function getSpeechVoices() {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length) return Promise.resolve(voices);

    return new Promise(resolve => {
        let settled = false;
        const finish = () => {
            if (settled) return;
            settled = true;
            window.speechSynthesis.removeEventListener('voiceschanged', finish);
            resolve(window.speechSynthesis.getVoices());
        };
        window.speechSynthesis.addEventListener('voiceschanged', finish, { once: true });
        window.setTimeout(finish, 1000);
    });
}

function getSpeechLocale(languageCode) {
    return SPEECH_LOCALES[languageCode] || SPEECH_LOCALES.en;
}

function appendTypingIndicator() {
    const wrapper = document.createElement('div');
    wrapper.className = 'message assistant-message typing-message';
    wrapper.innerHTML = `
        <div class="message-avatar"><i class="fas fa-robot"></i></div>
        <div class="message-content typing-indicator">
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        </div>`;
    document.getElementById('chatMessages').appendChild(wrapper);
    scrollChatToBottom();
    return wrapper;
}

function appendChatMessage(text, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const wrapper = document.createElement('div');
    wrapper.className = `message ${sender}-message`;

    const avatarIcon = sender === 'user' ? 'fa-user' : 'fa-robot';
    const formatted = escapeHtml(text).replace(/\n/g, '<br>');

    wrapper.innerHTML = `
        <div class="message-avatar"><i class="fas ${avatarIcon}"></i></div>
        <div class="message-content"><p>${formatted}</p></div>`;

    chatMessages.appendChild(wrapper);
    scrollChatToBottom();
}

// Localization layer: shows the regional-language translation alongside the English reply
function appendLocalizedMessage(text, langLabel, languageCode = selectedLanguage, isFinalVerdict = false) {
    const chatMessages = document.getElementById('chatMessages');
    const wrapper = document.createElement('div');
    wrapper.className = 'message assistant-message localized-message';

    const formatted = escapeHtml(text).replace(/\n/g, '<br>');

    const speakButton = isFinalVerdict
        ? `<button class="verdict-speak-button" type="button" title="Read translated advice aloud" aria-label="Read translated advice aloud"><i class="fas fa-volume-high"></i></button>`
        : '';
    wrapper.innerHTML = `
        <div class="message-avatar"><i class="fas fa-language"></i></div>
        <div class="message-content">
            <span class="localized-label">${escapeHtml(langLabel)} ${speakButton}</span>
            <p>${formatted}</p>
        </div>`;

    chatMessages.appendChild(wrapper);
    if (isFinalVerdict) {
        wrapper.querySelector('.verdict-speak-button').addEventListener('click', () => speakFinalAdvice(text, languageCode));
    }
    scrollChatToBottom();
}

function formatVerdictText(text) {
    const lines = String(text == null ? '' : text).split(/\r?\n/);
    const html = [];
    let listItems = [];

    const flushList = () => {
        if (listItems.length) {
            html.push(`<ul>${listItems.join('')}</ul>`);
            listItems = [];
        }
    };

    lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) {
            flushList();
            return;
        }

        const bullet = trimmed.match(/^[-*]\s+(.+)$/);
        if (bullet) {
            listItems.push(`<li>${formatVerdictInline(bullet[1])}</li>`);
            return;
        }

        flushList();
        const section = trimmed.match(/^\*\*(.+?)\*\*\s*:?\s*(.*)$/);
        if (section) {
            const label = section[1].trim();
            const body = section[2].trim();
            const isRecommendation = /recommendation/i.test(label);
            html.push(`<section class="verdict-section${isRecommendation ? ' verdict-recommendation' : ''}"><h4>${escapeHtml(label)}</h4>${body ? `<p>${formatVerdictInline(body)}</p>` : ''}</section>`);
            return;
        }

        const heading = trimmed.match(/^#{1,3}\s+(.+)$/);
        if (heading) {
            html.push(`<h4>${formatVerdictInline(heading[1])}</h4>`);
            return;
        }

        html.push(`<p>${formatVerdictInline(trimmed)}</p>`);
    });

    flushList();
    return html.join('');
}

function formatVerdictInline(text) {
    const escaped = escapeHtml(text);
    return escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function scrollChatToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ==================== UTIL ====================
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
}

