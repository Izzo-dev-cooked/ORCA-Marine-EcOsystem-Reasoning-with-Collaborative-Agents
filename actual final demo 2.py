"""
Standalone CLI entry point for the marine mission pipeline.

The actual Planner -> Weather/Geospatial -> Judge CrewAI pipeline now lives in
`mission_agent.py` so the Flask UI (ui.py) can reuse it per-request and react
live to each agent's output. This script just runs it once from the terminal.
"""
from mission_agent import run_mission

if __name__ == "__main__":
    user_query = "I am planning on heading out to 30 km from these coordinates into the sea:14.7110° N, 74.2640° E "
    outcome = run_mission(user_query)
    if outcome.get("success"):
        print(outcome["verdict"])
    else:
        print(f"Mission failed: {outcome.get('error')}")
