import requests

url = "https://www.omg.xxx/videos/93722598/newsensations-schoolgirl-bound-5-devon-begins-her-first-lesson/"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Referer": "https://www.google.com/",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "cross-site",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1"
}

try:
    session = requests.Session()
    # Try to get cookies first from the root
    session.get("https://www.omg.xxx/", headers=headers, timeout=10)
    
    # Now try the video page
    headers["Referer"] = "https://www.omg.xxx/"
    headers["Sec-Fetch-Site"] = "same-origin"
    response = session.get(url, headers=headers, timeout=10)
    
    print(f"Status: {response.status_code}")
    print(f"Cookies: {session.cookies.get_dict()}")
    
    if "Just a moment..." in response.text:
        print("Blocked by Cloudflare Challenge")
    else:
        print("Success! Page length:", len(response.text))
        # Look for the video player info
        if "get_file" in response.text:
            print("Found 'get_file' in response!")
            # Print around where get_file is
            index = response.text.find("get_file")
            print(response.text[index-100:index+500])
        else:
            print("Could not find 'get_file' in source.")
            # Search for any script tags
            import re
            scripts = re.findall(r'<script.*?>.*?</script>', response.text, re.DOTALL)
            print(f"Found {len(scripts)} scripts.")

except Exception as e:
    print(f"Error: {e}")
