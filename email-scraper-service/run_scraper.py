import feedparser
from collections import defaultdict
from publishers import PUBLISHERS
from urllib.parse import urlparse


def extract_author(entry, author_fields):
    for field in author_fields:
        value = entry.get(field)
        if value:
            return value.replace("By ", "").strip()
    return ""

def parse_name(full_name):
    """
    Parse a full name string into (first_name, last_name) tuples.
    Handles multiple authors separated by 'and', '&', or commas.
    Returns a list of (first_name, last_name) tuples.
    """
    if not full_name:
        return []

    bad_terms = ["Editorial", "Staff", "Team", "Newsroom"]
    if any(bad.lower() in full_name.lower() for bad in bad_terms):
        return []

    # Split by common delimiters for multiple authors
    # Handle patterns like: "John Doe and Jane Smith" or "A, B and C"
    import re

    # Replace various separators with a uniform delimiter
    normalized = full_name
    normalized = re.sub(r'\s+and\s+', '|', normalized, flags=re.IGNORECASE)
    normalized = re.sub(r'\s*&\s*', '|', normalized)

    # Split by the delimiter
    author_names = [name.strip() for name in normalized.split('|')]

    # Also handle comma-separated lists (but not commas within names)
    # This handles "Smith, Jones and Brown"
    expanded_names = []
    for name in author_names:
        # Check if this looks like "Last1, Last2, Last3" pattern
        if ',' in name:
            parts = [p.strip() for p in name.split(',')]
            # If all parts are single words (likely last names only), skip
            if all(len(p.split()) == 1 for p in parts):
                continue
            expanded_names.extend(parts)
        else:
            expanded_names.append(name)

    # Parse each individual name
    results = []
    for name in expanded_names:
        name = name.strip()
        if not name:
            continue

        parts = name.split()
        if len(parts) == 1:
            # Single name - use as first name only
            results.append((parts[0], ""))
        elif len(parts) >= 2:
            # Multiple parts - first is first_name, rest is last_name
            first = parts[0]
            last = " ".join(parts[1:])
            results.append((first, last))

    return results


def scrape_journalists_from_publishers(topic: str):
    journalists = defaultdict(lambda: {
        "first_name": "",
        "last_name": "",
        "publication_name": "",
        "domain": "",
        "topics": set(),
        "recent_articles": []
    })

    for pub in PUBLISHERS:
        feed = feedparser.parse(pub["rss"])

        for entry in feed.entries[:20]:
            author_raw = extract_author(entry, pub["author_fields"])
            parsed_authors = parse_name(author_raw)

            if not parsed_authors:
                continue

            # Create separate entries for each co-author
            for first_name, last_name in parsed_authors:
                if not first_name:
                    continue

                key = f"{first_name}-{last_name}-{pub['domain']}"

                journalist = journalists[key]
                journalist["first_name"] = first_name
                journalist["last_name"] = last_name
                journalist["publication_name"] = pub["name"]
                journalist["domain"] = pub["domain"]

                journalist["recent_articles"].append({
                    "title": entry.get("title", ""),
                    "url": entry.get("link", ""),
                    "published": entry.get("published", "")
                })

    return [
        {
            **j,
            "topics": list(j["topics"]),
            "recent_articles": j["recent_articles"][:5]
        }
        for j in journalists.values()
    ]
