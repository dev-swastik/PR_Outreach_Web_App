from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import os
import requests
from dotenv import load_dotenv

load_dotenv()
HUNTER_API_KEY = os.getenv("HUNTER_API_KEY")
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def find_email_with_hunter(first_name, last_name, domain):
    if not HUNTER_API_KEY:
        return None, 0, "missing_api_key"

    url = "https://api.hunter.io/v2/email-finder"
    params = {
        "first_name": first_name,
        "last_name": last_name,
        "domain": domain,
        "api_key": HUNTER_API_KEY
    }

    try:
        res = requests.get(url, params=params, timeout=10)
        data = res.json()

        if data.get("data") and data["data"].get("email"):
            return (
                data["data"]["email"],
                data["data"].get("confidence", 0),
                "hunter"
            )

    except Exception as e:
        print("Hunter error:", e)

    return None, 0, "not_found"


@app.get("/scrape")
def scrape_journalists(topic: str = Query(...)):

    # TEMP: replace with RSS scraping later
    first_name = "Jane"
    last_name = "Doe"
    publication = "Tech Weekly"
    domain = "techweekly.com"

    email, confidence, source = find_email_with_hunter(
        first_name, last_name, domain
    )

    journalist = {
        "first_name": first_name,
        "last_name": last_name,
        "email": email or f"editor@{domain}",
        "email_confidence": confidence,
        "email_source": source,
        "publication_name": publication,
        "recent_articles": [
            {
                "title": f"{topic} trends in 2024",
                "url": "https://example.com/article"
            }
        ]
    }

    return [journalist]
