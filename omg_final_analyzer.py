import cloudscraper
import re
import json

def extract_video_info(url):
    """
    Analyzes omg.xxx video page to extract gateway and CDN URLs.
    """
    scraper = cloudscraper.create_scraper()
    
    print(f"[*] Fetching page: {url}")
    response = scraper.get(url)
    
    if response.status_code != 200:
        print(f"[!] Failed to fetch page. Status: {response.status_code}")
        return

    # 1. Extract the Gateway URL (get_file)
    # These are usually in <source> tags or flashvars
    print("[*] Searching for Gateway URLs (/get_file/)...")
    
    # Extract from source tags
    sources = re.findall(r"<source src='([^']+)' type='video/mp4' label=\"([^\"]+)\"", response.text)
    
    if not sources:
        # Fallback to flashvars
        flashvars_match = re.search(r'flashvars\s*=\s*({.*?});', response.text, re.DOTALL)
        if flashvars_match:
            try:
                # Basic cleanup for JS object to JSON
                js_obj = flashvars_match.group(1)
                video_url = re.search(r"video_url:\s*['\"]([^\"']+)['\"]", js_obj).group(1)
                label = re.search(r"video_url_text:\s*['\"]([^\"']+)['\"]", js_obj).group(1)
                sources = [(video_url, label)]
            except:
                pass

    if not sources:
        print("[!] No video sources found.")
        return

    for gateway_url, label in sources:
        print(f"\n--- Quality: {label} ---")
        print(f"Gateway URL: {gateway_url}")
        
        # 2. Analyze the Hash
        # Pattern: /get_file/[SERVER]/[HASH]/[DIR]/[ID]/[FILE]
        parts = gateway_url.split('/')
        if len(parts) > 6:
            server_id = parts[4]
            sha1_hash = parts[5]
            file_id = parts[7]
            filename = parts[8]
            
            print(f"  Server ID: {server_id}")
            print(f"  SHA1 Hash: {sha1_hash}")
            print(f"  File ID:   {file_id}")
            print(f"  Filename:  {filename}")
            
            # 3. Follow Redirect to CDN
            print("  [*] Requesting CDN redirect...")
            try:
                # We must use allow_redirects=False to capture the signed CDN URL
                res = scraper.get(gateway_url, headers={"Referer": url}, allow_redirects=False)
                if res.status_code == 302:
                    cdn_url = res.headers.get('Location')
                    print(f"  CDN URL:   {cdn_url}")
                    
                    # Analyze CDN Token
                    if "key=" in cdn_url:
                        token = re.search(r'key=([^,]+)', cdn_url).group(1)
                        expiry = re.search(r'end=([^,]+)', cdn_url).group(1)
                        ip = re.search(r'ip=([^/]+)', cdn_url).group(1)
                        print(f"    - Token:  {token}")
                        print(f"    - Expiry: {expiry}")
                        print(f"    - IP:     {ip}")
                else:
                    print(f"  [!] No redirect. Status: {res.status_code}")
            except Exception as e:
                print(f"  [!] Error following redirect: {e}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        target = sys.argv[1]
    else:
        target = "https://www.omg.xxx/videos/93745616/kendra-lynn-gives-her-boyfriend-a-birthday-threesome-with-jojo-kiss/"
    extract_video_info(target)
