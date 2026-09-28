# ORCA - Marine Ecosystem Intelligence Platform UI

A Flask-based web application for marine intelligence and decision support.

## Project Structure

```
d:\XboxGames\
├── ui.py                 # Flask backend application
├── templates/
│   └── index.html       # Main HTML interface
├── static/
│   ├── style.css        # Styling
│   └── script.js        # JavaScript interactivity
└── output/              # Build/output directory
```

## Installation & Setup

### 1. Install Flask
```bash
pip install flask
```

### 2. Run the Application
```bash
cd d:\XboxGames
python ui.py
```

The application will start at `http://localhost:5000`

## Features

### Chat Interface (Left Panel)
- Conversational AI for marine queries
- Real-time responses about fishing zones, weather, and safety
- Suggested query buttons for quick access
- Support for natural language questions

### Geospatial Intelligence (Center Panel)
- Interactive map with Leaflet.js
- Fishing zone markers with data
- Alert zones visualization (cyclone, lightning, high waves)
- Map updates based on user queries

### Data Dashboard (Right Panel)
- **Live Marine Data**: SST, Wind Speed, Wave Height, Tide Status
- **Active Alerts**: Real-time warnings with severity levels
- **Potential Fishing Zones**: Chlorophyll concentration and conditions
- **Status Indicators**: Visual feedback on zone suitability

## Sample Queries to Try

- "Where is the nearest fishing zone today?"
- "Is it safe to venture into the sea tomorrow?"
- "What are the tide and weather conditions?"
- "Show me active alerts"
- "Which regions have high fish productivity?"

## Key Components

### Backend (ui.py)
- `GET /` - Serves main interface
- `GET /api/marine-data` - Fetches marine data
- `POST /api/chat` - Processes user queries
- `GET /api/alerts` - Retrieves active alerts

### Frontend Features
- Real-time data updates
- Interactive map with multiple layers
- Responsive chat interface
- Dynamic data cards
- Alert notifications system

## Technologies Used

- **Backend**: Flask (Python)
- **Frontend**: HTML5, CSS3, JavaScript
- **Mapping**: Leaflet.js
- **Base Maps**: OpenStreetMap

## Real-Time Data

The dashboard simulates real-time data updates for:
- Sea Surface Temperature
- Wind Speed
- Wave Height
- Alert status

## Future Enhancements

- Integration with actual satellite data APIs (ISRO, NOAA)
- Multi-language support for Indian regional languages
- Advanced geofencing
- Route optimization algorithms
- Machine learning for predictive analytics
- User authentication and preferences
- Export reports functionality

## Notes

- The application runs on `http://localhost:5000`
- Sample data is hardcoded for demonstration
- Replace sample data with actual API integrations
- Map coordinates are centered on Indian coastal regions
