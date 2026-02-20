import argparse
from zenodo_client import Creator, Metadata, ensure_zenodo, update_zenodo
from pathlib import Path
import sys, os, logging
import json
from dataclasses import dataclass

sys.path.append("../../themes/projektemacher-base/scripts/")
from PyHugo import Content, Config, Post

DEFAULT_AUTHOR = {"name": "Christian Mahnke"}
DEFAULT_LICENSE = "cc-by-4.0"

UPLOAD_TYPE = "publication"
PUBLICATION_TYPE = "section"

IGNORE_KEYWORDS = ["Blog", "Projektemacher.org", "Status", "Suche", "Spaß", "Fun", ""]

# Logging Setup
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

@dataclass
class ZenodoEntry:
    title: str
    key: str
    authors: list
    description: str
    keywords: list
    license: str
    related_identifiers: list
    upload_files: dict
    posts: dict
    urls: dict
    deposition_id: str
    doi: str

    def to_json(self):
        from dataclasses import asdict

        def custom_serializer(o):
            if isinstance(o, Post):
                return str(o.path)
            if isinstance(o, Path):
                return str(o)
            raise TypeError(f"Object of type {o.__class__.__name__} is not JSON serializable")

        entry_dict = asdict(self)
        return json.dumps(entry_dict, indent=4, default=custom_serializer)

def prepare_entry(conf: Config):
    author = conf.config.get("params", {}).get("author", DEFAULT_AUTHOR).get("name")
    license = conf.config.get("params", {}).get("license", DEFAULT_LICENSE)
    orcid = conf.config.get("params", {}).get("social", {}).get("orcid", {}).get("username", "N/A")
    logging.info(f"Global Fallbacks - Author: {author}, License: {license}, ORCID: {orcid}")
    entry = ZenodoEntry(
        title="",
        key="",
        authors=[{"name": author, "orcid": orcid}],
        description="",
        keywords=[],
        license=license,
        related_identifiers=[],
        upload_files={},
        posts={},
        urls={},
        deposition_id="",
        doi=""
    )
    return entry

def zenodo_push(entry: ZenodoEntry, token, sandbox=True, dry_run=True, update=False):
    if not entry.upload_files or not entry.key or not entry.title:
        logging.warning(f"Missing required fields for entry '{entry.title}', skipping.")
        return
    
    metadata = Metadata(
        title=entry.title,
        creators=[Creator(name=a["name"], orcid=a.get("orcid"), affiliation=a.get("affiliation")) for a in entry.authors],
        description=entry.description,
        keywords=entry.keywords,
        license=entry.license,
        related_identifiers=entry.related_identifiers
    )

    if dry_run:
          logging.info(f"[DRY RUN] Would upload '{entry.title}' to Zenodo from file {entry.posts}.")
          logging.info(f"[DRY RUN] Files to be uploaded: {entry.upload_files.values()}")
          return

    try:
        if entry.deposition_id != "" or entry.doi != "":
            logging.info(f"Entry '{entry.title}' already has a deposition ID or DOI, skipping upload.")
            return
        else:
            logging.info(f"Uploading {entry.title} to Zenodo...")
            res = ensure_zenodo(
                key=entry.key,
                data=metadata,
                paths=entry.upload_files.values(),
                sandbox=sandbox,
                access_token=token
            )

        for lang, post in entry.posts.items():
            zenodo = post.getMetadata(lang).get("zenodo", {})
            zenodo_post_metadata = {
                "doi": res.metadata.prereserve_doi['doi'],
                "deposition_id": res.metadata.deposition_id
            }
            zenodo_post_metadata = {**zenodo, **zenodo_post_metadata}
            if update:
                for lang, post in entry.posts.items():
                    post.addMetadata("zenodo", zenodo_post_metadata, lang)
          
            logging.info(f"Success! DOI {zenodo_post_metadata['doi']} in {post} added.")

    except Exception as e:
        logging.error(f"Error while uploading {entry.posts}: {e}")

def check_hugo_posts(site_root, subdir, pattern, update=False):
    conf = Config(site_root)
    langs = conf.langs
    logging.info(f"Site languages: {langs}, default: {conf.defaultLanguage}")
    content = Content(os.path.join(site_root, Content.DEFAULT_CONTENT_DIR), sub_path=subdir, config=conf, sections=False)
    entries = []
    base_url = conf.baseURL()
    content_root = os.path.join(site_root, conf.publishDir())
    
    post_files = {}
    for post in content:
        entry = prepare_entry(conf)
        if not post.path or not post.getURL():
            logging.warning(f"Post {post} has no path or URL, skipping.")
            continue
        relative = post.path.relative_to(site_root)
        logging.info(f"Processig post: {post.path} | Output Dirs: {post.getOutputDirs()} | URL: {post.getURL()}")
        if not str(relative) in post_files:
            post_files[str(relative)] = {}
        post_files[str(relative)]["URL"] = post.getURL()

        for lang, search_path in post.getOutputDirs().items():
            search_path = os.path.join(site_root, search_path)
            logging.info(f"Checking for files in {search_path} for language '{lang}'")
            files = list(Path(search_path).rglob(pattern))
            for file in files:
                relative_path = file.relative_to(content_root)
                full_url = f"{base_url.rstrip("/")}/{os.path.dirname(relative_path)}".rstrip("/") + "/"
                entry.urls[lang] = full_url
                entry.upload_files[lang] = str(file)
                entry.posts[lang] = post
                entry.related_identifiers.append({"identifier": full_url, "relation": "isIdenticalTo", "resource_type": "publication-section"})
        
            keywords = post.getKeywords()
            # TODO: This isn't working yet
            #keywords = post.getKeywords(lang)
            keywords = list(set(keywords) - set(IGNORE_KEYWORDS))
            description = post.getMetadata(lang).get("description", "")
            title = post.getMetadata(lang).get("title", "")
            zenodo = post.getMetadata(lang).get("zenodo", {})
            if "description" in zenodo:
                description = zenodo["description"]
            if "keywords" in zenodo:
                keywords = zenodo["keywords"]
            if "doi" in zenodo:
                entry.doi = zenodo["doi"]
            if "deposition_id" in zenodo:
                entry.deposition_id = zenodo["deposition_id"]
                entry.key = entry.deposition_id
        
            entry.keywords.extend(keywords)
            if entry.description != "" and description != "":
                entry.description = f"{entry.description}\n\n---\n\n{description}"
            elif description != "":
                entry.description = description
        
            if entry.title != "" and title != "":
                entry.title = f"{entry.title} / {title}"
            elif title != "":
                entry.title = title

        entry.keywords = list(set(entry.keywords))
        logging.info(f"Entry for {post.path} - {entry.to_json()}")
        entries.append(entry)

    return entries        

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Push Hugo posts to Zenodo.")
    parser.add_argument("--basedir", "-b", default=".", help="The base directory of the Hugo project.")
    parser.add_argument("--sub", default="post", help="Subdirectory inside publishDir to scan")
    parser.add_argument("--pattern", default="article.pdf", help="File pattern to search")
    parser.add_argument("--dry-run", "-n", action="store_true", help="Perform a dry run without uploading or changing files.")
    parser.add_argument("--token", help="Zenodo API Token")
    parser.add_argument("--update", "-u", action="store_true", default=False, help="Updated post front matter with archive URLs")
    parser.add_argument("--debug", "-d", action="store_true", help="Enable debug logging")
    args = parser.parse_args()

    if args.debug:
        logging.basicConfig(level=logging.DEBUG)

    site_root = Path(args.basedir).resolve()
    logging.info(f"Trying to load config from {site_root} and process posts in subdir '{args.sub}' with pattern '{args.pattern}'")
    posts = check_hugo_posts(site_root, args.sub, args.pattern, args.update)
    for entry in posts:
        zenodo_push(entry, token=args.token, sandbox=True, dry_run=args.dry_run, update=args.update)
