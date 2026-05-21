import requests
import re
import json

url = "https://www.omg.xxx/videos/93722598/newsensations-schoolgirl-bound-5-devon-begins-her-first-lesson/"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.google.com/",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1"
}

try:
    response = requests.get(url, headers=headers, timeout=10)
    print(f"Status Code: {response.status_code}")
    with open("page_content.html", "w") as f:
        f.write(response.text)
    
    # Look for flashvars or player config
    flashvars = re.search(r'flashvars\s*=\s*({.*?});', response.text, re.DOTALL)
    if flashvars:
        print("Found flashvars:")
        print(flashvars.group(1))
    else:
        # Look for script tags with video info
        scripts = re.findall(r'<script.*?> (.*?)</script>', response.text, re.DOTALL)
        for i, script in enumerate(scripts):
            if "get_file" in script or "license_code" in script or "video_url" in script:
                print(f"Found interesting script {i}:")
                print(script[:500] + "...")

except Exception as e:
    print(f"Error: {e}")
