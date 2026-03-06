import instaloader
import csv
import time
import re
import os

# -------------------------------------------------------------------
# ZAVVY INSTAGRAM LEAD SCRAPER
# -------------------------------------------------------------------
# Strategy: Scrape followers of competitors (Stan Store, Gumroad, etc.)
# Filter: Only save users who have an email in their bio OR an external url
# (like Linktree, Beacons) as they are prime candidates for Zavvy.
# -------------------------------------------------------------------

def extract_emails(text):
    """Extracts emails from a given text using regex."""
    if not text:
        return []
    # Simple regex for email extraction
    emails = re.findall(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', text)
    return list(set(emails)) # Return unique emails

def init_instaloader():
    """Initializes and returns an Instaloader instance."""
    L = instaloader.Instaloader(
        sleep=True,
        quiet=False,
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
    return L

def scrape_leads(L, target_account, max_leads=50):
    """Scrapes qualified leads from a target account's followers."""
    print(f"\n[{target_account}] Fetching profile...")
    try:
        profile = instaloader.Profile.from_username(L.context, target_account)
    except Exception as e:
        print(f"[{target_account}] Error fetching profile: {e}")
        return []

    leads = []
    count = 0
    scanned = 0
    
    print(f"[{target_account}] Starting to scan followers for qualified leads...")
    
    try:
        # Note: get_followers() requires you to be logged in!
        for follower in profile.get_followers():
            scanned += 1
            if count >= max_leads:
                print(f"[{target_account}] Reached target limit of {max_leads} leads.")
                break
                
            # Extract qualification data
            emails = extract_emails(follower.biography)
            external_url = follower.external_url
            
            # QUALIFICATION LOGIC FOR ZAVVY
            # We want creators. Creators usually have an email for business inquiries
            # or an external link (linktree, stan.store, website) in their bio.
            if emails or external_url:
                lead_data = {
                    'username': follower.username,
                    'full_name': follower.full_name,
                    'followers': follower.followers,
                    'following': follower.followees,
                    'is_business_account': follower.is_business_account,
                    'category': follower.business_category_name or "N/A",
                    'emails': ", ".join(emails),
                    'external_url': external_url or "N/A",
                    'biography': follower.biography.replace('\n', ' ') if follower.biography else ""
                }
                leads.append(lead_data)
                count += 1
                
                print(f"  [+] Found Lead #{count}: {follower.username} (Email: {'Yes' if emails else 'No'}, Link: {'Yes' if external_url else 'No'})")
            
            # Sleep to strictly avoid rate limiting (Instagram is very aggressive)
            # 2-3 seconds between profile checks, plus Instaloader's built-in limits
            time.sleep(2)
            
            if scanned % 50 == 0:
                print(f"[{target_account}] Scanned {scanned} users so far... found {count} leads. Resting for 10s.")
                time.sleep(10)
                
    except instaloader.exceptions.LoginRequiredException:
        print("\n[ERROR] Scraping followers requires you to be logged in!")
        print("Please set your burner account credentials in the script.")
    except Exception as e:
        print(f"\n[ERROR] An unexpected error occurred: {e}")
        
    return leads

def save_to_csv(leads, filename="zavvy_leads.csv"):
    """Saves the extracted leads to a CSV file."""
    if not leads:
        print("No leads to save.")
        return
        
    keys = leads[0].keys()
    file_exists = os.path.isfile(filename)
    
    with open(filename, 'a' if file_exists else 'w', newline='', encoding='utf-8') as output_file:
        dict_writer = csv.DictWriter(output_file, fieldnames=keys)
        if not file_exists:
            dict_writer.writeheader()
        dict_writer.writerows(leads)
        
    print(f"\n[SUCCESS] Saved {len(leads)} leads to {filename}")

if __name__ == "__main__":
    print("========================================")
    print(" Zavvy Lead Scraper (Instaloader)")
    print("========================================")
    print("WARNING: Do NOT use your main Zavvy account.")
    print("Instagram will likely ban the account used to run this script.")
    print("========================================\n")
    
    L = init_instaloader()
    
    # IMPORTANT: You MUST login to scrape followers. 
    # Replace with your BURNER ACCOUNT credentials.
    USERNAME = "lion.4783647"
    PASSWORD = "tharagesh17"
    
    try:
        L.login(USERNAME, PASSWORD)
        print(f"Logged in successfully as {USERNAME}")
        
        # Who are Zavvy's competitors or tangential platforms?
        # People following these accounts are highly likely to be digital creators.
        targets = [
            "stan.store", 
            "gumroad", 
            "linktr.ee",
            "nas.io"
        ]
        
        all_leads = []
        for target in targets:
            # Look for 20 highly qualified leads per competitor to start safely
            leads = scrape_leads(L, target, max_leads=20)
            if leads:
                all_leads.extend(leads)
                save_to_csv(leads, "zavvy_qualified_leads.csv")
                
            print("\nResting 30 seconds before next target...")
            time.sleep(30)
            
    except Exception as e:
        print(f"Login or general error occurred: {e}")
