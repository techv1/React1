import cloudscraper
import re

ids = ['93815081', '93815083', '93815098']
scraper = cloudscraper.create_scraper()

for vid in ids:
    url = f"https://www.omg.xxx/embed/{vid}/"
    try:
        response = scraper.get(url, headers={"Referer": "https://www.omg.xxx/"})
        flashvars_match = re.search(r'flashvars\s*=\s*({.*?});', response.text, re.DOTALL)
        if flashvars_match:
            fv = flashvars_match.group(1)
            license_match = re.search(r"license_code:\s*['\"]([^\"']+)['\"]", fv)
            video_url_match = re.search(r"video_url:\s*['\"]([^\"']+)['\"]", fv)
            print(f"ID: {vid}")
            print(f"  License: {license_match.group(1) if license_match else 'N/A'}")
            print(f"  URL: {video_url_match.group(1) if video_url_match else 'N/A'}")
    except Exception as e:
        print(f"Error for {vid}: {e}")
