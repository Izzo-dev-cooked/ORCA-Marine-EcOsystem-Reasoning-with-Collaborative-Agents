import os


print("API key loaded" if os.environ.get("FAST2SMS_API_KEY") else "API key missing")