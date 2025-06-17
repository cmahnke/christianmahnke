import requests
import json

def get_unique_wikidata_urls(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error downloading or parsing the JSON file: {e}")
        return []
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}")
        return []

    wikidata_links = []

    for page in data["pages"]:
        if isinstance(page, dict):
            for key, value in page.items():
                if key == "wikidata" and isinstance(value, list):
                    wikidata_links.extend(value)

    return list(set(wikidata_links))

if __name__ == "__main__":
    unique_urls = get_unique_wikidata_urls("https://christianmahnke.de/meta/wikidata/index.json")
    if unique_urls:
        for url in unique_urls:
            print(url.split("/")[-1])
            #print(url)
    else:
        print("No unique URLs found or an error occurred.")