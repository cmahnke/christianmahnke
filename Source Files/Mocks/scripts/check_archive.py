import argparse
import requests
import tomllib
from pathlib import Path
import sys, os, logging

sys.path.append("../../themes/projektemacher-base/scripts/PyHugo")
from content import Config
from Util import ArchiveOrg


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

def get_hugo_url_list(project_root, sub_dir="post", pattern="*.html"):
    project_root = Path(project_root).resolve()
    logging.info(f"Trying to load config from {project_root}")
    conf = Config(project_root)
    base_url = conf.baseURL()
    publish_dir = os.path.join(project_root, conf.publishDir())
    logging.debug(f"Publish directory {conf.publishDir()} ({publish_dir})")
    search_path = Path(os.path.join(project_root, publish_dir, sub_dir)).resolve()
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

    earliest = ArchiveOrg.earliest(url)
    latest = ArchiveOrg.latest(url)

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

    logging.basicConfig(level=logging.DEBUG)

    site_root = Path(args.config).parent
    if not site_root.exists():
        raise Exception(f"Site root {site_root} doesn't exists!")

    urls = get_hugo_url_list(site_root, args.sub, args.pattern)

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
