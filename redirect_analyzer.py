import cloudscraper

get_file_url = "https://www.omg.xxx/get_file/8512/b27addedeb075ba9ee524f53be615bc6514e5ea44c/93745000/93745616/93745616_480m.mp4/?embed=true"
scraper = cloudscraper.create_scraper()

try:
    print(f"Requesting: {get_file_url}")
    # Don't follow redirects to see the 302
    response = scraper.get(get_file_url, headers={"Referer": "https://www.omg.xxx/embed/93745616/"}, allow_redirects=False)
    
    print(f"Status Code: {response.status_code}")
    print("Headers:")
    for k, v in response.headers.items():
        print(f"  {k}: {v}")
    
    if response.status_code in [301, 302]:
        print(f"Redirect Location: {response.headers.get('Location')}")

except Exception as e:
    print(f"Error: {e}")
