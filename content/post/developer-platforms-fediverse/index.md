---
date: 2026-04-30T17:30:00+02:00
title: Fediverse Anbindung für Entwicklungsplattformen
tags:
  - SoftwareDevelopment
  - ProjectIdea
  - GitHub
  - DigitalSovereignty
cite: true
wikidata:
  - https://www.wikidata.org/wiki/Q364
  - https://www.wikidata.org/wiki/Q16639197
  - https://www.wikidata.org/wiki/Q30325419
  - https://www.wikidata.org/wiki/Q27986619
  - https://www.wikidata.org/wiki/Q40463886
---

GitHub hat derzeit viele Probleme, was braucht es für einen Switch?
<!--more-->

Über die technischen Probleme (Zuverlässigkeit, Sicherheitsprobleme usw.) wurde bereits viel geschrieben und es wurden zahlreiche Videos erstellt. Auch zum Thema digitale Souveränität und Unabhängigkeit von Microsoft gibt es bereits zahlreiche Informationen.

Langer Rede kurzer Sinn: Es gibt gute Gründe, sich nach Alternativen zu GitHub umzusehen. Und auf den ersten Blick gibt es da eine gewisse Auswahl:

* [GitLab](https://about.gitlab.com/)
* [Codeberg](https://codeberg.org/)
* [Gitea](https://about.gitea.com/)
* [Forgejo](https://forgejo.org/)
* [Bitbucket](https://bitbucket.org/)

Einige davon bieten nur Hosting-Services an, andere stellen auch die Software für eine lokale Installation bereit.  

Diese Hosting-Services haben aber einige Nachteile gegenüber GitHub (zumindest, wenn man einen alten Account hat). GitHub bietet sehr viele Ressourcen, um Größenordnungen mehr als die Konkurrenz:
* Speicherplatz: Gerade bei meinen bildlastigen Blogs kann es vorkommen, dass ein Repository einige Gigabyte groß ist. Auch gibt es vereinzelt Dateien, die an die 50 MB groß sind.
* Auch Container-Images mit ein paar GB Größe können abgelegt werden.
* Die Runner haben eine maximale Laufzeit von sechs Stunden und bieten eine virtuelle Maschine, die mit etwas [Trickserei](https://christianmahnke.de/post/build-vector-tiles-on-github/) eine mittlere zweistellige Gigabyte-Zahl an freiem Platz bietet und dadurch auch umfangreiche Datentransformationen erlaubt.

Hinzu kommen CI-Infrastrukturen und andere Automatisierungen, die sich auf GitHub aufsetzen lassen.

Ein weiterer Faktor, der durch die Größe der Plattform zustande kommt, ist der [Netzwerkeffekt](https://de.wikipedia.org/wiki/Netzwerkeffekt), der kaum Beachtung findet. Das ist aus meiner Sicht ein großer Fehler, wenn man sich ernsthaft für einen Ersatz einsetzt.

## GitHub ist ein soziales Netzwerk

Allein schon, weil inzwischen sehr viele Projekte, besonders aus der JavaScript- und TypeScript-Community, auf GitHub zu finden sind, sind diese nicht nur auf Software-Ebene, sondern auch personell vernetzt. Dabei handelt es sich zwar in erster Linie um Arbeitsbeziehungen, aber trotzdem sollte man nicht vergessen, dass eine einfache At-Notation (@) in einem Issue oder Kommentar genutzt werden kann, um andere Personen auf etwas aufmerksam zu machen. Gleiches gilt für die Verlinkung von Informationen zwischen Projekten. GitHub erkennt auch diese Verlinkungen und integriert sie in verschiedene Verlaufsdarstellungen (Issues, Kommentare, Diskussionen, Pull Requests usw.).

Anders ausgedrückt: **GitHub ist ein soziales Netzwerk** und daher sind Probleme mit der Souveränität oder der Abhängigkeit vom Big-Tech-Giganten Microsoft für viele Leute schlicht kein hinreichender Grund, dieses bequeme Ökosystem zu verlassen.

Die Aussicht, von ihrer Community abgeschnitten in einer kleinen Insel ihren Code warten zu müssen, dürfte die Wechselfreude nicht unbedingt beflügeln. Gerade für kleinere Projekte bedeutet der Netzwerk-Effekt auch eine potenzielle erhöhte Sichtbarkeit – beispielsweise, wenn man eigene Projekte pflegt, um auf dem Arbeitsmarkt höhere Chancen zu haben.

## Entwicklungsplattformen müssen ins Fediverse!

Daher gilt: Wer eine Abnahme der GitHub-Nutzung bzw. einen Ersatz durch dezentrale europäische Lösungen bzw. Provider ernsthaft will, muss sich für die Vernetzung der Plattformen einsetzen. Digitale Souveränität allein ist nicht wirklich sexy.

[ActivityPub](https://de.wikipedia.org/wiki/ActivityPub) (die technische Grundlage für das Fediverse) bietet alle notwendigen Mechanismen. In jeder Plattform müssen mindestens die folgenden Entitäten adressierbar sein:
* Nutzer*innen
* Issues / Diskussionen – ggf. auch Kommentare
* Pull / Merge Requests
* Tags / Releases

Auf der Darstellungsebene müssen die Plattformen dann verschiedene "Inboxes" bereitstellen und in den entsprechenden Kontexten darstellen, also z. B. für Nutzer*innen Notifikationen oder Issue-Diskussionen.

Inzwischen bieten die Plattformen auch weitere Features wie einfaches Projektmanagement bzw. Boards und Dokumentationen bzw. Wikis. Aber fangen wir erstmal mit den Grundlagen an.

Die Idee ist nicht neu, es gibt beispielsweise [ForgeFed](https://forgefed.org/), aber die Integration ist bisher sehr überschaubar. Stattdessen werden eher Hype-Themen wie "Agentic AI" angegangen. Diese haben sicher ihre Berechtigung, besonders wenn man mit Buzzwords (z. B. Organisationen als) Kunden gewinnen muss. Aber (informelle Open-Source-)Communities erreicht man damit nicht.

**Wer eine Zukunft der Open-Source-Zusammenarbeit ohne Abhängigkeiten von Big Tech will, darf Vernetzung nicht als einfaches zusätzliches Feature behandeln, sondern muss sie als infrastrukturelle Notwendigkeit begreifen.**
