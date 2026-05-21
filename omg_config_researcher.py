import cloudscraper
import json

def fetch_config(video_id, referer_url):
    scraper = cloudscraper.create_scraper(
        browser={
            'browser': 'chrome',
            'platform': 'windows',
            'desktop': True
        }
    )
    
    # Common KVS player config URL
    config_url = f"https://www.omg.xxx/contents/videos/player_config.php?video_id={video_id}"
    
    headers = {
        "Referer": referer_url,
        "X-Requested-With": "XMLHttpRequest",
        "Accept": "*/*",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    print(f"[*] Fetching config from: {config_url}")
    print(f"[*] Using Referer: {referer_url}")
    
    try:
        # First, hit the main page to get cookies
        print("[*] Hitting main page to establish session...")
        scraper.get(referer_url)
        
        # Then hit the config URL
        response = scraper.get(config_url, headers=headers)
        
        print(f"[*] Status Code: {response.status_code}")
        if response.status_code == 200:
            print("[+] Success! Config content:")
            print(response.text[:2000])
            with open("player_config_detailed.xml", "w") as f:
                f.write(response.text)
        else:
            print(f"[!] Failed. Content: {response.text[:500]}")
            
    except Exception as e:
        print(f"[!] Error: {e}")

if __name__ == "__main__":
    v_id = "93745616"
    ref = f"https://www.omg.xxx/videos/{v_id}/kendra-lynn-gives-her-boyfriend-a-birthday-threesome-with-jojo-kiss/"
    fetch_config(v_id, ref)
