import cloudscraper
import re

vids = ['93745616', '93722598'] # User's two examples
scraper = cloudscraper.create_scraper()

for vid in vids:
    url = f"https://www.omg.xxx/videos/{vid}/"
    response = scraper.get(url)
    # Search for any get_file URL
    matches = re.findall(r'https?://www\.omg\.xxx/get_file/8512/([0-9a-f]{40})/[^/]+/([^/]+)/([^/]+)/', response.text)
    for hash_val, dir_id, filename in matches:
        print(f"ID: {vid} | Filename: {filename} | Hash: {hash_val}")
