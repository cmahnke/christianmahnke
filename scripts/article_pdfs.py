#!/usr/bin/env python3
"""Render the Hugo print segment and convert every article.html into a labeled PDF via vivliostyle-batch-cli."""

import argparse
import logging
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

from tqdm import tqdm
from tqdm.contrib.logging import logging_redirect_tqdm

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DOCS_DIR = "docs"
DEFAULT_BASE_URL = "https://christianmahnke.de/"
LOCALHOST_BASE = "http://localhost:1313/"
PDF_NAME = "article.pdf"
HTML_NAME = "article.html"
BATCH_CLI = REPO_ROOT / "node_modules" / "@projektemacher" / "vivliostyle-batch-cli" / "dist" / "vivliostyle-batch-cli.js"
PDF_LEVELS = ("1a", "1b", "2a", "2b", "2u", "3a", "3b", "3u", "4", "off")
DOI_PATTERN = re.compile(r"https://doi\.org/10\.[0-9]+/[A-Za-z0-9._-]+")

logger = logging.getLogger(__name__)


@dataclass
class Job:
    html: Path
    pdf: Path
    page_url: str
    doi: str = ""


def parse_args(argv):
    passthrough = []
    if "--" in argv:
        split = argv.index("--")
        argv, passthrough = argv[:split], argv[split + 1 :]
    parser = argparse.ArgumentParser(
        prog="article_pdfs.py",
        description="Render the Hugo print segment and convert every article.html into a PDF via vivliostyle-batch-cli.",
    )
    parser.add_argument(
        "post",
        nargs="?",
        help="Regenerate only the post matching this URL path segment, e.g. whalebone-arch-levin-park",
    )
    parser.add_argument(
        "-f",
        "--force",
        action="store_true",
        help="Rebuild PDFs even if they already exist",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Log everything to the console (default: progress bar only, failures still shown)",
    )
    parser.add_argument(
        "--pdfa",
        default="2b",
        choices=PDF_LEVELS,
        help="Label the PDFs as PDF/A, 'off' to skip labeling (default: %(default)s)",
    )
    parser.add_argument(
        "--verapdf",
        action="store_true",
        help="Additionally run the verapdf binary (must be on the PATH) against every PDF",
    )
    parser.add_argument(
        "--docs-dir",
        default=DEFAULT_DOCS_DIR,
        help="Rendered site directory to search for article.html (default: %(default)s)",
    )
    parser.add_argument(
        "--base-url",
        default=DEFAULT_BASE_URL,
        help="Canonical site URL written into the PDF metadata (default: %(default)s)",
    )
    args = parser.parse_args(argv)
    args.passthrough = passthrough
    return args


def page_url_for(html_path, docs_root, base_url):
    rel_dir = html_path.parent.relative_to(docs_root)
    page_dir = "" if rel_dir == Path(".") else f"{rel_dir.as_posix()}/"
    return f"{base_url.rstrip('/')}/{page_dir}"


def repo_relative(path):
    try:
        return path.relative_to(REPO_ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def delete_matching_pdfs(docs_root, post):
    deleted = 0
    for pdf in sorted(docs_root.rglob(PDF_NAME)):
        if f"/{post}/" in pdf.as_posix():
            pdf.unlink()
            deleted += 1
    return deleted


def collect_jobs(docs_root, post, base_url, force=False):
    jobs = []
    skipped_existing = skipped_redirect = skipped_filter = 0
    for html in sorted(docs_root.rglob(HTML_NAME)):
        if post and f"/{post}/" not in html.as_posix():
            skipped_filter += 1
            continue
        pdf = html.with_suffix(".pdf")
        if pdf.exists() and not force:
            skipped_existing += 1
            logger.debug("Skipping '%s' (already exists)", repo_relative(pdf))
            continue
        text = html.read_text(encoding="utf-8", errors="replace")
        if 'http-equiv="refresh"' in text:
            skipped_redirect += 1
            logger.debug("Skipping '%s' (alias redirect page)", repo_relative(html))
            continue
        doi = DOI_PATTERN.search(text)
        jobs.append(
            Job(
                html=html,
                pdf=pdf,
                page_url=page_url_for(html, docs_root, base_url),
                doi=doi.group(0) if doi else "",
            )
        )
    return jobs, skipped_existing, skipped_redirect, skipped_filter


def docs_prefix(args):
    docs = Path(args.docs_dir)
    prefix = docs.as_posix().rstrip("/")
    if not docs.is_absolute():
        prefix = f"./{prefix}"
    return f"{prefix}/"


def build_command(job, args):
    prefix = docs_prefix(args)
    cmd = [
        "node",
        BATCH_CLI.as_posix(),
        "-i",
        repo_relative(job.html),
        "--static",
        f"/:{prefix}",
        "--asset-base",
        f"{args.base_url.rstrip('/')}/={prefix}",
        "--asset-base",
        f"{LOCALHOST_BASE}={prefix}",
        "--ignore-asset",
        "/livereload.js",
        "--fetch-missing",
    ]
    if args.pdfa != "off":
        cmd += ["--pdfa", args.pdfa]
    if args.verapdf:
        cmd += ["--verapdf"]
    cmd += ["--url", job.page_url]
    if job.doi:
        cmd += ["--doi", job.doi]
    cmd += ["-o", repo_relative(job.pdf)]
    cmd += args.passthrough
    return cmd


def run_hugo(args):
    cmd = ["hugo", "--renderSegments", "print"]
    if args.verbose:
        return subprocess.run(cmd, cwd=REPO_ROOT).returncode
    result = subprocess.run(cmd, cwd=REPO_ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    if result.returncode != 0:
        logger.error("hugo --renderSegments print failed:\n%s", result.stdout)
    return result.returncode


def convert_jobs(jobs, args):
    failures = []
    if args.verbose:
        for job in jobs:
            logger.info("Converting '%s' to '%s'...", repo_relative(job.html), repo_relative(job.pdf))
            result = subprocess.run(build_command(job, args), cwd=REPO_ROOT)
            if result.returncode == 0:
                logger.info("'%s' created successfully", repo_relative(job.pdf))
            else:
                logger.error("Error converting '%s'", repo_relative(job.html))
                failures.append(job)
        return failures
    with logging_redirect_tqdm():
        bar = tqdm(jobs, unit="pdf", desc="Converting")
        for job in bar:
            bar.set_postfix_str(job.html.parent.name)
            result = subprocess.run(
                build_command(job, args),
                cwd=REPO_ROOT,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
            )
            if result.returncode != 0:
                logger.error("Error converting '%s':\n%s", repo_relative(job.html), result.stdout)
                failures.append(job)
        bar.close()
    return failures


def main(argv=None):
    if argv is None:
        argv = sys.argv[1:]
    args = parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(levelname)s: %(message)s",
    )

    for tool in ("node", "hugo"):
        if shutil.which(tool) is None:
            logger.error("'%s' not found on the PATH", tool)
            return 1
    if not BATCH_CLI.exists():
        logger.error("vivliostyle-batch-cli not found at '%s', run 'npm install' first", repo_relative(BATCH_CLI))
        return 1

    docs_root = Path(args.docs_dir).resolve() if Path(args.docs_dir).is_absolute() else (REPO_ROOT / args.docs_dir).resolve()

    if docs_root.is_dir() and not args.force and not args.post:
        jobs, skipped_existing, skipped_redirect, skipped_filter = collect_jobs(docs_root, args.post, args.base_url)
        if not jobs:
            logger.info(
                "Nothing to do: %d article page(s) already have PDFs, %d alias redirect page(s) skipped - skipping hugo",
                skipped_existing,
                skipped_redirect,
            )
            return 0
        logger.info("%d article page(s) without PDF found in '%s' - running hugo first", len(jobs), repo_relative(docs_root))

    if run_hugo(args) != 0:
        return 1

    if args.post:
        deleted = delete_matching_pdfs(docs_root, args.post)
        logger.info("Single-post mode: regenerating only '%s' (%d existing PDF(s) deleted)", args.post, deleted)

    jobs, skipped_existing, skipped_redirect, skipped_filter = collect_jobs(docs_root, args.post, args.base_url, args.force)
    logger.info(
        "Searching '%s' for 'article.html': %d to convert, %d already exist, %d alias redirect page(s), %d filtered",
        repo_relative(docs_root),
        len(jobs),
        skipped_existing,
        skipped_redirect,
        skipped_filter,
    )

    failures = convert_jobs(jobs, args)
    logger.info("Finished: %d converted, %d failed", len(jobs) - len(failures), len(failures))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
