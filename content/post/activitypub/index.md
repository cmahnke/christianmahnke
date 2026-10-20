---
date: 2024-04-15T13:58:44+02:00
title: "ActivityPub"
preview:
  image: ActivityPub-logo.png
  hide: true
tags:
- DIY
- Blog
wikipedia:
  - https://www.wikidata.org/wiki/Q40463886
---

Diese Seite unterstützt nun eine Untermenge von ActivityPub...

<!--more-->

...also den Teil, der sich statisch implementieren lässt.
Grundsätzlich nicht wirklich schwer, zu mal es auch einige Artikel zu dem Thema gibt:
* [Justin Garrison: Mastodon instance with 6 files](https://justingarrison.com/blog/2022-12-06-mastodon-files-instance/)
* [Maho Pacheco: A guide to implement ActivityPub in a static site (or any website)](https://maho.dev/2024/02/a-guide-to-implement-activitypub-in-a-static-site-or-any-website/)

## Umsetzung

Die Seite stellt drei Dateien bereit:

* `/.well-known/webfinger` – statische JRD-Datei, die `acct:cmahnke@christianmahnke.de` auflöst und auf den Actor verweist
* `/@cmahnke.json` – ein statisches ActivityStreams-`Person`-Objekt, das als Profil dient und auf den echten Mastodon-Account unter [openbiblio.social](https://openbiblio.social/@cmahnke) verlinkt
* `/outbox.json` – eine `OrderedCollection`, die die Blogartikel als `Create`/`Note`-Objekte auflistet

Umgesetzt ist das über eigene [Output-Formates](https://gohugo.io/templates/output-formats/) in Hugo (`activity-pub-actor` und `activity-pub-outbox` mit dem Medientyp `application/activity+json`), die Dateien werden also direkt beim Build erzeugt.

## Grenzen

Da die Seite rein statisch ausgeliefert wird, fehlt jeder serverseitige Teil des Protokolls: Es gibt kein `inbox`-Endpunkt, daher sind Folgen, Erwähnungen, Antworten und Löschen nicht möglich. Der Actor dient also nur zur Auffindbarkeit und verweist auf den echten Mastodon-Account. Auch werden die Beiträge aus der Outbox nicht automatisch in Mastodon-Timelines nachgeladen – dort bleiben die Artikel über den echten Account sichtbar.

Hinzu kommt die Auslieferung durch GitHub Pages: Die Content-Types ergeben sich dort allein aus der Dateiendung gemäß einer festen [MIME-Typ-Liste](https://github.com/jshttp/mime-db), eigene Header lassen sich nicht setzen. Dadurch wird `/.well-known/webfinger` als `application/octet-stream` ausgeliefert (statt `application/jrd+json`), die beiden JSON-Dateien als `application/json` (statt `application/activity+json`). Mastodon akzeptiert seit der Behebung von [GHSA-jhrq-qvrm-qr36](https://github.com/mastodon/mastodon/security/advisories/GHSA-jhrq-qvrm-qr36) beim Abruf von Actoren nur noch letztere Medientypen, sodass sich der Account von dort derzeit nicht auflösen lässt. Aber Webfinger-Auflösung selbst funktioniert...

## Tests

Die Webfinger-Auflösung lässt sich unter https://webfinger.net/lookup/ prüfen. Auf der Kommandozeile bietet sich der in Rust geschriebene [webfinger-cli](https://crates.io/crates/webfinger-cli) an: `cargo install webfinger-cli --locked`, anschließend `webfinger acct:cmahnke@christianmahnke.de`.
