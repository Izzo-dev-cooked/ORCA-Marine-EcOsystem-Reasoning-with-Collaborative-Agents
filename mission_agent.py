"""
Reusable CrewAI marine mission pipeline (Planner -> Weather/Geospatial -> Judge).

Extracted from `actual final demo 2.py` so the Flask UI (ui.py) can trigger a
mission for any free-text query and react live to each agent's output via
`run_mission(user_query, on_event)`. Nothing here is hardcoded to a specific
place/time/query - the planner LLM extracts those from whatever text is
passed in, and the weather/geospatial/judge agents work off whatever
coordinates and timestamp the planner resolves.
"""
import json
import os
import re
import tempfile
import threading
from datetime import datetime, timedelta, timezone
from typing import Optional

import requests
import xarray as xr
import copernicusmarine
from crewai import Agent, Task, Crew, Process, LLM
from crewai.tools import tool
import crewai.llms.cache as _crewai_cache
from geopy.geocoders import Nominatim
from geopy.distance import distance, Point

_crewai_cache.mark_cache_breakpoint = lambda msg: msg

# ==========================================
# LIVE MISSION EVENT BUS
# ==========================================
# The UI drives this pipeline through `run_mission()` and needs to react the
# instant each agent produces something useful: the Planner's offshore
# coordinates, the Weather Analyst's / Geospatial Analyst's readings, and
# finally the Judge's verdict. Tools run deep inside CrewAI's own executor, so
# rather than threading a callback through every Agent/Task object, the tools
# report their structured results to a single "current mission" emitter here.
# `_mission_lock` guarantees only one mission's tools are ever wired to the
# emitter at a time, so this stays correct even though CrewAI may run the
# weather/geospatial tasks concurrently on background threads.
_mission_lock = threading.RLock()
_current_on_event = None
_LAND_SEA_CACHE = {}
_LAND_SEA_CACHE_LOCK = threading.Lock()
_PENDING_LAND_REFERENCE = None
INCOIS_MARINE_FISHERIES_URL = "https://incois.gov.in/MarineFisheries/TextDataHome?mfid=1&request_locale=en"
NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"
NOMINATIM_HEADERS = {"User-Agent": "ORCA-MarineApp/1.0"}

HARDCODED_PORTS = {
    "dagara": {"direction": "SE", "bearing": 176, "depth": "52-57", "distance": "18-23", "lat": "21 3 5 N", "lon": "87 21 53 E"},
    "kasianala": {"direction": "SE", "bearing": 96, "depth": "54-59", "distance": "14-19", "lat": "21 1 45 N", "lon": "87 21 30 E"},
    "talchua": {"direction": "NE", "bearing": 57, "depth": "49-54", "distance": "14-19", "lat": "21 0 29 N", "lon": "87 20 56 E"},
    "karanpalli": {"direction": "NE", "bearing": 84, "depth": "44-49", "distance": "18-23", "lat": "20 59 45 N", "lon": "87 19 45 E"},
    "baincha": {"direction": "NE", "bearing": 83, "depth": "41-46", "distance": "16-21", "lat": "20 58 41 N", "lon": "87 18 52 E"},
    "karanjamal": {"direction": "NE", "bearing": 81, "depth": "39-44", "distance": "19-24", "lat": "20 57 26 N", "lon": "87 18 15 E"},
    "chandinipal": {"direction": "NE", "bearing": 67, "depth": "37-42", "distance": "23-28", "lat": "20 56 4 N", "lon": "87 18 3 E"},
    "kaithakhola": {"direction": "NE", "bearing": 81, "depth": "37-42", "distance": "26-31", "lat": "20 54 42 N", "lon": "87 18 19 E"},
    "ahirajpur": {"direction": "NE", "bearing": 61, "depth": "34-39", "distance": "18-23", "lat": "20 53 27 N", "lon": "87 17 58 E"},
    "dhamarafh": {"direction": "NE", "bearing": 78, "depth": "33-38", "distance": "15-20", "lat": "20 53 2 N", "lon": "87 16 38 E"},
    "false point": {"direction": "NE", "bearing": 80, "depth": "84-89", "distance": "63-68", "lat": "20 26 50 N", "lon": "87 31 44 E"},
    "sasanpeta(tantiapal)": {"direction": "SE", "bearing": 96, "depth": "80-85", "distance": "63-68", "lat": "20 26 45 N", "lon": "87 29 30 E"},
    "dhamra": {"direction": "SE", "bearing": 124, "depth": "71-76", "distance": "61-66", "lat": "20 25 59 N", "lon": "87 27 24 E"},
    "barunie": {"direction": "SE", "bearing": 94, "depth": "87-92", "distance": "65-70", "lat": "20 25 38 N", "lon": "87 33 38 E"},
    "kharinasi": {"direction": "NE", "bearing": 88, "depth": "97-102", "distance": "108-113", "lat": "20 25 28 N", "lon": "87 38 0 E"},
    "jmboo": {"direction": "SE", "bearing": 91, "depth": "92-97", "distance": "79-84", "lat": "20 25 15 N", "lon": "87 35 47 E"},
    "gajarajpur": {"direction": "SE", "bearing": 102, "depth": "69-74", "distance": "59-64", "lat": "20 24 41 N", "lon": "87 25 33 E"},
    "jambu": {"direction": "E", "bearing": 90, "depth": "101-106", "distance": "109-114", "lat": "20 24 6 N", "lon": "87 39 44 E"},
    "hariharpur": {"direction": "SE", "bearing": 111, "depth": "59-64", "distance": "49-54", "lat": "20 23 40 N", "lon": "87 23 34 E"},
    "satbhaya": {"direction": "SE", "bearing": 122, "depth": "51-56", "distance": "73-78", "lat": "20 23 20 N", "lon": "87 21 20 E"},
    "hansakura": {"direction": "SW", "bearing": 185, "depth": "152-157", "distance": "47-52", "lat": "20 7 14 N", "lon": "87 2 19 E"},
    "bindha": {"direction": "SW", "bearing": 185, "depth": "153-158", "distance": "41-46", "lat": "20 5 36 N", "lon": "87 1 41 E"},
    "bahabalpur": {"direction": "SW", "bearing": 184, "depth": "154-159", "distance": "77-82", "lat": "20 4 13 N", "lon": "87 0 33 E"},
    "jamuka": {"direction": "SE", "bearing": 159, "depth": "59-64", "distance": "1031-1036", "lat": "19 42 6 N", "lon": "86 47 41 E"},
    "paradeepfh": {"direction": "SW", "bearing": 213, "depth": "71-76", "distance": "44-49", "lat": "19 41 29 N", "lon": "86 14 53 E"},
    "nuagan": {"direction": "SE", "bearing": 159, "depth": "60-65", "distance": "1102-1107", "lat": "19 40 36 N", "lon": "86 46 55 E"},
    "magarkhia": {"direction": "SE", "bearing": 148, "depth": "40-45", "distance": "821-826", "lat": "19 39 38 N", "lon": "86 35 51 E"},
    "noliasahi": {"direction": "SE", "bearing": 157, "depth": "61-66", "distance": "1181-1186", "lat": "19 38 57 N", "lon": "86 46 26 E"},
    "nuagar": {"direction": "SE", "bearing": 142, "depth": "45-50", "distance": "933-938", "lat": "19 38 18 N", "lon": "86 36 54 E"},
    "kaliakana": {"direction": "SE", "bearing": 153, "depth": "58-63", "distance": "1164-1169", "lat": "19 38 0 N", "lon": "86 45 6 E"},
    "nuagarhfh(astaranga)": {"direction": "SE", "bearing": 133, "depth": "57-62", "distance": "1111-1116", "lat": "19 37 34 N", "lon": "86 43 27 E"},
    "sudhikeswar(talia)": {"direction": "SE", "bearing": 136, "depth": "48-53", "distance": "979-984", "lat": "19 37 30 N", "lon": "86 38 23 E"},
    "saharabedi": {"direction": "SE", "bearing": 153, "depth": "54-59", "distance": "1081-1086", "lat": "19 37 18 N", "lon": "86 41 46 E"},
    "bandar": {"direction": "SE", "bearing": 141, "depth": "52-57", "distance": "1037-1042", "lat": "19 37 14 N", "lon": "86 40 4 E"},
    "balipantala": {"direction": "SW", "bearing": 221, "depth": "56-61", "distance": "116-121", "lat": "19 32 49 N", "lon": "85 55 45 E"},
    "astaranga": {"direction": "SW", "bearing": 221, "depth": "57-62", "distance": "236-241", "lat": "19 31 39 N", "lon": "85 54 47 E"},
    "anakona&dalukani": {"direction": "SW", "bearing": 220, "depth": "58-63", "distance": "452-457", "lat": "19 30 20 N", "lon": "85 54 2 E"},
    "kajalpatia(khandiapatna)": {"direction": "SW", "bearing": 218, "depth": "53-58", "distance": "472-477", "lat": "19 29 39 N", "lon": "85 51 19 E"},
    "chandrabhaga": {"direction": "SW", "bearing": 215, "depth": "48-53", "distance": "400-405", "lat": "19 29 36 N", "lon": "85 49 49 E"},
    "tondahar": {"direction": "SW", "bearing": 218, "depth": "56-61", "distance": "526-531", "lat": "19 29 31 N", "lon": "85 52 49 E"},
    "bangor": {"direction": "SW", "bearing": 208, "depth": "43-48", "distance": "469-474", "lat": "19 28 41 N", "lon": "85 48 37 E"},
    "penthakata": {"direction": "SW", "bearing": 188, "depth": "36-41", "distance": "520-525", "lat": "19 27 29 N", "lon": "85 47 43 E"},
    "puri": {"direction": "SW", "bearing": 187, "depth": "37-42", "distance": "567-572", "lat": "19 26 13 N", "lon": "85 46 54 E"},
    "purisouth": {"direction": "SW", "bearing": 188, "depth": "37-42", "distance": "529-534", "lat": "19 25 46 N", "lon": "85 45 28 E"},
    "purinorth": {"direction": "SW", "bearing": 204, "depth": "49-54", "distance": "141-146", "lat": "19 21 2 N", "lon": "85 34 20 E"},
    "ganjam": {"direction": "SE", "bearing": 96, "depth": "51-56", "distance": "163-168", "lat": "19 19 32 N", "lon": "85 33 27 E"},
    "kantiagada(podampeta)": {"direction": "SE", "bearing": 103, "depth": "48-53", "distance": "191-196", "lat": "19 17 58 N", "lon": "85 32 41 E"},
}


def _decimal_to_dms(value: float, latitude: bool) -> str:
    """Format a decimal coordinate as degrees, minutes, seconds, and hemisphere."""
    hemisphere = ("N" if value >= 0 else "S") if latitude else ("E" if value >= 0 else "W")
    absolute = abs(value)
    degrees = int(absolute)
    minutes_float = (absolute - degrees) * 60
    minutes = int(minutes_float)
    seconds = (minutes_float - minutes) * 60
    return f"{degrees}° {minutes:02d}' {seconds:05.2f}\" {hemisphere}"


def _normalize_port_name(value: str) -> str:
    return "".join(character for character in value.casefold() if character.isalnum())


def _find_hardcoded_port(value: str) -> dict | None:
    normalized = _normalize_port_name(value)
    for name, details in HARDCODED_PORTS.items():
        if normalized == _normalize_port_name(name):
            return details
    return None


def _dms_to_decimal(value: str) -> float:
    parts = value.split()
    degrees, minutes, seconds = map(float, parts[:3])
    decimal = degrees + minutes / 60 + seconds / 3600
    return -decimal if parts[3].upper() in {"S", "W"} else decimal


def _emit(stage: str, payload: dict) -> None:
    """Report a structured, real-time update for the mission currently running."""
    callback = _current_on_event
    if callback is None:
        return
    try:
        callback(stage, payload)
    except Exception:
        # A UI-side rendering error must never break the agent pipeline.
        pass


def _coordinate_cache_key(lat: float, lon: float) -> tuple[float, float]:
    return round(float(lat), 5), round(float(lon), 5)


def check_land_or_sea(lat: float, lon: float) -> dict:
    """Classify coordinates with cached Nominatim reverse geocoding."""
    cache_key = _coordinate_cache_key(lat, lon)
    with _LAND_SEA_CACHE_LOCK:
        cached = _LAND_SEA_CACHE.get(cache_key)
    if cached is not None:
        return cached

    result = None
    request_failed = False
    try:
        response = requests.get(
            NOMINATIM_REVERSE_URL,
            params={"lat": lat, "lon": lon, "format": "json", "zoom": 10},
            headers=NOMINATIM_HEADERS,
            timeout=15,
        )
        response.raise_for_status()
        result = response.json()
    except (requests.RequestException, ValueError):
        request_failed = True

    classification = "SEA"
    reason = "Nominatim returned no location address."
    if request_failed:
        classification = "LAND"
        reason = "Nominatim could not verify the location; treating it as land for safety."
    elif result is None or not isinstance(result, dict) or not result:
        classification = "SEA"
    else:
        address = result.get("address")
        category = str(result.get("category") or "").casefold()
        result_type = str(result.get("type") or "").casefold()
        natural = str((address or {}).get("natural") or "").casefold() if isinstance(address, dict) else ""
        water_terms = ("water", "ocean", "sea", "bay", "harbour", "harbor", "coast", "beach", "marine")
        land_fields = ("state", "county", "city", "town", "village", "municipality", "road", "suburb", "postcode")

        if any(term in value for term in water_terms for value in (category, result_type, natural)):
            classification = "SEA"
            reason = "Nominatim identified a water or marine feature."
        elif isinstance(address, dict) and any(address.get(field) for field in land_fields):
            classification = "LAND"
            reason = "Nominatim returned populated land address features."
        elif isinstance(address, dict) and address:
            classification = "LAND"
            reason = "Nominatim returned an ambiguous populated address."
        else:
            classification = "SEA"
            reason = "Nominatim returned no land address."

    checked = {"classification": classification, "lat": lat, "lon": lon, "reason": reason}
    with _LAND_SEA_CACHE_LOCK:
        _LAND_SEA_CACHE[cache_key] = checked
    return checked


def _extract_json_object(value: object) -> dict | None:
    text = value if isinstance(value, str) else str(value)
    decoder = json.JSONDecoder()
    for index, character in enumerate(text):
        if character != "{":
            continue
        try:
            parsed, _ = decoder.raw_decode(text[index:])
        except json.JSONDecodeError:
            continue
        if isinstance(parsed, dict):
            return parsed
    return None


def _parse_direction_and_distance(query: str) -> tuple[float, float] | None:
    distance_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:km|kilometers?)\b", query, re.IGNORECASE)
    if not distance_match:
        return None
    direction_match = re.search(
        r"\b(north|northeast|east|southeast|south|southwest|west|northwest)\b|\b(?:bearing|heading)\s*(?:of|:)?\s*(\d+(?:\.\d+)?)\s*(?:degrees?|°)?",
        query,
        re.IGNORECASE,
    )
    if not direction_match:
        return None
    cardinal_bearings = {
        "north": 0, "northeast": 45, "east": 90, "southeast": 135,
        "south": 180, "southwest": 225, "west": 270, "northwest": 315,
    }
    direction = direction_match.group(1)
    bearing = cardinal_bearings[direction.casefold()] if direction else float(direction_match.group(2))
    return bearing % 360, float(distance_match.group(1))


def _destination_from_reference(lat: float, lon: float, bearing: float, distance_km: float) -> tuple[float, float]:
    destination = distance(kilometers=distance_km).destination(Point(lat, lon), bearing=bearing)
    return destination.latitude, destination.longitude


def _get_llm() -> LLM:
    return LLM(
        model="qwen/qwen3.8-27b",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.7,
        max_tokens=1024,
    )


@tool("Universal Marine GIS & Offshore Calculator")
def universal_offshore_calculator(
    location_name: str,
    start_lat: Optional[float],
    start_lon: Optional[float],
    distance_km: float,
) -> str:
    """
    Computes coordinates at a specified distance seaward.
    If the user provides exact coordinates in the query, pass them as 'start_lat' and 'start_lon'.
    If the user provides a port or city name, pass it as 'location_name'.
    """
    hardcoded_port = _find_hardcoded_port(location_name)
    coast_side = ""
    destination = Point(0, 0)
    route_metadata = {}
    if hardcoded_port:
        target_lat = _dms_to_decimal(hardcoded_port["lat"])
        target_lon = _dms_to_decimal(hardcoded_port["lon"])
        seaward_bearing = hardcoded_port["bearing"]
        # INCOIS coordinates are the authoritative offshore target. Do not
        # derive them from the advisory depth/distance bands.
        destination = Point(target_lat, target_lon)
        loc_lat, loc_lon = target_lat, target_lon
        resolved_name = location_name
        coast_side = hardcoded_port["direction"]
        route_metadata = {
            "from_coast": location_name,
            "direction": hardcoded_port["direction"],
            "bearing_degrees": seaward_bearing,
            "distance_km": distance_km,
            "depth_mtr": {"from": None, "to": None},
            "latitude": {"from": target_lat, "to": target_lat},
            "longitude": {"from": target_lon, "to": target_lon},
            "latitude_dms": {"from": hardcoded_port["lat"], "to": hardcoded_port["lat"]},
            "longitude_dms": {"from": hardcoded_port["lon"], "to": hardcoded_port["lon"]},
            "incois_advisory_url": INCOIS_MARINE_FISHERIES_URL,
            "coordinate_source": "hardcoded_incois_port_data",
            "coordinate_system": "WGS84 decimal degrees (EPSG:4326)",
        }
    elif start_lat is not None and start_lon is not None:
        loc_lat = start_lat
        loc_lon = start_lon
        resolved_name = location_name if location_name else f"User Coordinates ({start_lat}, {start_lon})"
        seaward_bearing = None
    elif location_name:
        geolocator = Nominatim(user_agent="orca_marine_assistant")
        loc = geolocator.geocode(f"{location_name}, India", timeout=10)  # type: ignore
        if not loc:
            loc_lat, loc_lon = 9.940, 76.260
            resolved_name = f"{location_name} (Fallback to Kochi Port)"
        else:
            loc_lat, loc_lon = loc.latitude, loc.longitude  # type: ignore
            resolved_name = loc.address  # type: ignore
        seaward_bearing = None
    else:
        return json.dumps({"error": "You must provide either a location_name or start_lat/start_lon."})

    if seaward_bearing is None:
        if loc_lat < 8.5:
            seaward_bearing = 225
            coast_side = "Southern Tip / Indian Ocean"
        elif loc_lon < 77.5:
            seaward_bearing = 270
            coast_side = "West Coast (Arabian Sea)"
        else:
            seaward_bearing = 90
            coast_side = "East Coast (Bay of Bengal)"

        origin = Point(loc_lat, loc_lon)
        destination = distance(kilometers=distance_km).destination(origin, bearing=seaward_bearing)
        route_metadata = {
            "from_coast": resolved_name,
            "direction": coast_side,
            "bearing_degrees": seaward_bearing,
            "distance_km": distance_km,
            "depth_mtr": {"from": None, "to": None},
            "latitude_dms": {
                "from": _decimal_to_dms(loc_lat, latitude=True),
                "to": _decimal_to_dms(destination.latitude, latitude=True),
            },
            "longitude_dms": {
                "from": _decimal_to_dms(loc_lon, latitude=False),
                "to": _decimal_to_dms(destination.longitude, latitude=False),
            },
            "incois_advisory_url": INCOIS_MARINE_FISHERIES_URL,
            "coordinate_source": "geopy",
            "coordinate_system": "WGS84 decimal degrees (EPSG:4326)",
        }

    result = {
        "input_location": location_name or "Custom Lat/Lon",
        "resolved_coastal_hub": resolved_name,
        "coast_region": coast_side,
        "origin_coordinates": {"lat": loc_lat, "lon": loc_lon},
        "offshore_distance_km": distance_km,
        "heading_bearing_degrees": seaward_bearing,
        "target_marine_coordinates": {
            "lat": destination.latitude,
            "lon": destination.longitude,
        },
        "route_metadata": route_metadata,
    }
    _emit("planner", result)
    return json.dumps(result, indent=2)


@tool("Open-Meteo Marine & Weather Tool")
def fetch_marine_weather(lat: float, lon: float, target_datetime_iso: str = None) -> str:  # type: ignore
    """Fetches marine and weather data (wind, wave, swell)."""
    try:
        if target_datetime_iso:
            marine_url = f"https://marine-api.open-meteo.com/v1/marine?latitude={lat}&longitude={lon}&hourly=wave_height,swell_wave_height,swell_wave_period&timezone=auto&forecast_days=3"
            weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=wind_speed_10m,wind_gusts_10m&timezone=auto&forecast_days=3"

            marine_resp = requests.get(marine_url).json()
            weather_resp = requests.get(weather_url).json()
            times = marine_resp.get("hourly", {}).get("time", [])

            target_hour_prefix = target_datetime_iso[:13] + ":00"
            idx = next((i for i, t in enumerate(times) if t.startswith(target_hour_prefix)), None)

            if idx is not None:
                report = {
                    "scheduled_time": times[idx],
                    "coordinates": {"lat": lat, "lon": lon},
                    "ocean_state": {
                        "wave_height_meters": marine_resp["hourly"]["wave_height"][idx],
                        "swell_period_seconds": marine_resp["hourly"]["swell_wave_period"][idx],
                    },
                    "atmospheric_state": {
                        "wind_speed_kmh": weather_resp["hourly"]["wind_speed_10m"][idx],
                    },
                }
                _emit("weather", report)
                return json.dumps(report, indent=2)
            else:
                error_report = {"error": f"Target time {target_datetime_iso} is out of the 3-day forecast range."}
                _emit("weather", error_report)
                return json.dumps(error_report)
        else:
            marine_url = f"https://marine-api.open-meteo.com/v1/marine?latitude={lat}&longitude={lon}&current=wave_height,swell_wave_period"
            weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=wind_speed_10m"
            report = {
                "scheduled_time": "LIVE CURRENT CONDITIONS",
                "coordinates": {"lat": lat, "lon": lon},
                "ocean_state": requests.get(marine_url).json().get("current", {}),
                "atmospheric_state": requests.get(weather_url).json().get("current", {}),
            }
            _emit("weather", report)
            return json.dumps(report, indent=2)

    except Exception as e:
        error_report = {"error": f"Error fetching weather data: {str(e)}"}
        _emit("weather", error_report)
        return json.dumps(error_report)


@tool("Copernicus Marine Chlorophyll & SST Tool")
def fetch_copernicus_ocean_data(lat: float, lon: float, target_datetime_iso: str) -> str:
    """Fetches chlorophyll-a concentration and sea surface temperature for PFZ mapping."""
    buffer = 0.15
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            copernicusmarine.subset(
                dataset_id="cmems_mod_glo_bgc-pft_anfc_0.25deg_P1D-m",
                variables=["chl"],
                minimum_longitude=lon - buffer, maximum_longitude=lon + buffer,
                minimum_latitude=lat - buffer, maximum_latitude=lat + buffer,
                start_datetime=target_datetime_iso, end_datetime=target_datetime_iso,
                minimum_depth=0.4940253794193268, maximum_depth=0.4940253794193268,
                output_directory=tmpdir, output_filename="chl.nc",
            )
            copernicusmarine.subset(
                dataset_id="cmems_mod_glo_phy-thetao_anfc_0.083deg_P1D-m",
                variables=["thetao"],
                minimum_longitude=lon - buffer, maximum_longitude=lon + buffer,
                minimum_latitude=lat - buffer, maximum_latitude=lat + buffer,
                start_datetime=target_datetime_iso, end_datetime=target_datetime_iso,
                minimum_depth=0.4940253794193268, maximum_depth=0.4940253794193268,
                output_directory=tmpdir, output_filename="sst.nc",
            )

            chl_ds = xr.open_dataset(f"{tmpdir}/chl.nc")
            sst_ds = xr.open_dataset(f"{tmpdir}/sst.nc")

            chl_value = float(chl_ds["chl"].mean(skipna=True).values)
            sst_value = float(sst_ds["thetao"].mean(skipna=True).values)

            chl_ds.close()
            sst_ds.close()

        result = {
            "coordinates": {"lat": lat, "lon": lon},
            "datetime": target_datetime_iso,
            "chlorophyll_mg_m3": round(chl_value, 4) if chl_value == chl_value else None,
            "sea_surface_temp_celsius": round(sst_value, 2) if sst_value == sst_value else None,
            "incois_advisory_url": INCOIS_MARINE_FISHERIES_URL,
        }
        _emit("geospatial", result)
        return json.dumps(result, indent=2)
    except Exception as e:
        error_result = {"error": f"Error fetching Copernicus Marine data: {str(e)}"}
        _emit("geospatial", error_result)
        return json.dumps(error_result)


def _build_crew(user_query: str, planner_only: bool = False, planner_report: str | None = None) -> Crew:
    """Builds a fresh set of agents/tasks/crew for one mission - no state is shared across requests."""
    llm = _get_llm()
    current_date = datetime.now(timezone.utc).astimezone(
        timezone(timedelta(hours=5, minutes=30))
    ).strftime("%A, %B %d, %Y at %I:%M %p IST")

    planner_agent = Agent(
        role="Marine Geospatial Planner",
        goal="Extract locations and exact ISO-8601 timestamps from user queries, then calculate offshore coordinates.",
        backstory="You are a maritime GIS specialist. You translate conversational times into exact timestamps and resolve coordinates.",
        tools=[universal_offshore_calculator],
        llm=llm,
        verbose=True,
    )

    weather_analyst = Agent(
        role="Marine Meteorologist & Oceanographer",
        goal="Retrieve sea conditions for a specific location AND time, then assess safety.",
        backstory="You query satellite tools using exact coordinates to evaluate vessel safety. Wave heights > 2.0m are dangerous.",
        tools=[fetch_marine_weather],
        llm=llm,
        verbose=True,
    )

    geospatial_agent = Agent(
        role="Marine Geospatial & Fisheries Analyst",
        goal="Retrieve chlorophyll and sea surface temperature for a specific location AND time, assess PFZ potential, and present the route in an INCOIS-compatible marine advisory format.",
        backstory="You query satellite data to identify Potential Fishing Zones based on chlorophyll and SST. Use the official INCOIS Marine Fisheries advisory as the reference source for marine advisory context; never invent bathymetry when depth data is unavailable.",
        tools=[fetch_copernicus_ocean_data],
        llm=llm,
        verbose=True,
    )

    judge_agent = Agent(
        role="Chief Marine Safety & Fishery Commander",
        goal="Evaluate weather safety and fishing potential simultaneously to provide a final recommendation.",
        backstory="You are a veteran marine commander. You wait for both the weather meteorologist and the geospatial analyst to provide their reports. You combine their findings to issue a definitive final verdict on whether the location is safe, and if it's a worthwhile fishing spot.",
        llm=llm,
        verbose=True,
    )

    planning_task = Task(
        description=f"""
        Analyze the user query: '{user_query}'.
        CURRENT REAL-WORLD CLOCK (IST): {current_date}.

        1. Convert time to ISO-8601 string in IST.
        2. Extract the starting location.
           - If the user provides explicit coordinates (like 14.7110 N, 74.2640 E), pass numeric `start_lat` and `start_lon` values and use an empty string for `location_name`.
           - If the user provides a port/city name, pass that name as `location_name` and use JSON null for both `start_lat` and `start_lon`.
           - For a listed INCOIS port, use the calculator's returned WGS84 decimal-degree coordinates exactly. Do not geocode or replace those coordinates.
           - If the user gives only a place or city name without an offshore distance, use `distance_km: 0` so the agents assess that coastal location directly.
           - If the user gives an offshore distance, preserve that distance in `distance_km`.
           - Always include all four tool arguments: `location_name`, `start_lat`, `start_lon`, and `distance_km`.
        3. Pass the resulting offshore target coordinates and timestamp to the downstream agents.
        """,
        expected_output="Offshore Coordinates and an exact ISO-8601 timestamp string.",
        agent=planner_agent,
    )

    if planner_only:
        return Crew(
            agents=[planner_agent],
            tasks=[planning_task],
            process=Process.sequential,
            verbose=True,
        )

    planner_context = planner_report or "The Planner report was not provided."
    downstream_context = [planning_task] if planner_report is None else []

    analyst_task = Task(
        description=f"""
        Use this verified Planner report as the only source of mission coordinates and time:
        {planner_context}

        Call the Weather tool using those coordinates and timestamp.
        Write a short safety report based on wave height and wind.
        """,
        expected_output="Meteorological safety advisory.",
        agent=weather_analyst,
        context=downstream_context,
        async_execution=True,
    )

    geospatial_task = Task(
        description=f"""
        Use this verified Planner report as the only source of mission coordinates and time:
        {planner_context}

        Call the Copernicus Tool using those coordinates and timestamp.
        Write a short report on chlorophyll and fishing potential. Include the official INCOIS Marine Fisheries advisory reference: https://incois.gov.in/MarineFisheries/TextDataHome?mfid=1&request_locale=en.
        Preserve the Planner's route metadata: from coast, direction, bearing, distance, from/to latitude and longitude in DMS. Depth from/to must be reported as unavailable unless a source provides it.
        """,
        expected_output="PFZ viability report.",
        agent=geospatial_agent,
        context=downstream_context,
        async_execution=True,
    )

    judge_task = Task(
        description="""
        Review the outputs provided by BOTH the Weather Analyst and the Geospatial Agent.

        Write one concise final advice of 30 to 50 words total. Use exactly these labeled parts:
        Safety: [Safe, Caution, or Hazardous, with the key reason].
        PFZ: [brief fishing potential assessment based only on the fishery report].
        Recommendation: [clear advice on whether the user should proceed].
        Do not include statistics, percentages, historical baselines, headings, or commentary outside these three parts.
        """,
        expected_output="A 30-50 word final advice containing Safety, PFZ, and Recommendation.",
        agent=judge_agent,
        context=[analyst_task, geospatial_task],
    )

    return Crew(
        agents=[weather_analyst, geospatial_agent, judge_agent],
        tasks=[analyst_task, geospatial_task, judge_task],
        process=Process.sequential,
        verbose=True,
    )


def run_mission(user_query: str, on_event=None) -> dict:
    """
    Runs the full Planner -> Weather/Geospatial -> Judge pipeline for an
    arbitrary natural-language offshore query.

    `on_event(stage, payload)` fires live as each agent's tool produces a
    result: "planner" (offshore coordinates), "weather" (sea/wind conditions),
    "geospatial" (chlorophyll/SST), then "judge" (the combined final verdict)
    once the whole crew has finished.

    Only one mission runs at a time (`_mission_lock`), since the tools report
    through a single global emitter shared by this module.
    """
    global _current_on_event, _PENDING_LAND_REFERENCE
    with _mission_lock:
        planner_payload = None

        def forward_event(stage: str, payload: dict) -> None:
            nonlocal planner_payload
            if stage == "planner":
                planner_payload = payload
            if on_event is not None:
                on_event(stage, payload)

        _current_on_event = forward_event
        try:
            pending = _PENDING_LAND_REFERENCE
            follow_up = _parse_direction_and_distance(user_query) if pending else None

            if pending and follow_up:
                bearing, distance_km = follow_up
                target_lat, target_lon = _destination_from_reference(
                    pending["lat"], pending["lon"], bearing, distance_km
                )
                planner_payload = {
                    "input_location": pending["query"],
                    "resolved_coastal_hub": pending["query"],
                    "coast_region": "User-directed offshore route",
                    "offshore_distance_km": distance_km,
                    "heading_bearing_degrees": bearing,
                    "origin_coordinates": {"lat": pending["lat"], "lon": pending["lon"]},
                    "target_marine_coordinates": {"lat": target_lat, "lon": target_lon},
                    "route_metadata": {
                        "from_coast": pending["query"],
                        "direction": f"Bearing {bearing:.1f}°",
                        "bearing_degrees": bearing,
                        "distance_km": distance_km,
                        "depth_mtr": {"from": None, "to": None},
                        "latitude_dms": {
                            "from": _decimal_to_dms(pending["lat"], latitude=True),
                            "to": _decimal_to_dms(target_lat, latitude=True),
                        },
                        "longitude_dms": {
                            "from": _decimal_to_dms(pending["lon"], latitude=False),
                            "to": _decimal_to_dms(target_lon, latitude=False),
                        },
                        "incois_advisory_url": INCOIS_MARINE_FISHERIES_URL,
                    },
                }
                _PENDING_LAND_REFERENCE = None
                _emit("planner", planner_payload)
            else:
                planner_crew = _build_crew(user_query, planner_only=True)
                planner_result = planner_crew.kickoff(inputs={"user_query": user_query})
                if planner_payload is None:
                    planner_payload = _extract_json_object(getattr(planner_result, "raw", planner_result))

            if not planner_payload:
                return {"success": False, "error": "Planner did not return usable coordinates."}

            target = planner_payload.get("target_marine_coordinates") or {}
            target_lat = target.get("lat")
            target_lon = target.get("lon")
            if not isinstance(target_lat, (int, float)) or not isinstance(target_lon, (int, float)):
                return {"success": False, "error": "Planner did not return valid target coordinates."}

            land_sea = check_land_or_sea(float(target_lat), float(target_lon))
            _emit("land_sea_check", land_sea)
            if land_sea["classification"] == "LAND":
                _PENDING_LAND_REFERENCE = {
                    "lat": float(target_lat),
                    "lon": float(target_lon),
                    "query": user_query,
                }
                message = (
                    "The Planner target is on land, so I stopped before Weather, Fishery, and Judge. "
                    "Please specify a direction to head offshore (for example west, southwest, or bearing 225 degrees) "
                    "and a distance from this reference location (for example 12 km)."
                )
                blocked = {**land_sea, "message": message, "blocked": True}
                _emit("land_blocked", blocked)
                return {"success": False, "blocked": True, "error": message}

            downstream_crew = _build_crew(
                user_query,
                planner_report=json.dumps(planner_payload, indent=2),
            )
            result = downstream_crew.kickoff(inputs={"user_query": user_query})
            verdict = getattr(result, "raw", None) or str(result)
            _emit("judge", {"verdict": verdict})
            return {"success": True, "verdict": verdict}
        except Exception as exc:
            _emit("error", {"message": str(exc)})
            return {"success": False, "error": str(exc)}
        finally:
            _current_on_event = None
