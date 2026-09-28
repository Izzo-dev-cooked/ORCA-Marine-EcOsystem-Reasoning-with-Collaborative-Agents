# ORCA - Setup

## Project Structure
```
Ui/
├── ui.py                 ← Flask backend (run this)
├── mission_agent.py      ← CrewAI mission pipeline used by ui.py
├── requirements.txt
├── templates/
│   └── index.html
└── static/
    ├── style.css
    └── script.js
```

## Flask backend is required

Earlier versions of this project could run as static files with no backend
(via Live Server or double-clicking `index.html`). That is **no longer true**:

- **AI Mission Mode** (the Planner → Weather → Fishery → Judge agent pipeline)
  runs Python/CrewAI code and can only work through the Flask server - it has
  no client-side fallback.
- **Map tiles** are served through a Flask proxy (`/api/tiles/...`) for proper
  identification/rate-limiting; without it the map falls back to a public
  mirror, so it still loads, but tiles will be slower/less reliable.

If you open `templates/index.html` directly (file://) or via Live Server,
Mission Mode will fail immediately with "Mission failed to start" because
those routes don't exist outside Flask.

## How to Run

1. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

2. Set the environment variables the mission pipeline needs:
   ```powershell
   $env:GROQ_API_KEY = "your-groq-api-key"
   # Optional, only needed for the Copernicus (chlorophyll/SST) tool:
   # $env:COPERNICUSMARINE_SERVICE_USERNAME = "..."
   # $env:COPERNICUSMARINE_SERVICE_PASSWORD = "..."
   ```

3. Run the server:
   ```powershell
   python ui.py
   ```

4. Open **http://localhost:5000** in your browser (not a Live Server URL,
   not a `file://` path).

### Optional: Fast2SMS outbound SMS

The Flask app exposes `POST /api/sms/send` for one-way SMS delivery. No ngrok,
localtunnel, webhook, or public URL is needed because ORCA sends the verdict
directly to Fast2SMS after the mission finishes.

Set these environment variables before starting Flask. Keep the API key out of
source control:

```powershell
$env:FAST2SMS_API_KEY = "your-fast2sms-api-key"
$env:FAST2SMS_NUMBER = "91+7694046949" # optional default recipient
$env:FAST2SMS_ROUTE = "q" # use "dlt" only with an approved DLT template
```

For a local no-network smoke test, use mock mode instead of a real API key:

```powershell
$env:FAST2SMS_MOCK = "true"
```

Mock mode only logs the SMS and never contacts Fast2SMS. Do not enable it in
production.

Start an outbound mission with:

```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/sms/send -Method Post `
  -ContentType "application/json" `
  -Body '{"query":"Head 30 km offshore from Goa today","number":"9876543210"}'
```

The endpoint returns `202` immediately. The same Planner -> Weather -> Fishery
-> Judge pipeline runs in the background, and the final verdict is sent to the
Indian number through Fast2SMS. A request `number` overrides
`FAST2SMS_NUMBER`.

For the DLT route, also configure the approved Fast2SMS sender ID and template
variables before restarting Flask:

```powershell
$env:FAST2SMS_ROUTE = "dlt"
$env:FAST2SMS_SENDER_ID = "YOUR_SENDER_ID"
$env:FAST2SMS_VARIABLES_VALUES = ""
```

The DLT route requires a matching approved template, so a free-form verdict may
be rejected by Fast2SMS. The default `q` route is intended for quick test
messages when the account permits it.

When a verdict is produced in the web chat, ORCA also sends that final verdict
automatically through `POST /api/sms/send-verdict` to `FAST2SMS_NUMBER`.

## Features

- Chat-based place lookup, search, and translated replies work with just
  `requests`/Flask - no CrewAI dependency required.
- **AI Mission Mode** (toggle button next to the chat input, or the "Run AI
  offshore mission" quick prompt) requires `crewai`, `geopy`, `xarray`, and
  `copernicusmarine` (see `requirements.txt`) plus a `GROQ_API_KEY`. If those
  aren't installed/set, the app still runs - Mission Mode returns a clear
  "Mission agents are unavailable on this server" message instead of crashing.

## Troubleshooting

- **"Mission failed to start. Please try again."** — the page can't reach
  the Flask backend at all. Make sure `python ui.py` is running and you're
  browsing `http://localhost:5000`, not a `file://` page or a different dev
  server/port.
- **"Mission agents are unavailable on this server: ..."** — Flask is
  running, but `mission_agent.py` failed to import (missing package or bad
  `GROQ_API_KEY`). Check the terminal running `ui.py` for the exact import
  error and install the missing package from `requirements.txt`.
