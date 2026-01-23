import sys
import feedparser
import json
from urllib.parse import quote
import re
from collections import defaultdict

def parse_name(full_name):
    """Parse full name into first and last name"""
    if not full_name or "Editorial" in full_name or "Team" in full_name:
        return "", ""

    parts = full_name.strip().split()
    if len(parts) == 0:
        return "", ""
    elif len(parts) == 1:
        return parts[0], ""
    else:
        return parts[0], " ".join(parts[1:])

def extract_topics(title, summary=""):
    """Extract topics from article title and summary"""
    topics = set()

    # Common tech/AI topics to look for
    topic_keywords = [
        "artificial intelligence", "AI", "machine learning", "ML",
        "education", "edtech", "teaching", "learning",
        "technology", "tech", "innovation", "startup",
        "data science", "analytics", "automation",
        "ChatGPT", "GPT", "LLM", "generative AI",
        "digital transformation", "cloud computing"
    ]

    text = (title + " " + summary).lower()

    for keyword in topic_keywords:
        if keyword.lower() in text:
            topics.add(keyword.title())

    return list(topics)

def get_publication_location(publication):
    """Map publication to likely location (demo data)"""
    # In production, this would query a database or API
    location_map = {
        "TechCrunch": {"city": "San Francisco", "state": "CA", "country": "USA"},
        "The Verge": {"city": "New York", "state": "NY", "country": "USA"},
        "Wired": {"city": "San Francisco", "state": "CA", "country": "USA"},
        "EdTech Magazine": {"city": "Chicago", "state": "IL", "country": "USA"},
        "VentureBeat": {"city": "San Francisco", "state": "CA", "country": "USA"},
        "MIT Technology Review": {"city": "Cambridge", "state": "MA", "country": "USA"},
        "Ars Technica": {"city": "New York", "state": "NY", "country": "USA"}
    }

    return location_map.get(publication, {
        "city": "New York",
        "state": "NY",
        "country": "USA"
    })

# Get topic from command line
topic = sys.argv[1] if len(sys.argv) > 1 else "technology"
encoded_topic = quote(topic)

# Fetch RSS feed
rss_url = f"https://news.google.com/rss/search?q={encoded_topic}"
feed = feedparser.parse(rss_url)

# Group articles by author email to consolidate journalist data
journalists_data = defaultdict(lambda: {
    "first_name": "",
    "last_name": "",
    "email": "",
    "city": "",
    "state": "",
    "country": "",
    "publication_name": "",
    "topics": set(),
    "recent_articles": []
})

# Process feed entries
for entry in feed.entries[:20]:  # Increased to 20 for better coverage
    publication = entry.get("source", {}).get("title", "news")
    author = entry.get("author") or f"{publication} Editorial Team"

    # Skip if it's an editorial team
    if "Editorial" in author or "Team" in author:
        continue

    # Parse name
    first_name, last_name = parse_name(author)

    # Generate email (demo format)
    safe_domain = re.sub(r"[^a-zA-Z0-9]", "", publication).lower()
    if first_name and last_name:
        email = f"{first_name.lower()}.{last_name.lower()}@{safe_domain}.com"
    else:
        email = f"editor@{safe_domain}.com"

    # Get location
    location = get_publication_location(publication)

    # Extract topics
    article_title = entry.get("title", "Untitled Article")
    article_summary = entry.get("summary", "")
    topics = extract_topics(article_title, article_summary)

    # Update journalist data
    journalist = journalists_data[email]
    journalist["first_name"] = first_name
    journalist["last_name"] = last_name
    journalist["email"] = email
    journalist["city"] = location["city"]
    journalist["state"] = location["state"]
    journalist["country"] = location["country"]
    journalist["publication_name"] = publication
    journalist["topics"].update(topics)
    journalist["recent_articles"].append({
        "title": article_title,
        "url": entry.get("link", ""),
        "published": entry.get("published", "")
    })

# Convert to list and format for output
results = []
for email, data in journalists_data.items():
    results.append({
        "first_name": data["first_name"],
        "last_name": data["last_name"],
        "email": data["email"],
        "city": data["city"],
        "state": data["state"],
        "country": data["country"],
        "publication_name": data["publication_name"],
        "topics": list(data["topics"]),
        "recent_articles": data["recent_articles"][:5]  # Limit to 5 most recent
    })

print(json.dumps(results))


"""
PRODUCTION NOTE: Real Journalist Email Discovery :== Disabled for Demo

In a production system, journalist emails could be discovered using the
following steps. This logic is intentionally commented out to avoid
scraping private contact information during demos.

Steps:
1. Visit the article URL
2. Parse the HTML page
3. Locate author profile link
4. Visit author profile page
5. Extract email from:
   - mailto: links
   - contact sections
   - author bio blocks
"""

# import requests
# from bs4 import BeautifulSoup
#
# article_url = entry.get("link")
# response = requests.get(article_url, timeout=10)
# soup = BeautifulSoup(response.text, "html.parser")
#
# # Example patterns commonly used by publishers:
# # <a href="mailto:author@publication.com">
# mailto = soup.select_one("a[href^='mailto:']")
#
# if mailto:
#     email = mailto["href"].replace("mailto:", "")
#
# else:
#     # Fallback: Visit author profile page
#     author_link = soup.select_one("a.author, a.byline")
#     if author_link:
#         profile_url = author_link["href"]
#         profile_page = requests.get(profile_url)
#         profile_soup = BeautifulSoup(profile_page.text, "html.parser")
#
#         email_element = profile_soup.find(text=lambda t: "@" in t)
#         email = email_element if email_element else None
#
# # Final fallback: domain-based guessing + verification
# # email = f"{first_name}.{last_name}@publication.com"
