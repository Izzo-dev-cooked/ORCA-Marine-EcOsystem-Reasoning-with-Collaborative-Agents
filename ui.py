from flask import Flask, render_template, request, jsonify, Response
from datetime import datetime
import hashlib
import json
import logging
import os
import queue
import re
import requests
import threading
import time
import uuid

app = Flask(__name__)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("orca.tiles")

# The CrewAI mission pipeline (Planner -> Weather/Geospatial -> Judge) is a heavy,
# optional dependency (crewai, copernicusmarine, xarray...). Import it defensively
# so the rest of the app still works even if those packages aren't installed.
try:
    from mission_agent import run_mission
    MISSION_AGENT_AVAILABLE = True
    MISSION_AGENT_IMPORT_ERROR = None
except Exception as _mission_import_exc:  # pragma: no cover - environment dependent
    run_mission = None
    MISSION_AGENT_AVAILABLE = False
    MISSION_AGENT_IMPORT_ERROR = str(_mission_import_exc)
    logger.warning("Mission agent pipeline unavailable: %s", MISSION_AGENT_IMPORT_ERROR)

# In-memory registry of live mission event queues, one per running mission,
# used to bridge the background CrewAI worker thread to the SSE stream below.
_MISSION_QUEUES = {}
_MISSION_QUEUES_LOCK = threading.Lock()

# Free, keyless services used to "recognize" any place the user asks about
# (Open-Meteo geocoding for coordinates, Wikipedia for a short summary), plus
# Open-Meteo's marine & weather forecast APIs which power the ORCA marine
# reasoning agent (wave height, wind, and hazard assessment for any point on Earth).
GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
WIKIPEDIA_SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/{}"
MARINE_FORECAST_URL = "https://marine-api.open-meteo.com/v1/marine"
WEATHER_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
HTTP_HEADERS = {
    "User-Agent": "ORCA-Marine-Intelligence-App/1.0 (contact: local-dev@example.com)",
    "Referer": "http://localhost:5000/"
}


FAST2SMS_URL = "https://www.fast2sms.com/dev/bulkV2"


def _fast2sms_config():
    """Read Fast2SMS credentials from the environment without exposing secrets."""
    return {
        "api_key": os.environ.get("FAST2SMS_API_KEY", "").strip(),
        "default_number": os.environ.get("FAST2SMS_NUMBER", "917694046949").strip(),
        "route": os.environ.get("FAST2SMS_ROUTE", "q").strip().lower(),
        "sender_id": os.environ.get("FAST2SMS_SENDER_ID", "").strip(),
        "variables_values": os.environ.get("FAST2SMS_VARIABLES_VALUES", "").strip(),
        "mock": os.environ.get("FAST2SMS_MOCK", "").strip().lower() in {"1", "true", "yes"},
    }

# Map Tile Server Proxy settings:
# - Proper Identification: unique User-Agent and valid Referer header
# - Rate Limiting & Exponential Backoff: throttling and retries on 429/403/5xx errors
# - Server-side Caching & Thread Safety: in-memory tile cache with locks & ETag generation
# - Fallback Logic: automatic fallback to Wikimedia's free, keyless OSM tile mirror
#
# NOTE: CARTO's basemap CDN was previously used as a fallback, but it renders a
# "get your API key" watermark on its tiles even without an api_key being sent.
# Wikimedia Maps (maps.wikimedia.org) mirrors the standard OpenStreetMap style,
# requires no key/signup, and never stamps a watermark onto tiles.
TILE_HEADERS = {
    "User-Agent": "ORCA-Marine-Intelligence-App/1.0 (contact: local-dev@example.com)",
    "Referer": "http://localhost:5000/"
}

PRIMARY_TILE_SERVERS = [
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
    "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
    "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
]

# Free, keyless fallback mirror (no watermark, no signup, standard OSM styling)
FALLBACK_TILE_SERVERS = [
    "https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png",
]

# Additional free, keyless basemap styles the client can request via ?style=.
# Every entry here must be a signup-free, key-free CDN so no "get an API key"
# watermark can ever reappear - only add providers that are verified keyless.
TILE_STYLES = {
    "standard": {
        "primary": PRIMARY_TILE_SERVERS,
        "fallback": FALLBACK_TILE_SERVERS,
    },
    "humanitarian": {
        "primary": [
            "https://tile-a.openstreetmap.fr/hot/{z}/{x}/{y}.png",
            "https://tile-b.openstreetmap.fr/hot/{z}/{x}/{y}.png",
            "https://tile-c.openstreetmap.fr/hot/{z}/{x}/{y}.png",
        ],
        "fallback": FALLBACK_TILE_SERVERS,
    },
    "topo": {
        "primary": [
            "https://a.tile.opentopomap.org/{z}/{x}/{y}.png",
            "https://b.tile.opentopomap.org/{z}/{x}/{y}.png",
            "https://c.tile.opentopomap.org/{z}/{x}/{y}.png",
        ],
        "fallback": FALLBACK_TILE_SERVERS,
    },
}
DEFAULT_TILE_STYLE = "standard"

TILE_CACHE = {}
TILE_CACHE_LOCK = threading.Lock()
MAX_CACHE_SIZE = 1000
CACHE_TTL = 86400  # 24 hours in seconds


def get_tile_data(z, x, y, style=DEFAULT_TILE_STYLE):
    """
    Proxy map tile request with proper identification, bounds validation,
    rate limiting with exponential backoff on 429/403/5xx errors, multi-tier
    fallback to a free/keyless tile mirror, thread-safe caching, and ETag
    computation.
    """
    # 1. Bounds & Coordinate Validation (prevent bulk scraping & out-of-bounds requests)
    try:
        z, x, y = int(z), int(x), int(y)
    except (TypeError, ValueError):
        return None, "Invalid tile coordinates", None, 400
    if not (0 <= z <= 19):
        return None, "Invalid zoom level", None, 400
    max_coord = (1 << z) - 1
    if not (0 <= x <= max_coord and 0 <= y <= max_coord):
        return None, "Invalid tile coordinates", None, 400

    # 2. Validate style against a whitelist so an unexpected value can never
    # reach an unknown/unverified upstream host.
    style = style if style in TILE_STYLES else DEFAULT_TILE_STYLE
    servers = TILE_STYLES[style]

    cache_key = (z, x, y, style)
    now = time.time()

    # 3. Check Server-side Tile Cache (Thread-safe)
    with TILE_CACHE_LOCK:
        cached = TILE_CACHE.get(cache_key)
        if cached:
            data, content_type, etag, cached_time = cached
            if now - cached_time < CACHE_TTL:
                return data, content_type, etag, 200
            del TILE_CACHE[cache_key]

    # 4. Build candidate URLs list (style's primary servers first, then its fallback servers)
    urls_to_try = [url.format(z=z, x=x, y=y) for url in servers["primary"]]
    urls_to_try.extend([url.format(z=z, x=x, y=y) for url in servers["fallback"]])

    for url in urls_to_try:
        backoff = 0.5
        for attempt in range(3):
            try:
                resp = requests.get(url, headers=TILE_HEADERS, timeout=6)
                if resp.status_code == 200 and resp.content:
                    data = resp.content
                    content_type = resp.headers.get("Content-Type", "image/png")
                    etag = f'"{hashlib.md5(data).hexdigest()}"'

                    # Manage Cache Eviction if cache limit reached
                    with TILE_CACHE_LOCK:
                        if len(TILE_CACHE) >= MAX_CACHE_SIZE:
                            oldest_keys = sorted(TILE_CACHE.keys(), key=lambda k: TILE_CACHE[k][3])[:100]
                            for k in oldest_keys:
                                TILE_CACHE.pop(k, None)

                        TILE_CACHE[cache_key] = (data, content_type, etag, now)
                    return data, content_type, etag, 200
                elif resp.status_code in (429, 403, 500, 502, 503, 504):
                    # Throttled or server error by tile server: exponential backoff before retry or fallback
                    time.sleep(backoff)
                    backoff *= 2
                else:
                    break
            except requests.RequestException as exc:
                logger.warning("Tile fetch failed for %s: %s", url, exc)
                time.sleep(0.2)
                break
            except Exception:
                # Unexpected failure (e.g. malformed response) must never crash the request thread.
                logger.exception("Unexpected error fetching tile %s", url)
                break

    return None, "Failed to fetch tile from primary and fallback tile servers", None, 502

# WMO weather codes -> short human readable description
WEATHER_CODE_DESCRIPTIONS = {
    0: "Clear sky", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing rime fog",
    51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
    80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
    95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Severe thunderstorm with hail",
}


def assess_marine_safety(wave_height, wind_speed_kmh, weather_code):
    """Rule-based risk assessment mimicking the platform's risk-assessment agent."""
    status = "safe"
    reasons = []

    if weather_code in (95, 96, 99):
        status = "danger"
        reasons.append("Thunderstorm activity in the area")

    if wave_height is not None:
        if wave_height >= 2.5:
            status = "danger"
            reasons.append(f"High waves ({wave_height} m)")
        elif wave_height >= 1.5 and status != "danger":
            status = "caution"
            reasons.append(f"Moderate waves ({wave_height} m)")

    if wind_speed_kmh is not None:
        if wind_speed_kmh >= 40:
            status = "danger"
            reasons.append(f"Strong winds ({wind_speed_kmh} km/h)")
        elif wind_speed_kmh >= 25 and status != "danger":
            status = "caution"
            reasons.append(f"Breezy conditions ({wind_speed_kmh} km/h)")

    if not reasons:
        reasons.append("Calm sea and clear weather")

    return status, reasons


def get_marine_conditions(lat, lon):
    """
    ORCA "ocean analytics" + "weather intelligence" agents: pull live wave and
    weather data for any coordinate and synthesize a safety recommendation.
    """
    try:
        marine_resp = requests.get(
            MARINE_FORECAST_URL,
            params={
                "latitude": lat, "longitude": lon,
                "current": "wave_height,wave_direction,wave_period,swell_wave_height",
                "timezone": "auto",
            },
            headers=HTTP_HEADERS, timeout=6,
        )
        weather_resp = requests.get(
            WEATHER_FORECAST_URL,
            params={
                "latitude": lat, "longitude": lon,
                "current": "temperature_2m,wind_speed_10m,wind_direction_10m,weather_code,precipitation",
                "timezone": "auto",
            },
            headers=HTTP_HEADERS, timeout=6,
        )
        marine_resp.raise_for_status()
        weather_resp.raise_for_status()

        marine_current = marine_resp.json().get("current", {}) or {}
        weather_current = weather_resp.json().get("current", {}) or {}

        wave_height = marine_current.get("wave_height")
        wind_speed = weather_current.get("wind_speed_10m")
        weather_code = weather_current.get("weather_code")

        status, reasons = assess_marine_safety(wave_height, wind_speed, weather_code)

        return {
            "wave_height_m": wave_height,
            "wave_period_s": marine_current.get("wave_period"),
            "swell_wave_height_m": marine_current.get("swell_wave_height"),
            "wind_speed_kmh": wind_speed,
            "wind_direction_deg": weather_current.get("wind_direction_10m"),
            "temperature_c": weather_current.get("temperature_2m"),
            "precipitation_mm": weather_current.get("precipitation"),
            "weather_description": WEATHER_CODE_DESCRIPTIONS.get(weather_code, "Unknown"),
            "safety_status": status,
            "safety_reasons": reasons,
        }
    except (requests.RequestException, ValueError, KeyError, TypeError):
        return None


def geocode_place(query):
    """Resolve a free-text place name to coordinates + address via Open-Meteo."""
    try:
        resp = requests.get(
            GEOCODING_URL,
            params={"name": query, "count": 1, "language": "en", "format": "json"},
            headers=HTTP_HEADERS,
            timeout=6,
        )
        resp.raise_for_status()
        results = resp.json().get("results") or []
        return results[0] if results else None
    except (requests.RequestException, ValueError, IndexError):
        return None


def fetch_wikipedia_summary(title):
    """Fetch a short factual description of a place from Wikipedia's REST API."""
    try:
        resp = requests.get(
            WIKIPEDIA_SUMMARY_URL.format(requests.utils.quote(title)),
            headers=HTTP_HEADERS,
            timeout=6,
        )
        if resp.status_code != 200:
            return None
        data = resp.json()
        return data.get("extract")
    except (requests.RequestException, ValueError):
        return None


COMMON_SMALL_TALK = {
    "hi", "hello", "hey", "hey there", "thanks", "thank you", "ok", "okay",
    "bye", "goodbye", "good morning", "good evening", "good night", "yes", "no",
    "help", "who are you", "how are you", "what can you do", "hola",
}


def discover_place(query):
    """
    AI-agent-style discovery for any place on Earth: geocode it, then enrich
    with a Wikipedia summary. Returns data shaped like LOCATION_DATABASE entries.
    """
    geo = geocode_place(query)
    if not geo:
        return None

    short_name = geo.get("name", query)
    region = geo.get("admin1")
    country = geo.get("country", "Unknown")
    full_address = ", ".join(p for p in [short_name, region, country] if p)

    summary = fetch_wikipedia_summary(short_name) or fetch_wikipedia_summary(query)

    lat = float(geo["latitude"])
    lon = float(geo["longitude"])

    return {
        "lat": lat,
        "lon": lon,
        "description": summary or f"{short_name} — {full_address}",
        "full_address": full_address,
        "place_type": geo.get("feature_code", "Place"),
        "country": country,
        "population": f"{geo['population']:,}" if geo.get("population") else None,
        "source": "live",
        "marine": get_marine_conditions(lat, lon),
    }

# Location database with details
LOCATION_DATABASE = {
    "Mumbai": {
        "lat": 19.0760,
        "lon": 72.8777,
        "description": "Metropolitan coastal city known for finance, entertainment, and commerce",
        "population": "20.96 million",
        "climate": "Tropical monsoon climate",
        "attractions": ["Gateway of India", "Marine Drive", "Taj Mahal Palace Hotel", "Elephanta Caves"],
        "best_time": "October to May",
        "cuisine": "North Indian, Coastal seafood, Street food",
        "transport": "Local trains, buses, auto-rickshaws, metro",
        "industries": "Finance, Film, IT, Tourism"
    },
    "Delhi": {
        "lat": 28.7041,
        "lon": 77.1025,
        "description": "Capital city of India, blending ancient history with modern development",
        "population": "32.94 million",
        "climate": "Semi-arid subtropical climate",
        "attractions": ["Red Fort", "India Gate", "Jama Masjid", "Qutb Minar", "Lotus Temple"],
        "best_time": "October to March",
        "cuisine": "Mughlai, Punjabi, Street food",
        "transport": "Metro, DTC buses, auto-rickshaws",
        "industries": "Government, IT, Tourism, Education"
    },
    "Bangalore": {
        "lat": 12.9716,
        "lon": 77.5946,
        "description": "IT hub of India with pleasant climate and vibrant tech culture",
        "population": "8.44 million",
        "climate": "Tropical highland climate",
        "attractions": ["Lalbagh Garden", "Vidhana Soudha", "Bangalore Palace", "ISKCON Temple"],
        "best_time": "October to February",
        "cuisine": "South Indian, Coastal, Continental",
        "transport": "Metro, buses, auto-rickshaws, app-based cabs",
        "industries": "Information Technology, Biotechnology, Aerospace"
    },
    "Goa": {
        "lat": 15.4909,
        "lon": 73.8278,
        "description": "Coastal paradise known for beaches, churches, and laid-back lifestyle",
        "population": "1.47 million",
        "climate": "Tropical monsoon climate",
        "attractions": ["Baga Beach", "Basilica of Bom Jesus", "Fort Aguada", "Dudhsagar Falls"],
        "best_time": "November to March",
        "cuisine": "Goan seafood, Portuguese-influenced",
        "transport": "Taxis, motorcycles, buses",
        "industries": "Tourism, Agriculture, Mining, Fishing"
    },
    "Kolkata": {
        "lat": 22.5726,
        "lon": 88.3639,
        "description": "Cultural capital of India with rich literary and artistic heritage",
        "population": "14.7 million",
        "climate": "Subtropical climate with monsoon",
        "attractions": ["Victoria Memorial", "Howrah Bridge", "Belur Math", "Indian Museum"],
        "best_time": "November to February",
        "cuisine": "Bengali cuisine, Fish curry, Sweets",
        "transport": "Metro, trams, buses, auto-rickshaws",
        "industries": "Education, Publishing, Cinema, Tourism"
    },
    "Jaipur": {
        "lat": 26.9124,
        "lon": 75.7873,
        "description": "Pink City known for its magnificent architecture and royal heritage",
        "population": "3.73 million",
        "climate": "Hot semi-arid climate",
        "attractions": ["City Palace", "Jantar Mantar", "Hawa Mahal", "Albert Hall Museum"],
        "best_time": "October to March",
        "cuisine": "Rajasthani, Marwari cuisine",
        "transport": "Buses, auto-rickshaws, taxis",
        "industries": "Tourism, Handicrafts, Textiles, Gemstones"
    }
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/search-location', methods=['POST'])
def search_location():
    """
    Search for location information.
    Checks the curated database first, then falls back to live geocoding +
    Wikipedia lookup so ANY place in the world can be recognized.
    """
    raw_query = request.json.get('query', '').strip()
    query = raw_query.lower()

    if not query:
        return jsonify({"error": "Please enter a location"}), 400

    # Search in our curated database first
    for location_name, details in LOCATION_DATABASE.items():
        if query in location_name.lower() or location_name.lower() in query:
            enriched = {**details, "marine": get_marine_conditions(details["lat"], details["lon"])}
            return jsonify({
                "success": True,
                "location": location_name,
                "data": enriched
            })

    # Fallback: recognize the place live via geocoding + Wikipedia
    discovered = discover_place(raw_query)
    if discovered:
        return jsonify({
            "success": True,
            "location": raw_query.title(),
            "data": discovered
        })

    return jsonify({
        "success": False,
        "message": f"Couldn't recognize '{raw_query}'. Try a different spelling or a nearby well-known place."
    })

@app.route('/api/location-details/<location>')
def get_location_details(location):
    """Get detailed information about a specific location"""
    location = location.title()
    
    if location in LOCATION_DATABASE:
        details = LOCATION_DATABASE[location]
        enriched = {**details, "marine": get_marine_conditions(details["lat"], details["lon"])}
        return jsonify({
            "success": True,
            "location": location,
            "data": enriched
        })
    
    return jsonify({"success": False, "error": "Location not found"}), 404

@app.route('/api/get-locations')
def get_all_locations():
    """Get all available locations with basic info"""
    locations = []
    for name, details in LOCATION_DATABASE.items():
        locations.append({
            "name": name,
            "lat": details["lat"],
            "lon": details["lon"],
            "description": details["description"]
        })
    return jsonify({"locations": locations})

@app.route('/api/ai-chat', methods=['POST'])
def ai_chat():
    """
    AI-powered chat endpoint
    Responds to queries about locations with intelligent responses
    """
    user_message = request.json.get('message', '').strip()

    if not user_message:
        return jsonify({"error": "Please enter a message"}), 400

    message_lower = user_message.lower()

    # Strip an explicit location lead-in phrase to isolate the place name
    stripped = re.sub(
        r"^(tell me about|what is|what's|where is|show me|find|info on|information about|about)\s+",
        "", message_lower
    ).strip(" ?.!")
    had_explicit_lead_in = stripped != message_lower
    place_candidate = stripped

    # Marine-flavoured queries (safety, weather, waves, alerts) often name the
    # place after a preposition instead of a lead-in, e.g. "is it safe to
    # venture near Goa tomorrow" or "wave height at Chennai".
    marine_keywords = (
        'safe', 'venture', 'tide', 'wave', 'wind', 'sea condition', 'storm',
        'cyclone', 'lightning', 'fishing', 'weather', 'alert', 'hazard'
    )
    is_marine_query = any(k in message_lower for k in marine_keywords)
    if is_marine_query:
        prep_match = re.search(r'(?:near|in|at|around|for|off)\s+([a-z][a-z\s]{1,40}?)(?:\s+(?:today|tomorrow|now|tonight)\b|[?.!]|$)', message_lower)
        if prep_match:
            place_candidate = prep_match.group(1).strip()
            had_explicit_lead_in = True

    location_name = None
    location_data = None

    # 1) Check curated database
    for name, details in LOCATION_DATABASE.items():
        if place_candidate and (place_candidate in name.lower() or name.lower() in place_candidate):
            location_name = name
            location_data = {**details, "marine": get_marine_conditions(details["lat"], details["lon"])}
            break

    # 2) Fall back to live recognition (geocoding + Wikipedia) for any place on Earth.
    # Only attempt this for an explicit "tell me about X" style ask, or a short
    # bare query (e.g. just "Tokyo") — never for ordinary chit-chat.
    is_small_talk = place_candidate in COMMON_SMALL_TALK
    looks_like_place_query = had_explicit_lead_in or len(place_candidate.split()) <= 3

    if not location_data and place_candidate and len(place_candidate) > 2 and looks_like_place_query and not is_small_talk:
        discovered = discover_place(place_candidate)
        if discovered:
            location_name, location_data = place_candidate.title(), discovered

    if location_data:
        marine = location_data.get('marine')
        parts = [f"📍 **{location_name}**", location_data.get('description', '')]
        if marine:
            parts.append(
                f"🌊 Sea state: wave height {marine.get('wave_height_m', 'n/a')} m, "
                f"wind {marine.get('wind_speed_kmh', 'n/a')} km/h, {marine.get('weather_description', 'n/a')}"
            )
            status = marine.get('safety_status', 'safe')
            status_emoji = {"safe": "✅", "caution": "⚠️", "danger": "🚨"}.get(status, "ℹ️")
            parts.append(f"{status_emoji} Safety: {status.upper()} — {'; '.join(marine.get('safety_reasons', []))}")
        if location_data.get('population'):
            parts.append(f"Population: {location_data['population']}")
        if location_data.get('climate'):
            parts.append(f"Climate: {location_data['climate']}")
        if location_data.get('best_time'):
            parts.append(f"Best time to visit: {location_data['best_time']}")
        if location_data.get('attractions'):
            parts.append("Top attractions: " + ", ".join(location_data['attractions']))
        if location_data.get('country'):
            parts.append(f"Country: {location_data['country']}")
        response = "\n".join(p for p in parts if p)

        return jsonify({
            "response": response,
            "timestamp": datetime.now().isoformat(),
            "type": "location",
            "location": location_name,
            "data": location_data
        })

    # No place recognized — general assistant guidance
    if any(word in message_lower for word in ['safe', 'venture', 'hazard', 'alert', 'cyclone', 'lightning']):
        response = "Name a coastal place (e.g. 'Is it safe to venture near Goa?') and I'll check live wave, wind, and weather conditions for a safety verdict."
    elif any(word in message_lower for word in ['population', 'many', 'how many']):
        response = "Tell me a place name (e.g. 'Tell me about Tokyo') and I'll look up its population and details."
    elif any(word in message_lower for word in ['best', 'visit', 'when', 'travel']):
        response = "Give me a place name and I'll fetch the best time to visit along with live details."
    elif any(word in message_lower for word in ['tide', 'wave', 'sea condition', 'weather', 'climate', 'temperature']):
        response = "Name a place and I'll pull up its live weather and sea-state conditions for you."
    elif any(word in message_lower for word in ['food', 'eat', 'cuisine', 'restaurant']):
        response = "Ask about a specific place and I'll share what I know about its cuisine."
    else:
        response = ("I'm ORCA, your AI Marine & Location Assistant! Ask about any coastal place "
                    "(e.g. 'Is it safe to venture near Goa?') for live wave, wind, and safety data, "
                    "or any city on Earth (e.g. 'Tell me about Kyoto') and I'll mark it on the map "
                    "with detailed info.")

    return jsonify({
        "response": response,
        "timestamp": datetime.now().isoformat(),
        "type": "text"
    })

@app.route('/api/marine-data')
def get_marine_data():
    """Legacy endpoint for marine data"""
    return jsonify({
        "fishing_zones": list(LOCATION_DATABASE.keys()),
        "alerts": []
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    """Route legacy chat clients through the live mission-agent pipeline."""
    return start_mission()


def _normalize_indian_number(number):
    """Return the ten-digit Indian number format accepted by Fast2SMS."""
    digits = re.sub(r"\D", "", str(number or ""))
    if digits.startswith("91") and len(digits) == 12:
        digits = digits[2:]
    if len(digits) != 10 or not digits.startswith(tuple("6789")):
        raise ValueError("Use a valid Indian mobile number, for example 9876543210.")
    return digits


def _send_fast2sms(to_number, body):
    config = _fast2sms_config()
    if config["mock"]:
        logger.info("FAST2SMS_MOCK: would send to %s: %s", to_number, body)
        print("SMS sent (mock mode)", flush=True)
        return {"return": True, "mock": True}
    if not config["api_key"]:
        raise RuntimeError("FAST2SMS_API_KEY is not configured on this server.")

    payload = {
        "route": config["route"],
        "message": str(body)[:1500],
        "numbers": _normalize_indian_number(to_number),
    }
    if config["route"] == "dlt":
        if not config["sender_id"]:
            raise RuntimeError("FAST2SMS_SENDER_ID is required for the dlt route.")
        payload.update({
            "sender_id": config["sender_id"],
            "variables_values": config["variables_values"],
        })

    response = requests.post(
        FAST2SMS_URL,
        headers={
            "authorization": config["api_key"],
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=20,
    )
    response.raise_for_status()
    result = response.json()
    if result.get("return") is False:
        raise RuntimeError(result.get("message") or "Fast2SMS rejected the message.")
    print("SMS sent", flush=True)
    return result


def _process_sms_mission(incoming_message, to_number):
    """Run the normal ORCA mission pipeline and deliver its verdict by SMS."""
    try:
        if not MISSION_AGENT_AVAILABLE:
            raise RuntimeError(f"Mission agents are unavailable: {MISSION_AGENT_IMPORT_ERROR}")
        if run_mission is None:
            raise RuntimeError("Mission agent pipeline is unavailable on this server.")

        outcome = run_mission(incoming_message)
        if outcome.get("success"):
            reply = outcome.get("verdict", "ORCA finished without a verdict.")
        elif outcome.get("blocked"):
            reply = outcome.get("error", "ORCA needs a direction and distance offshore.")
        else:
            reply = f"ORCA could not complete the mission: {outcome.get('error', 'Unknown error')}"
        _send_fast2sms(to_number, reply)
    except Exception as exc:  # pragma: no cover - depends on external services
        logger.exception("SMS mission failed")
        print(f"Unable to send SMS: {exc}", flush=True)
        try:
            _send_fast2sms(to_number, f"ORCA could not process your request: {exc}")
        except Exception:
            logger.exception("Could not send SMS failure reply")


@app.route('/api/sms/send', methods=['POST'])
def send_sms_mission():
    """Run an ORCA query and send the final verdict through Fast2SMS."""
    body = request.get_json(silent=True) or {}
    user_query = (body.get("query") or "").strip()
    config = _fast2sms_config()
    recipient = (body.get("number") or config["default_number"]).strip()

    if not user_query:
        return jsonify({"success": False, "error": "Provide a mission query."}), 400
    if not config["api_key"] and not config["mock"]:
        return jsonify({"success": False, "error": "FAST2SMS_API_KEY is not configured."}), 503
    try:
        normalized_recipient = _normalize_indian_number(recipient)
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400

    threading.Thread(
        target=_process_sms_mission,
        args=(user_query, normalized_recipient),
        daemon=True,
    ).start()
    return jsonify({"success": True, "message": "ORCA is processing the query and will send the verdict by SMS."}), 202


@app.route('/api/sms/send-verdict', methods=['POST'])
def send_sms_verdict():
    """Send an already-computed web-chat verdict through Fast2SMS."""
    body = request.get_json(silent=True) or {}
    verdict = (body.get("verdict") or "").strip()
    config = _fast2sms_config()
    recipient = (body.get("number") or config["default_number"]).strip()

    if not verdict:
        return jsonify({"success": False, "error": "Provide a verdict to send."}), 400
    if not config["api_key"] and not config["mock"]:
        return jsonify({"success": False, "error": "FAST2SMS_API_KEY is not configured."}), 503
    try:
        normalized_recipient = _normalize_indian_number(recipient)
        _send_fast2sms(normalized_recipient, verdict)
    except (ValueError, requests.RequestException, RuntimeError) as exc:
        logger.warning("Could not send verdict SMS: %s", exc)
        print(f"Unable to send SMS: {exc}", flush=True)
        return jsonify({"success": False, "error": str(exc)}), 502

    return jsonify({"success": True, "message": "Final verdict sent by SMS."})

@app.route('/api/tiles/<int:z>/<int:x>/<int:y>.png')
def get_map_tile(z, x, y):
    """
    Map tile proxy endpoint:
    - Identifies application via real User-Agent and Referer headers
    - Enables caching via Cache-Control header (24h) and HTTP ETag validation (304 Not Modified)
    - Rate limits and handles 429/403/5xx errors with backoff & multi-tier fallback
    - Uses only free/keyless tile sources (OpenStreetMap, Humanitarian OSM, OpenTopoMap,
      Wikimedia Maps) so no "API key required" watermark can ever appear on served tiles
    - Supports style selection (standard, humanitarian, topo) via ?style= query param;
      unknown/missing values safely fall back to the default style
    """
    style = request.args.get('style', DEFAULT_TILE_STYLE).strip().lower()

    try:
        data, content_type, etag, status_code = get_tile_data(z, x, y, style=style)
    except Exception:
        # Last-resort safety net: never let an unforeseen error surface as a 500 to the map widget
        logger.exception("Unhandled error serving tile z=%s x=%s y=%s style=%s", z, x, y, style)
        return jsonify({"error": "Tile service temporarily unavailable"}), 503

    if status_code != 200 or not data:
        return jsonify({"error": content_type}), status_code

    # Check client conditional GET header If-None-Match
    client_etag = request.headers.get('If-None-Match')
    if client_etag and etag and client_etag.strip() == etag.strip():
        response = Response(status=304)
        response.headers['ETag'] = etag
        response.headers['Cache-Control'] = 'public, max-age=86400, immutable'
        return response

    response = Response(data, mimetype=content_type)
    if etag:
        response.headers['ETag'] = etag
    # Enable caching in client browser (1 day = 86400 seconds)
    response.headers['Cache-Control'] = 'public, max-age=86400, immutable'
    response.headers.pop('Pragma', None)
    return response

@app.route('/api/mission/start', methods=['POST'])
def start_mission():
    """
    Kicks off the CrewAI Planner -> Weather/Geospatial -> Judge pipeline for a
    free-text offshore query (e.g. "Head 30km offshore from 14.71N, 74.26E
    tomorrow morning"). Nothing about the location/time/verdict is hardcoded -
    the planner LLM extracts it from the query and the downstream agents pull
    live data for whatever coordinates it resolves.

    Returns a mission_id whose live stage updates can be streamed from
    /api/mission/stream/<mission_id> (Server-Sent Events).
    """
    if not MISSION_AGENT_AVAILABLE:
        return jsonify({
            "success": False,
            "error": f"Mission agents are unavailable on this server: {MISSION_AGENT_IMPORT_ERROR}"
        }), 503
    if run_mission is None:
        return jsonify({
            "success": False,
            "error": "Mission agent pipeline is unavailable on this server."
        }), 503
    mission_runner = run_mission

    body = request.get_json(silent=True) or {}
    user_query = (body.get('query') or '').strip()
    if not user_query:
        return jsonify({
            "success": False,
            "error": "Describe your offshore mission (location, distance, and time)."
        }), 400

    mission_id = uuid.uuid4().hex
    event_queue = queue.Queue()
    with _MISSION_QUEUES_LOCK:
        _MISSION_QUEUES[mission_id] = event_queue

    def _on_event(stage, payload):
        event_queue.put({"stage": stage, "payload": payload})

    def _worker():
        try:
            outcome = mission_runner(user_query, on_event=_on_event)
            event_queue.put({"stage": "done", "payload": outcome})
        except Exception as exc:
            event_queue.put({"stage": "error", "payload": {"message": str(exc)}})
        finally:
            event_queue.put(None)  # sentinel: stream can close

    threading.Thread(target=_worker, daemon=True).start()
    return jsonify({"success": True, "mission_id": mission_id})


@app.route('/api/mission/stream/<mission_id>')
def stream_mission(mission_id):
    """
    Server-Sent Events stream of live mission stage updates: "planner"
    (offshore coordinates), "weather" (sea/wind conditions), "geospatial"
    (chlorophyll/SST), "judge" (final verdict), then "done".
    """
    with _MISSION_QUEUES_LOCK:
        event_queue = _MISSION_QUEUES.get(mission_id)
    if event_queue is None:
        return jsonify({"error": "Unknown or expired mission id"}), 404

    def _generate():
        try:
            while True:
                # CrewAI + satellite data lookups can legitimately take several
                # minutes (LLM calls, Copernicus downloads), so this needs to be
                # generous rather than matching typical request timeouts.
                item = event_queue.get(timeout=600)
                if item is None:
                    break
                yield f"data: {json.dumps(item)}\n\n"
        except queue.Empty:
            yield f"data: {json.dumps({'stage': 'error', 'payload': {'message': 'Mission timed out'}})}\n\n"
        finally:
            with _MISSION_QUEUES_LOCK:
                _MISSION_QUEUES.pop(mission_id, None)

    return Response(_generate(), mimetype='text/event-stream', headers={
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
    })


if __name__ == '__main__':
    # Debug mode (interactive debugger/reloader) must be explicitly opted into via
    # env var - leaving it on by default is a security risk if ever exposed.
    debug_mode = os.environ.get("FLASK_DEBUG", "false").strip().lower() in ("1", "true", "yes")
    # threaded=True: the mission SSE stream holds a request open (blocking on
    # its queue) while a background thread runs CrewAI, so other requests
    # (tiles, chat, another mission) must be able to proceed concurrently.
    app.run(debug=debug_mode, host='localhost', port=5000, threaded=True)
    