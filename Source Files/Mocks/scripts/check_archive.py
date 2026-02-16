import argparse
import requests
import tomllib
from pathlib import Path

def get_snapshot(url, timestamp):
    api_url = "http://archive.org/wayback/available"
    params = {"url": url, "timestamp": timestamp}
    try:
        response = requests.get(api_url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        snapshot = data.get("archived_snapshots", {}).get("closest")
        if snapshot and snapshot.get("available"):
            return {"url": snapshot['url'], "timestamp": snapshot['timestamp']}
    except requests.exceptions.RequestException:
        pass
    return None


def get_hugo_url_list(config_path, sub_dir="post", pattern="*.html"):
    conf_file = Path(config_path).resolve()
    if not conf_file.exists():
        print(f"Error: Config {config_path} not found.")
        return []

    project_root = conf_file.parent

    try:
        with open(conf_file, "rb") as f:
            config = tomllib.load(f)
            base_url = config.get("baseURL", "").rstrip("/")
            raw_publish_dir = config.get("publishDir", "public")
            publish_dir = (project_root / raw_publish_dir).resolve()
    except Exception as e:
        print(f"Error parsing TOML: {e}")
        return []

    if not base_url:
        print("Error: baseURL not found in config.")
        return []

    search_path = publish_dir / sub_dir
    if not search_path.exists():
        print(f"Warning: Subdirectory '{search_path}' not found.")
        return []

    url_list = []
    for file_path in search_path.rglob(pattern):
        relative_path = file_path.relative_to(publish_dir)
        url_path = relative_path.as_posix()

        if url_path.endswith("index.html"):
            url_path = url_path[:-10]

        full_url = f"{base_url}/{url_path}".rstrip("/") + "/"
        url_list.append(full_url)

    return url_list

def process_url(url):
    print(f"\n--- Results for: {url} ---")
    earliest = get_snapshot(url, "19000101")
    latest = get_snapshot(url, "21001231")

    if earliest:
        print(f"EARLIEST: {earliest['timestamp']} | {earliest['url']}")
    if latest:
        print(f"LATEST:   {latest['timestamp']} | {latest['url']}")
    if not earliest and not latest:
        print("No snapshots found.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Find archive bounds for one or many URLs.")
#    group = parser.add_mutually_exclusive_group(required=True)
#    group.add_argument("--url", help="A single target URL")
#    group.add_argument("--file", help="Path to a text file containing URLs (one per line)")
    parser.add_argument("--config", default="config.toml", help="Hugo config (config.toml or hugo.toml)")
    parser.add_argument("--sub", default="post", help="Subdirectory inside publishDir to scan")
    parser.add_argument("--pattern", default="*.html", help="File pattern to search")

    args = parser.parse_args()
    urls = get_hugo_url_list(args.config, args.sub, args.pattern)

    if "url" in args and args.url:
        urls = [args.url]
    elif "file" in args and args.file:
        if not os.path.exists(args.file):
            print(f"Error: File '{args.file}' not found.")
        else:
            with open(args.file, 'r') as f:
                urls = [line.strip() for line in f if line.strip()]
    for u in urls:
        process_url(u)
