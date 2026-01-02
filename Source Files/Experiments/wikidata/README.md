Wikidata Tools
==============

# Schema.org to Wikidata QuickStatements Converter

This script extracts Schema.org `Person` metadata (JSON-LD) from a given webpage URL and converts it into Wikidata QuickStatements. It is designed to help import person data into Wikidata.

## Features

- Extracts `Person` data directly or from `ProfilePage` `mainEntity`.
- Generates QuickStatements for:
  - Labels (multilingual and detected language).
  - Instance of (P31) -> Human (Q5).
  - Birth date (P569).
  - Official website (P856).
  - Social media profiles and other identifiers (mapped from `sameAs` links).
  - Mastodon/Fediverse accounts (P4033).
  - Memberships (P463) via `memberOf`.
- Validates generated QuickStatements for basic syntax errors.
- Smart lookup of properties and organizations using Wikidata API and SPARQL.

## Requirements

- Python 3
- `requests`
- `extruct`
- `w3lib`

Install dependencies:
```bash
pip install requests extruct w3lib
```

## Usage

```bash
python schema2wikidata.py <URL>
```

Example:
```bash
python schema2wikidata.py https://example.com/person/jdoe
```

## Applying Results
The script outputs QuickStatements commands to the console. To apply these changes to Wikidata: 

1. Run the script and copy the output.
2. Go to QuickStatements.
3. Log in with your Wikidata account.
4. Click on "New batch".
5. Paste the output into the text area.
6. Click "Import V1 commands".
7. Review the changes and click "Run" to apply them.

# Hugo Entity Extractor

This script analyzes Hugo content directories to extract Named Entities (people, organizations, etc.) using spaCy. It verifies these entities against Wikidata and can generate RDF triples for valid matches.

## Features

- Scans Hugo Markdown posts (handling frontmatter and shortcodes).
- Uses spaCy for Named Entity Recognition (NER).
- Verifies entities against Wikidata API.
- Caches Wikidata results in a local SQLite database.
- Supports language-specific processing (based on filename conventions).
- Outputs RDF data for matched entities.

## Requirements

- `spacy` (and language models like `en_core_web_trf`, `de_core_news_lg`)
- `python-frontmatter`
- `rdflib`
- `wikibaseintegrator`

## Usage

```bash
python extract_hugo_entities.py <directory> [--tags <tags_dir>] [--debug] [--lang <lang>] [--rdf <output.ttl>]
```
