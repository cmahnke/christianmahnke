---
date: 2023-01-01T20:14:44+02:00
title: "Kartenmaterial für Projektemacher Blogs"
tags:
- Projektemacher.org
- Geodata
---

Ein weiterer Beitrag aus [Projektemacher Labs](https://labs.projektemacher.org/):
<!--more-->

# Vorbereitungen

Bevor Beiträge auf Karten angezeigt werden können, müssen folgende Schritte erlegdigt sein:
* Geokodierung von Beiträgen und / oder Tags
* Generierung einer anwendungsspezifischen Repräsentation (GeoJSON, KML)

Erst danach kann das auf einer Karte visualisiert werden.

Ein Beispiel für die [alten 3D Bilder](https://vintagereality.projektemacher.org/) ist [hier](https://vintagereality.projektemacher.org/map//post/map.geojson) zu finden.

# Anzeige im Browser

Um die generierten Daten im Browser anzuzeigen, kann das von [OpenStreetMap](https://www.openstreetmap.org/) bereitgestellte Kartenmaterial verwendet werden. Dabei übernimmt ein externer Server die Erzeugung der Bilddaten.

Hier als Beispiel die Darstellung der Orte der 3D Bilder auf einer Karte:

{{< html/iframe-consent >}}
    {{< maps/osm src="/post/maps/map.geojson" >}}
{{< /html/iframe-consent >}}

**Update**: Das Beispiel zeigt Posts für [VintageReality](https://vintagereality.projektemacher.org/).

# Ausblick

Nun fehlt nur noch der letzte Schritt, eigenes Kartenmaterial erzeugen um unabhängig von externen Diensten zu sein und auch mehr Gestaltungsspielraum zu haben...

# Nachträge:
* **1.7.2023**: [Vektor Kartenmaterial mit GitHub bauen](/post/build-vector-tiles-on-github/)
* **14.11.2023**: [Backsteinexpressionismus: Karte hinzugefügt](https://backsteinexpressionismus.projektemacher.org/lists/#karte)
* **21.3.2024**: [Kleiderbügel: Karte hinzugefügt](https://xn--kleiderbgel-0hb.xn--blaufusstlpel-qmb.de/map/)
* **14.3.2025**: [Never Built Göttingen: Karte basierend auf selbst generiertem Material](https://never-built.goettingen.xyz/map/)
