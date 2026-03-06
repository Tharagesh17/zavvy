import instaloader
import pandas as pd
import time
import getpass

def find_leads(query="Chennai clothing", max_posts_to_scan=100, min_followers=100, max_followers=5000):
    """
    Finds potential leads on Instagram based on a hashtag query and filtering criteria.
    """
    L = instaloader.Instaloader()
    
    try:
        print("Attempting to login to Instagram with provided credentials...")
        L.login("zavvy_2026", "tharagesh17")
        print("Logged in successfully.")
    except Exception as e:
        print(f"Login failed: {e}")
        print("Continuing without login. You might hit rate limits sooner.")

    print(f"Searching for leads using query: '{query}'...")
    profiles = []
    seen_usernames = set()
    posts_scanned = 0

    try:
        search_tag = query.replace(" ", "").replace("#", "")
        print(f"Specifically looking at hashtag: #{search_tag}")
        
        post_iterator = L.get_hashtag_posts(search_tag)
        

        for post in post_iterator:
            if posts_scanned >= max_posts_to_scan:
                break
                
            posts_scanned += 1
            print(f"Scanning post {posts_scanned}/{max_posts_to_scan}...")

            owner = post.owner_profile
            username = owner.username

            if username in seen_usernames:
                continue

            seen_usernames.add(username)
            
            # Rate limit backoff (crucial for scraping without getting blocked)
            time.sleep(1) # wait 1 second between processing profiles

            try:
                # The owner object from the post might not have all details loaded.
                # We need to explicitly load the profile to get follower counts reliably,
                # though this uses more API requests.
                profile = instaloader.Profile.from_username(L.context, username)
                followers_count = profile.followers
                
                caption = post.caption if post.caption else ""
                bio = profile.biography if profile.biography else ""
                
                # Filtering logic
                is_store_like = "dm for" in caption.lower() or "price" in caption.lower() or "order" in caption.lower() or "dm to order" in bio.lower()
                
                if (min_followers <= followers_count <= max_followers) and is_store_like:
                    print(f"  [+] Found match! {username} ({followers_count} followers)")
                    
                    location_name = "Unknown"
                    if post.location:
                         location_name = post.location.name

                    profiles.append({
                        'handle': username,
                        'followers': followers_count,
                        'bio': bio,
                        'location': location_name,
                        'post_url': f"https://www.instagram.com/p/{post.shortcode}/"
                    })
                    
            except instaloader.exceptions.ProfileNotExistsException:
                print(f"  [-] Profile {username} not found or accessible.")
            except instaloader.exceptions.ConnectionException:
                print("  [!] Connection/Rate limit error. Pausing for 30 seconds...")
                time.sleep(30)
            except Exception as e:
                print(f"  [!] Error processing {username}: {e}")

    except instaloader.exceptions.QueryReturnedBadRequestException:
         print(f"Error: Instagram rejected the hashtag query '#{search_tag}'. It might be banned or restricted.")
    except Exception as e:
        print(f"An unexpected error occurred during search: {e}")

    print(f"\nScan complete. Scanned {posts_scanned} posts.")
    print(f"Found {len(profiles)} potential leads matching criteria.")

    if profiles:
        df = pd.DataFrame(profiles)
        filename = f'leads_{query.replace(" ", "_").lower()}.csv'
        df.to_csv(filename, index=False)
        print(f"Exported leads to {filename}")
        return df
    else:
        print("No leads found to export.")
        return None

if __name__ == "__main__":
    # Example usage:
    # Adjust parameters based on what you consider a "lead"
    query_str = "chennaiclothing" # Use hashtags without spaces
    df_leads = find_leads(
        query=query_str, 
        max_posts_to_scan=100,  # Keep this low initially to test without getting IP banned
        min_followers=100,      # Don't target completely dead accounts
        max_followers=5000      # Target small accounts (micro-influencers/small stores)
    )
    
    if df_leads is not None:
        print(df_leads.head())
