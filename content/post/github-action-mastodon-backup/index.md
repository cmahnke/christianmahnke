---
date: 2026-01-15T06:22:44+02:00
title: "Mastodon Backups mit GitHub Actions"
draft: true
description: 'Aus aktuellem Anlass'
tags:
- Projektemacher.org
- SocialMedia
wikidata: 
  - https://www.wikidata.org/wiki/Q27986619
  - https://www.wikidata.org/wiki/Q115232190
---

Aus aktuellem Anlass...
<!-more-->

...auch wenn ich schon lange nichts mehr bei Mastodon gepostet habe, wollte ich meine Aktivitäten zwischen den Jahren dort mal wieder veröffentlichen.

Leider war [openbiblio.social](https://openbiblio.social/home) [down](https://bibcourse.eu/t/https-openbiblio-social-down/284/19). Auch wenn ich es bisher nicht vorhabe, aber für den Fall, dass man mal umziehen will, hier ein Beispiel, wie man [GitHub Actions](https://github.com/features/actions) nutzen kann, um ein Backup zu machen – für den Fall, dass man mal umziehen will. Prinzipiell kann man daraus auch eine statische Präsentation für die Seite erstellen.

Zur Sicherung  wird [`mastodon-archive`](https://github.com/kensanata/mastodon-archive) eingesetzt. Da die Mastodon-API des Heimatsservers angezapft wird, muss der Zugang dazu konfiguriert werden.Hier ist zu beachten, dass die Authentifizierung ab und zu erneuert werden muss. Abschließend werden mit [`jq`](https://jqlang.org/) (`jq '.mentions |= del(.[] | select(.visibility == "direct"))'`) noch Direktnachrichten aus der Sicherung entfernt.

## Konfiguration
Es braucht zwei Konfigurationsvariablen um `mastodon-archive` zu nutzen:
* `MASTODON_USER_SECRET`
* `MASTODON_SERVER_SECRET`

Die beiden benötigten Dateien können mit `mastodon-archive` lokal generiert werden. Sie werden angelegt, wenn das Programm zum ersten Mal gestartet wird.

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

## Aufräumen

Wenn das Repository, in dem das Backup gespeichert wird, öffentlich einsehbar ist, möchte man unter Umständen weitere Informationen entfernen. Dazu können entweder die Optionen von `mastodon-archive` angepasst werden oder, wenn mehr Präzision erforderlich ist, wieder `jq` genutzt werden.
