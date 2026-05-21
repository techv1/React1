import cloudscraper
import re

scraper = cloudscraper.create_scraper()
response = scraper.get("https://www.omg.xxx/")
ids = re.findall(r'/videos/([0-9]+)/', response.text)
print(list(set(ids))[:5])
