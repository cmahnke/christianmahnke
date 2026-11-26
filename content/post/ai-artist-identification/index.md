---
date: 2026-11-25T22:52:22+02:00
title: 'KI unterstützte Zuschreibungen'
description: "Zwei bisher unbekannte Künstler identifiziert"
params:
  cite: true
  wikidata:
    - https://www.wikidata.org/wiki/Q860755
    - https://www.wikidata.org/wiki/Q230768
tags:
- Art
- AI
- ArtHistory
- UnknownArtist
- AgenticCoding
---

Gestern Abend konnten zwei Werke mit bisher unbekannter Künstlerzuordnung identifiziert werden....
<!--more-->

Diesmal mit Hilfe von KI. Grundsätzlich hat bei beiden geholfen, dass ich (sofern vorhanden) neben einem Foto der Grafik auch immer eine Großaufnahme der Signatur einem Beitrag hinzugefügt habe.

## Gefunden

* Ein [Holzschnitt von Juan Castells Martí (1906-1980)](/post/print-unknown-6/)
* Eine [Zeichnung von Hartmut Eing (1938-2021)](/post/drawing-art-brut/)

Beide Zuschreibungen stammen von der KI der Google-Bildersuche. Die erledigt solche Aufgaben übrigens deutlich besser als Gemini, das ist von alleine leider [nicht in der Lage mit der Google Bildersuche zu interagieren](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/grounding/grounding-with-google-search). Beide Ergebnisse wurden visuell bestätigt.
Versuche, andere Modelle direkt dazu zu bringen, die Google-Bildersuche zu nutzen, sind an einem Bot-Schutz gescheitert. Allerdings hat es DeepSeek V4.1 Flash 1017 in Verbindung mit [Omkarcloud Camoufox scraper](https://github.com/omkarcloud/google-scraper) geschafft beide Namen als jeweils ersten Kandidaten zu finden.

## Weitere Versuche

Übrigens gab es auch bei anderen Bildern Vorschläge, die aber einer Überprüfung der Signaturen nicht standhielten, sofern sie überhaupt zu genügend Referenzmaterialien führten. Die interessantesten Beispiele sind:

* [Siebdruck einer Glühbirne](/post/print-unknown-1): Könnte von Helga Jahnke (1939-2024) sein - aber die Signaturen und der Stil (der im Netz verfügbaren) Bilder stimmen nicht überein.
* [Holzschnitt "Am Hang"](/post/print-unknown-3): Hier ist der Künstler zwar dem Namen nach bekannt, aber nicht mehr. Ein Lehrer mit diesem Namen wurde in Danzig identifiziert, allerdings sind keine Vergleichswerke bekannt:
  * Im [Danziger Adressbuch von 1914](https://pbc.gda.pl/Content/3703/Od_714_8_1914.pdf#page=591) ist unter "Winkelmann" an der Adresse Am Holzraum 20 "Josef, Lehrer" aufgeführt. Auch die [Karlsbad-Gästeverzeichnisse für 1913](https://data.onb.ac.at/ANNO/clk19130612?seite=1) und [1914](https://data.onb.ac.at/ANNO/clk19140615?seite=4) weisen ihn als Lehrer aus Danzig aus.
  * Das [Danziger Adressbuch von 1939](https://books.google.com/books?id=pUnxVraz7o0C&dq=%22Winkelmann%22+%22Am+Holzraum%22+%22Lehrer%22) führt in derselben Straße einen Oberlehrer namens "Winkelmann, Jos." auf.

Beide Ergebnisse wurden von GPT-6.2 Sol (max) für jeweils ca. 5$ geliefert.

## Nächste Schritte

Da sich der Bot-Schutz der Google-Bildersuche automatisiert überwinden lässt, ist es möglich, die Suche nach visuell ähnlichen Kandidaten durch einen Agenten durchführen zu lassen, inklusive einer groben Klassifikation (Kandidaten mit Signaturen). Diese Klassifikation könnte dann wiederum genutzt werden, um weitere Recherchen zu Techniken, Stilen und Vergleichsmaterialien zu ermöglichen. ggf. sind so auch direkte Vergleiche von Signaturen möglich. All das könnte in einem allgemeinen Skill für diese Aufgabe münden.

Beim Warten auf den Zug heute Morgen sah ich dann noch einen sehr vergleichbaren Ansatz bei Heise Online: [KI ermittelt in 22 Minuten den unbekannten Zeichner eines Skizzenbuchs von 1808](https://www.heise.de/news/KI-ermittelt-in-22-Minuten-den-unbekannten-Zeichner-eines-Skizzenbuchs-von-1808-11537049.html).
