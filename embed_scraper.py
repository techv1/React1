import cloudscraper
import re

url = "https://www.omg.xxx/embed/93745616/"
scraper = cloudscraper.create_scraper()

try:
    print(f"Fetching: {url}")
    response = scraper.get(url, headers={"Referer": "https://www.omg.xxx/"})
    print(f"Status Code: {response.status_code}")
    
    with open("embed_page.html", "w") as f:
        f.write(response.text)
    
    # Search for video_url or get_file
    get_file_matches = re.findall(r'https?://www\.omg\.xxx/get_file/[^"\']+', response.text)
    for match in get_file_matches:
        print(f"Found URL: {match}")

    # Look for flashvars
    flashvars_match = re.search(r'flashvars\s*=\s*({.*?});', response.text, re.DOTALL)
    if flashvars_match:
        print("Found flashvars:")
        print(flashvars_match.group(1))

except Exception as e:
    print(f"Error: {e}")
