---
date: 2026-01-15T06:22:44+02:00
title: "Mastodon backups with GitHub Actions"
draft: true
description: 'Due to recent events'
tags:
- Projektemacher.org
- SocialMedia
wikidata: 
  - https://www.wikidata.org/wiki/Q27986619
  - https://www.wikidata.org/wiki/Q115232190
---

Due to recent events...
<!-more-->

...even though I haven't posted anything on Mastodon for a long time, I wanted to publish my activities there again between Christmas and New Year.

Unfortunately, [openbiblio.social](https://openbiblio.social/home) was [down](https://bibcourse.eu/t/https-openbiblio-social-down/284/19). Even though I don't plan to do so at the moment, here's an example of how you can use [GitHub Actions](https://github.com/features/actions) to make a backup – just in case you ever want to move. In principle, you can also use it to create a static presentation for the site.

[`mastodon-archive`](https://github.com/kensanata/mastodon-archive) is used for backup purposes. Since the Mastodon API of the home server is tapped, access to it must be configured. Please note that authentication must be renewed from time to time. Finally, direct messages are removed from the backup using [`jq`](https://jqlang.org/) (`jq “.mentions |= del(.[] | select(.visibility == ‘direct’))”`).

## Configuration
Two configuration variables are required to use `mastodon-archive`:
* `MASTODON_USER_SECRET`
* `MASTODON_SERVER_SECRET`

The two required files can be generated locally with `mastodon-archive`. They are created when the programme is started for the first time.

## `.github/workflows/mastodon-archive.yml`

```yaml
name: Backup Mastodon

on:
  workflow_dispatch:
  schedule:
    - cron:  '30 3 * * 1,3,6'

env:
  MASTODON_USER: cmahnke@openbiblio.social
  USER_SECRET_FILE: ./openbiblio.social.user.cmahnke.secret
  SERVER_SECRET_FILE: ./openbiblio.social.server.secret
  BACKUP_BRANCH: mastodon-backup
  BACKUP_FILE: ./openbiblio.social.user.cmahnke.json
  BACKUP_DIRECTORY: ./data/mastodon

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

permissions:
  packages: write
  contents: write

jobs:
  backup:
    runs-on: ubuntu-24.04
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v6
      - name: Create Backup Branch
        run: |
          git checkout ${{ env.BACKUP_BRANCH }} || git switch --orphan ${{ env.BACKUP_BRANCH }}
          mkdir -p ${{ env.BACKUP_DIRECTORY }}
          echo "*.secret" > ${{ env.BACKUP_DIRECTORY }}/.gitignore

      - name: Install dependencies
        run: sudo apt-get install -y moreutils jq

      - name: Set up Python
        uses: actions/setup-python@v6
        with:
          python-version: '3.x'
         
      - name: Install mastodon-archive
        run: pip install mastodon-archive

      - name: Setup Secrets
        working-directory: ${{ env.BACKUP_DIRECTORY }}
        run: |
          echo "${{ secrets.MASTODON_USER_SECRET }}" > ${{ env.USER_SECRET_FILE }}
          echo "${{ secrets.MASTODON_SERVER_SECRET }}" > ${{ env.SERVER_SECRET_FILE }}

      - name: Run backup
        working-directory: ${{ env.BACKUP_DIRECTORY }}
        run: mastodon-archive archive --with-followers --with-following --with-mentions ${{ env.MASTODON_USER }}

      - name: Clean backup
        working-directory: ${{ env.BACKUP_DIRECTORY }}
        run: |
          rm ${{ env.USER_SECRET_FILE }}
          rm ${{ env.SERVER_SECRET_FILE }}
          jq '(.mentions, .statuses) |= del(.[] | select(.visibility == "direct"))' ${{ env.BACKUP_FILE }} | sponge ${{ env.BACKUP_FILE }}

      - name: Commit changes
        uses: stefanzweifel/git-auto-commit-action@v7
        with:
          commit_message: Update Mastodon backup
          file_pattern: ${{ env.BACKUP_DIRECTORY }}/*.json
          create_branch: true
          branch: ${{ env.BACKUP_BRANCH }}
```

## Tidying up

If the repository where the backup is stored is publicly accessible, you may want to remove additional information. To do this, you can either adjust the options in `mastodon-archive` or, if more precision is required, use `jq` again.
