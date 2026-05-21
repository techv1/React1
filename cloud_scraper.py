import cloudscraper
import re
import json

url = "https://www.omg.xxx/videos/93745616/kendra-lynn-gives-her-boyfriend-a-birthday-threesome-with-jojo-kiss/"
scraper = cloudscraper.create_scraper()

try:
    print(f"Fetching: {url}")
    response = scraper.get(url)
    print(f"Status Code: {response.status_code}")
    
    # Save the page for manual inspection if needed
    with open("video_page.html", "w") as f:
        f.write(response.text)
    
    # Search for common KVS variables
    # Look for flashvars = { ... }
    flashvars_match = re.search(r'flashvars\s*=\s*({.*?});', response.text, re.DOTALL)
    if flashvars_match:
        print("Found flashvars in HTML!")
        print(flashvars_match.group(1))
    
    # Look for any JSON-like structures containing video_url or get_file
    get_file_match = re.search(r'["\']?video_url["\']?\s*:\s*["\']([^"\']+)["\']', response.text)
    if get_file_match:
        print(f"Found video_url in HTML: {get_file_match.group(1)}")

    # Try to fetch the player config directly
    config_url = f"https://www.omg.xxx/contents/videos/player_config.php?video_id=93745616"
    print(f"Fetching Config: {config_url}")
    config_response = scraper.get(config_url, headers={"Referer": url})
    
    if config_response.status_code == 200:
        print("Successfully fetched player_config.php")
        with open("player_config.xml", "w") as f:
            f.write(config_response.text)
        print(config_response.text[:1000]) # Print first 1000 chars
    else:
        print(f"Failed to fetch config. Status: {config_response.status_code}")

except Exception as e:
    print(f"Error: {e}")
