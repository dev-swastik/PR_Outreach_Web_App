from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from run_scraper import scrape_journalists_from_publishers
import os
import requests
from dotenv import load_dotenv
from pathlib import Path

# Load .env from root directory
root_env = Path(__file__).parent.parent / ".env"
load_dotenv(root_env)

HUNTER_API_KEY = os.getenv("HUNTER_API_KEY")
print("=" * 50)
print("Email Scraper Service Starting...")
print(f"Environment file: {root_env}")
print(f"HUNTER_API_KEY loaded: {'Yes' if HUNTER_API_KEY else 'No'}")
print("=" * 50)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def find_email_with_hunter(first_name, last_name, domain):
    if not HUNTER_API_KEY:
        print(f"⚠️  HUNTER_API_KEY missing for {first_name} {last_name}")
        return None, 0, "missing_api_key"

    url = "https://api.hunter.io/v2/email-finder"
    params = {
        "first_name": first_name,
        "last_name": last_name,
        "domain": domain,
        "api_key": HUNTER_API_KEY
    }

    try:
        print(f"Searching Hunter for: {first_name} {last_name} @ {domain}")
        res = requests.get(url, params=params, timeout=10)
        data = res.json()

        if not res.ok:
            print(f"Hunter API error: {data}")
            return None, 0, "api_error"

        if data.get("data") and data["data"].get("email"):
            email = data["data"]["email"]
            score = data["data"].get("score", 0)
            print(f"✓ Found: {email} (confidence: {score})")
            return (email, score, "hunter")
        else:
            print(f"⚠️  No email found (API response: {data.get('errors', 'no data')})")
    except Exception as e:
        print(f"Hunter error for {first_name} {last_name}: {e}")

    return None, 0, "not_found"

@app.get("/scrape")
def scrape_journalists(topic: str = Query(...)):
    print(f"\n{'='*60}")
    print(f"Starting scrape for topic: {topic}")
    print(f"{'='*60}\n")

    journalists = scrape_journalists_from_publishers(topic)
    print(f"\nFound {len(journalists)} journalists from scraper\n")

    enriched = []
    MIN_CONFIDENCE = 70
    stats = {"verified": 0, "low_confidence": 0, "fallback": 0, "not_found": 0}

    for j in journalists:
        # Skip Hunter if no real author name
        if not j["first_name"] or not j["last_name"]:
            enriched.append({
                **j,
                "email": f"editor@{j['domain']}",
                "email_confidence": 0,
                "email_source": "fallback"
            })
            stats["fallback"] += 1
            continue

        email, confidence, source = find_email_with_hunter(
            j["first_name"],
            j["last_name"],
            j["domain"]
        )

        # Reject low-confidence emails
        if not email or confidence < MIN_CONFIDENCE:
            enriched.append({
                **j,
                "email": f"editor@{j['domain']}",
                "email_confidence": confidence,
                "email_source": "low_confidence"
            })
            if confidence == 0:
                stats["not_found"] += 1
            else:
                stats["low_confidence"] += 1
            continue

        enriched.append({
            **j,
            "email": email,
            "email_confidence": confidence,
            "email_source": source
        })
        stats["verified"] += 1

    print(f"\n{'='*60}")
    print(f"📊 Enrichment Summary:")
    print(f" Verified emails (>={MIN_CONFIDENCE}% confidence): {stats['verified']}")
    print(f" Low confidence emails: {stats['low_confidence']}")
    print(f" No email found: {stats['not_found']}")
    print(f" Fallback emails: {stats['fallback']}")
    print(f" Total journalists: {len(enriched)}")
    print(f"{'='*60}\n")

    return enriched
