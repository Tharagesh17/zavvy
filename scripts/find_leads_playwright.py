import asyncio
import pandas as pd
from playwright.async_api import async_playwright, TimeoutError as PWTimeout

async def run(playwright):
    browser = await playwright.chromium.launch(headless=False, slow_mo=200)
    context = await browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        viewport={"width": 1280, "height": 720},
        locale="en-IN"
    )
    page = await context.new_page()

    print("Navigating to Instagram login page...")
    await page.goto("https://www.instagram.com/accounts/login/", wait_until="domcontentloaded")
    await asyncio.sleep(3)

    # Handle cookie consent banner if present
    try:
        await page.click("text=Allow all cookies", timeout=4000)
        print("Dismissed cookie banner.")
        await asyncio.sleep(2)
    except:
        pass

    # Fill in credentials if the login form is still visible
    try:
        await page.wait_for_selector("input[name='username']", timeout=8000)
        print("Filling in credentials...")
        await page.fill("input[name='username']", "zavvy_2026")
        await asyncio.sleep(1)
        await page.fill("input[name='password']", "tharagesh17")
        await asyncio.sleep(1)
        await page.click("button[type='submit']")
        print("Submitted login form.")
    except PWTimeout:
        # Already logged in or redirected — check current URL
        print(f"Login form not found. Current URL: {page.url}")

    # Wait until we land on the home feed or the onetap page
    print("Waiting for successful login (up to 30s)...")
    try:
        await page.wait_for_url("https://www.instagram.com/**", timeout=30000)
        print(f"Now at: {page.url}")
    except:
        pass

    # Dismiss any post-login popups
    for dismiss_text in ["Not Now", "Not now", "Skip"]:
        try:
            await page.click(f"text={dismiss_text}", timeout=3000)
            await asyncio.sleep(1)
        except:
            pass

    print("Login complete!")

    # Navigate to hashtag page
    query = "chennaiclothing"
    print(f"\nNavigating to hashtag: #{query}")
    await page.goto(f"https://www.instagram.com/explore/tags/{query}/", wait_until="domcontentloaded")
    await asyncio.sleep(5)

    # Collect post links
    print("Collecting post links from hashtag page...")
    post_links_raw = await page.locator("a[href^='/p/']").all_hrefs()
    unique_links = list(set(post_links_raw))[:20]
    print(f"Found {len(unique_links)} posts to scan.")

    leads = []
    seen_users = set()

    for link in unique_links:
        full_link = f"https://www.instagram.com{link}" if link.startswith('/') else link
        print(f"\nChecking post: {full_link}")
        await page.goto(full_link, wait_until="domcontentloaded")
        await asyncio.sleep(3)

        try:
            # Get author username
            author_el = await page.wait_for_selector("article header a", timeout=5000)
            author_href = await author_el.get_attribute("href")
            username = author_href.strip("/")

            if not username or username in seen_users:
                continue
            seen_users.add(username)

            print(f"  -> Profile: @{username}")

            # Visit profile
            await page.goto(f"https://www.instagram.com/{username}/", wait_until="domcontentloaded")
            await asyncio.sleep(3)

            # Follower count
            followers = 0
            try:
                f_el = await page.query_selector("a[href$='/followers/'] span")
                if f_el:
                    raw = await f_el.get_attribute("title") or await f_el.inner_text()
                    raw = raw.replace(",", "").strip()
                    if 'k' in raw.lower():
                        followers = int(float(raw.lower().replace('k', '')) * 1000)
                    elif 'm' in raw.lower():
                        followers = int(float(raw.lower().replace('m', '')) * 1_000_000)
                    else:
                        followers = int(raw)
            except:
                pass

            # Bio text
            bio = ""
            try:
                bio_el = await page.query_selector("header section span")
                if bio_el:
                    bio = await bio_el.inner_text()
            except:
                pass

            print(f"     Followers={followers} | Bio='{bio[:60]}'")

            is_store = any(kw in bio.lower() for kw in [
                "dm for", "dm to order", "price", "order",
                "clothing", "boutique", "fashion", "store", "shop", "collection"
            ])

            if 100 <= followers <= 10000 and is_store:
                print(f"  [+] LEAD! @{username} ({followers} followers)")
                leads.append({
                    "handle": username,
                    "followers": followers,
                    "bio": bio,
                    "profile_url": f"https://www.instagram.com/{username}/"
                })

        except Exception as e:
            print(f"  [!] Error on post: {e}")

        await asyncio.sleep(2)

    print(f"\n✅ Done. Found {len(leads)} leads.")
    if leads:
        df = pd.DataFrame(leads)
        df.to_csv("playwright_leads.csv", index=False)
        print("Saved to playwright_leads.csv")
        print(df.to_string(index=False))

    input("\nPress ENTER to close the browser...")
    await browser.close()

async def main():
    async with async_playwright() as playwright:
        await run(playwright)

if __name__ == "__main__":
    asyncio.run(main())
