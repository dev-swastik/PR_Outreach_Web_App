from playwright.sync_api import sync_playwright

def scrape_teachers():
    teachers = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Go directly to the staff directory
        page.goto(
            "https://www.abseconschools.org/district/staff-directory",
            timeout=60000
        )

        # Give JS time to render
        page.wait_for_timeout(5000)

        # Grab all mailto links
        email_links = page.query_selector_all("a[href^='mailto:']")

        for link in email_links:
            email = link.get_attribute("href").replace("mailto:", "").strip()
            teachers.append({"email": email})

        browser.close()

    return teachers


if __name__ == "__main__":
    teacher_list = scrape_teachers()
    for t in teacher_list:
        print(t)

    print(f"\nTotal teachers found: {len(teacher_list)}")
