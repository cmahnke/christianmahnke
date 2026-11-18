# Zenodo Workflow

Selected blog posts are published as PDFs on [Zenodo](https://zenodo.org/) to keep them
citeable and permanently archived (see the background in
`content/post/zenodo-articles/`). The pipeline has three stages:

1. Hugo renders a print-optimised HTML version of the post (`pdf-article` output format)
2. [Vivliostyle](https://vivliostyle.org/) converts that HTML into a PDF
3. [`zenodo-client`](https://github.com/cthoyt/zenodo-client) uploads the PDF with proper
   metadata (author, ORCID, keywords, license, related identifiers) and a DOI is issued

The metadata model follows the article
["Making your blog FAIR"](https://drmowinckels.io/blog/2024/fair-blog/) by Athanasia Mo
Mowinckel.

## Requirements

* Hugo (extended, Dart Sass) – for the `pdf-article` output format
* `vivliostyle-batch-cli` (`@projektemacher/vivliostyle-batch-cli`, in `package.json`)
* Python dependencies from `requirements.txt`, notably `zenodo-client`, `GitPython`
  plus the theme's `PyHugo` module (`themes/projektemacher-base/scripts`)
* A Zenodo account

## API Keys

Zenodo requires a personal access token for uploads. **Production and sandbox are
separate systems with separate accounts and separate tokens**:

| Target     | Host                  | Token / env var                |
| ---------- | --------------------- | ------------------------------ |
| Sandbox    | `sandbox.zenodo.org`  | `ZENODO_SANDBOX_ACCESS_TOKEN`  |
| Production | `zenodo.org`          | `ZENODO_ACCESS_TOKEN`          |

Create the tokens under *Account → Applications → Personal access tokens* on the
respective host with the `deposit:write` (and `deposit:actions`) scopes.

The token is passed to the script explicitly via `--token`:

```shell
python scripts/zenodo.py --token "$ZENODO_SANDBOX_ACCESS_TOKEN"
```

Tokens must never be committed – keep them in your shell environment or a local
untracked `.env` file.

## Sandbox vs. Production

`scripts/zenodo.py` **defaults to the sandbox**. Sandbox deposits get fake DOIs
(`10.5072/...`) and can be freely deleted – always test there first.

* Default (sandbox):

  ```shell
  python scripts/zenodo.py
  ```

* Production (real, permanent DOI):

  ```shell
  python scripts/zenodo.py --production   # short form: -p
  ```

The flag is defined in `scripts/zenodo.py:220`
(`action="store_false", dest="sandbox", default=True`) and is forwarded to
`ensure_zenodo(..., sandbox=sandbox)` in `zenodo_push()`. The target is logged at
startup: `Target: Zenodo sandbox` / `Target: Zenodo production`.

Other useful flags:

| Flag             | Effect                                                                        |
| ---------------- | ----------------------------------------------------------------------------- |
| `-n` `--dry-run` | Log what would be uploaded without contacting Zenodo or changing files        |
| `-u` `--update`  | Write the returned `doi` and `deposition_id` back into the post front matter  |
| `-b` `--basedir` | Hugo project root (default `.`)                                               |
| `--sub`          | Content subdirectory to scan (default `post`)                                 |
| `--pattern`      | File pattern to upload per language (default `article.pdf`)                   |
| `-d` `--debug`   | Debug logging                                                                 |

## Internal Workings

### 1. Hugo side: the `pdf-article` output format

`hugo.toml` defines a dedicated HTML output format used only for print rendering
(hugo.toml:241):

```toml
[outputFormats.pdf-article]
  mediaType = "text/html"
  baseName = "article"     # → article.html
  permalinkable = true
```

The build is scoped to blog posts via the `print` segment (hugo.toml:364): only pages
under `/post/**` get the `pdf-article` output, everything else (links, maps, about,
collections, …) is excluded. `scripts/article-pdfs.sh` triggers it with:

```shell
hugo --renderSegments print
```

A post opts in through its front matter:

```yaml
outputs:
  - html
  - bibtex
  - codemeta
  - pdf-article
```

The templates involved:

* `layouts/single.pdf-article.html` – renders the header plus the `article/page.html`
  partial into the standalone page
* `layouts/baseof.pdf-article.html` – bare skeleton: sets `author`/`subject`/`date` meta
  tags, compiles `scss/article-pdf.scss` to `css/article.css`, and loads `ts/print.ts`
  as `js/print.js`. Asset URLs honour the site parameter `print.relative`
* PDF-friendly shortcode overrides live next to the regular ones, e.g.
  `layouts/_shortcodes/figure.pdf-article.html`, `footnote.pdf-article.html`,
  `gallery.pdf-article.html`, plus `_markup/render-link.pdf-article.html`

### 2. PDF generation: `scripts/article-pdfs.sh`

After the segmented Hugo build the script searches `docs/` (the `publishDir`) for every
`article.html` and converts each one to `article.pdf` via `vivliostyle-batch-cli`:

```shell
npx vivliostyle-batch-cli -i "$html_file" --static /:./docs/ \
  --asset-base https://christianmahnke.de/=./docs/ \
  --asset-base http://localhost:1313/=./docs/ \
  --ignore-asset /livereload.js -o "$pdf_file"
```

### 3. Upload: `scripts/zenodo.py`

The script uses the theme's `PyHugo` module to read posts and metadata.

**Preconditions for processing a post:**

* Drafts are skipped
* The post's content files must be **fully committed** (identical to `HEAD`): the script
  checks each language file with [GitPython](https://github.com/gitpython-developers/GitPython)
  (no git CLI is invoked) and skips posts that are untracked, have unstaged changes or
  staged-but-uncommitted changes, with a warning stating the reason. If `basedir` is not
  a git repository, the check is skipped with a warning.
  Because `--update` writes `doi`/`deposition_id`/`lastmod` back into the front matter,
  those changes have to be committed before the *next* run will process the post again
  (the check runs before any writes).
* A post is only uploaded if **every** language version has `zenodo.publish: true`
* The `lastmod` front matter must be **identical in every language version** – on a
  mismatch (including `lastmod` present in only one language) the script fails with an
  error and exits

**Change detection and new versions:**

* The post's effective `lastmod` (the latest across all languages) is compared against
  the `zenodo.lastmod` value recorded in the front matter at the time of the last upload
* Published posts that are unchanged are skipped
* Published posts whose `lastmod` is newer than the recorded `zenodo.lastmod` get a **new
  Zenodo version**: `zenodo_client`'s `update_zenodo()` opens a new version of the
  existing deposition and re-uploads the files (metadata is carried over unchanged)
* Posts published before `zenodo.lastmod` tracking was introduced are skipped with a
  warning – they cannot be change-detected until a version is created once manually
* A failed upload (API error or unusable response, on the sandbox and in production)
  never modifies the post's front matter; if a front-matter write fails after a
  successful upload, the remaining languages are left untouched and reported

**`check_hugo_posts()`** collects one `ZenodoEntry` per post (all languages):

* For each language it looks for the PDF (`article.pdf` by default) in the language's
  output directory
* Metadata assembly:
  * Author and ORCID come from the site config (`params.author`,
    `params.social.orcid`), license defaults to `cc-by-4.0`
  * Keywords are the union of all language tags minus `IGNORE_KEYWORDS`
    (`Blog`, `Projektemacher.org`, `Status`, `Suche`, `Spaß`, `Fun`, `""`)
  * Descriptions of all languages are concatenated (separated by `---`), titles are
    joined with ` / `
  * Each language URL is added as a `isIdenticalTo` related identifier
    (`resource_type: publication-section`)
* The Zenodo *key* (used by `zenodo-client` for idempotency) is the post's content
  path; if a `deposition_id` already exists, it becomes the key instead

**`zenodo_push()`** then:

* Skips entries that already have a `doi` or `deposition_id` and are unchanged
  (uploads are never duplicated)
* For changed entries with an existing deposition, creates a new version via
  `update_zenodo()`; for new entries calls `ensure_zenodo()`, which re-uses an existing
  deposition with the same key or creates a new one
* Extracts `doi` and `deposition_id` from the API response
* With `--update`, merges `{doi, deposition_id, lastmod}` into the `zenodo` front matter
  block of every language version of the post

### 4. Front matter contract

To mark a post for publication:

```yaml
zenodo:
  publish: true
```

Optional overrides per language: `zenodo.description` and `zenodo.keywords` (replace the
derived values). The `lastmod` front matter is used to detect changes and **must be
identical in all language versions** of a post. After a successful upload the script adds:

```yaml
zenodo:
  publish: true
  doi: 10.5281/zenodo.XXXXXX
  deposition_id: "12345678"
  lastmod: 2026-11-18T00:00:00+01:00
```

`zenodo.lastmod` records the post's `lastmod` at upload time; if the post's `lastmod`
is later raised, the next run creates a new Zenodo version with the rebuilt PDF.
Remember to commit these front-matter changes afterwards, otherwise the next run skips
the post (see the committed-state check above).

`check-post.html` emits a build warning for any post with a `zenodo` block but no
`zenodo.doi` ("Zenodo metadata without DOI"), so unpublished-but-marked posts are easy
to spot.

### 5. Rendering the DOI on the site

* `layouts/_partials/article/page.html:45` – if `zenodo.doi` is set, the DOI is shown in
  the post metadata block via the shared `doi.html` partial, labelled with the i18n key
  `zenodoDoiPrefix` ("DOI dieses Artikels" / "DOI of this article", i18n/de.toml:72,
  i18n/en.toml:68)
* `layouts/_shortcodes/zenodo.html` – the `{{< zenodo doi="..." >}}` shortcode renders
  the official Zenodo DOI badge
  (`https://zenodo.org/badge/DOI/<doi>.svg`) inside a `div.zenodo-badge`
* `layouts/single.bib` – the BibTeX export includes the Zenodo DOI as the citation DOI

## SCSS Files

### `assets/scss/zenodo.scss`

Styles the shortcode badge: right-aligned within the post and with the site's usual
`_` link decorations stripped:

```scss
.post {
  .zenodo-badge {
    text-align: end;

    a {
      &:before,
      &:after {
        content: '' !important;
      }
    }
  }
}
```

It is imported by the main stylesheet at `assets/scss/base.scss:21` (`@use "./zenodo"`).

### `assets/scss/article-pdf.scss`

The print stylesheet compiled by `layouts/baseof.pdf-article.html:26-28` to
`css/article.css` (Dart Sass, compressed, fingerprinted). It is what Vivliostyle
renders into the PDF:

* `@page` setup: A4, 1 cm margins, page counter in the bottom centre, footnote area
  (`float: bottom`) with a separator rule
* Post header/meta: centred title, description, author + ORCID icon, URL and DOI rows,
  bordered tag chips; the citation container is hidden
* Body: two-column layout (`column-count: 2`), justified text, STIX Two Text for body
  copy and Strichpunkt Sans for accents, first paragraph italic, figures/tables/code
  blocks span all columns and avoid page breaks
* Footnotes: real CSS footnotes (`float: footnote`) with `::footnote-call` and
  `::footnote-marker` counters, hidden on screen
* Figure captions get automatic `Fig. N:` numbering via a `figure` counter, galleries
  reuse the same counter
* Table of contents and related-posts blocks are hidden for the PDF

### `themes/projektemacher-base/assets/scss/icons.scss`

Lines 137–139 define the Zenodo logo as URL-encoded SVG data URIs, recoloured through
the theme's `encodecolor()` function:

* `$zenodo-light` – filled with `$color-light` (`#d3d3d3`)
* `$zenodo-dark` – filled with `$color-dark` (`#333`)

They follow the same pattern as the other icon variables (bars, picture, tag, …) and are
currently defined but not yet referenced anywhere – reserved for a Zenodo link icon in
the footer/social sections.

## Usage Examples

Typical workflow for a new post:

```shell
# 1. Build HTML + render the print segment
./scripts/article-pdfs.sh

# 2. Preview what would be uploaded (no API call)
python scripts/zenodo.py --dry-run

# 3. Upload to the sandbox and write the DOI back into the front matter
python scripts/zenodo.py --token "$ZENODO_SANDBOX_ACCESS_TOKEN" --update

# 4. Check the sandbox entry, then go live
python scripts/zenodo.py --production --token "$ZENODO_ACCESS_TOKEN" --update
```

Note that `article-pdfs.sh` rebuilds the whole print segment, so step 4 should be
followed by a regular `hugo` build (or deploy) so the site picks up the new
`zenodo.doi` front matter written by `--update`.

## Updating an already published post

1. Change the post content **and** raise `lastmod` in **all** language versions
   (identical values, otherwise the script fails)
2. Commit the changes
3. Rebuild the PDFs: `./scripts/article-pdfs.sh`
4. Run the upload again – the script detects `lastmod` > `zenodo.lastmod` and creates a
   new Zenodo version with the updated PDF (`doi` in the front matter stays valid)
5. Commit the front-matter changes written by `--update`, then rebuild/deploy the site
