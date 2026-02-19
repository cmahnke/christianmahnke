import argparse
from pathlib import Path
import sys, os, logging

sys.path.append("../../themes/projektemacher-base/scripts/")
from PyHugo import Content, Config, ArchiveOrg

def get_posts(site_root, sub_dir="post", pattern="index.html"):
    conf = Config(site_root)
    content = Content(os.path.join(site_root, Content.DEFAULT_CONTENT_DIR), sub_path=sub_dir, config=conf, sections=False)
    base_url = conf.baseURL()
    content_root = os.path.join(site_root, conf.publishDir())

    post_files = []
    for post in content:
        if not post.path or not post.getURL():
            logging.warning(f"Post {post} has no path or URL, skipping.")
            continue
        logging.debug(f"Processig post: {post.path} | Output Dirs: {post.getOutputDirs()} | URL: {post.getURL()}")
        for lang, search_path in post.getOutputDirs().items():
            search_path = os.path.join(site_root, search_path)
            
            #files = Path(os.path.join(site_root, search_path)).rglob(pattern)
            files = list(Path(search_path).rglob(pattern))
            logging.info(f"Checking for files in {search_path} for language '{lang}', found {len(files)} files")
            for file in files:
                relative_path = file.relative_to(content_root)
                full_url = f"{base_url.rstrip("/")}/{os.path.dirname(relative_path)}".rstrip("/") + "/"
                logging.debug(f"Found file: {file} | URL: {full_url}")
                post_files.append(full_url)
    return post_files

# TODO: Use PyHugo to list contents
def get_hugo_url_list(project_root, sub_dir="post", pattern="*.html"):
    urls = get_posts(project_root, sub_dir, pattern)
    return urls

def process_url(url, update=False):
    if update:
        print("Update mode is not implemented yet.")
        sys.exit(1)

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
    parser.add_argument("--config", "-c", default="config.toml", help="Hugo config (config.toml or hugo.toml)")
    parser.add_argument("--sub", default="post", help="Subdirectory inside publishDir to scan")
    parser.add_argument("--pattern", default="*.html", help="File pattern to search")
    parser.add_argument("--update", "-u", action="store_true", help="Updated post front matter with archive URLs")

    args = parser.parse_args()

    logging.basicConfig(level=logging.DEBUG)

    if args.update:
        print("Update mode is not implemented yet.")
        sys.exit(1)


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
