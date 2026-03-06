import instaloader
import pandas as pd
import time

def find_leads_by_search(query="chennai clothing store", max_profiles=50, min_followers=100, max_followers=5000):
    """
    Finds potential leads bypassing the hashtag search by using Instagram's Top Search feature instead.
    """
    L = instaloader.Instaloader()
    
    try:
        print("Attempting to login to Instagram with provided credentials...")
        L.login("zavvy_2026", "tharagesh17")
        print("Logged in successfully.")
    except Exception as e:
        print(f"Login failed: {e}")
        print("Continuing without login. You might hit rate limits sooner.")

    print(f"Searching for profiles using Top Search query: '{query}'...")
    profiles_data = []

    try:
        # Instead of hashtag blocks, use general Top Search:
        search_results = instaloader.TopSearchResults(L.context, query)
        
        count = 0
        for profile in search_results.get_profiles():
            if count >= max_profiles:
                break
                
            username = profile.username
            count += 1
            print(f"Checking profile {count}/{max_profiles}: {username}...")
            
            try:
                followers = profile.followers
                bio = profile.biography if profile.biography else ""
                full_name = profile.full_name if profile.full_name else ""
                
                # Check for store indicating keywords in their bio/name
                is_store_like = ("dm for" in bio.lower() or 
                                 "clothing" in bio.lower() or 
                                 "clothing" in full_name.lower() or 
                                 "store" in bio.lower() or 
                                 "price" in bio.lower() or
                                 "boutique" in bio.lower() or
                                 "wardrobe" in bio.lower() or
                                 "fashion" in bio.lower())
                
                if (min_followers <= followers <= max_followers) and is_store_like:
                    print(f"  [+] Found match! @{username} ({followers} followers)")
                    
                    profiles_data.append({
                        'handle': username,
                        'name': full_name,
                        'followers': followers,
                        'bio': bio,
                        'url': f"https://www.instagram.com/{username}/"
                    })
            except instaloader.exceptions.ConnectionException:
                print("  [!] Connection/Rate limit error. Pausing for 15 seconds...")
                time.sleep(15)
            except Exception as e:
                 print(f"  [!] Error reading profile {username}: {e}")
            
            # Rate limit backoff
            time.sleep(2)  

    except Exception as e:
        print(f"An unexpected error occurred during search: {e}")

    print(f"\nScan complete. Scanned {count} profiles out of {max_profiles} limit.")
    print(f"Found {len(profiles_data)} potential leads matching criteria.")

    if profiles_data:
        df = pd.DataFrame(profiles_data)
        filename = f'leads_{query.replace(" ", "_").lower()}.csv'
        df.to_csv(filename, index=False)
        print(f"Exported leads to {filename}")
        return df
    else:
        print("No leads found to export.")
        return None

if __name__ == "__main__":
    # Perform general keyword search instead of literal hashtags
    # Keywords that might be in usernames / profile names
    query_str = "chennai clothing" 
    df_leads = find_leads_by_search(
        query=query_str, 
        max_profiles=50,      # Look through top 50 search results
        min_followers=100,
        max_followers=5000
    )
    
    if df_leads is not None:
         print("\nSample of results:")
         print(df_leads.head())
