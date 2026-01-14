---
date: 2026-01-14T19:52:22+02:00
title: 'Metadaten für Software'
description: "Software-Metadaten für die (automatische) Nachnutzung von Funktionionalitäten"
cite: true
tags:
- SoftwareDevelopment
- Metadata
- ProjectIdea
- KI
wikidata:
  - https://www.wikidata.org/wiki/Q5205836
  - https://www.wikidata.org/wiki/Q1142726
---

Teil 2 über Software-Metadaten.

<!--more-->

Während es im [ersten Teil](/post/hugo-cff-codemeta/) um die Einbindung von Metadaten zu Softwareprojekten ging, sollen nun mögliche Vorteile und Perspektiven beleuchtet werden. Diesmal soll es nicht um die Sichtbarkeit der Autoren (durch Zitation), sondern um die Sichtbarkeit des jeweiligen Produkts bzw. des Codes und deren Nachnutzung gehen.

Vor ungefähr einem Jahr habe ich bereits einen Beitrag über meine [Erfahrungen](/post/academic-software-publishing) mit der Integration von Softwareartefakten in die eigene Umgebung veröffentlicht. Während ich mich damals auf technische Herausforderungen wie Skalierbarkeit, Portabilität usw. beschränkt habe, war das nicht alles. Zu der beschriebenen Zeit ging es auch um maschinenlesbare Metadaten. Damals war gerade [DAOP](https://en.wikipedia.org/wiki/DOAP) "modern" (und ist es in einigen Communities bis heute).

Bis heute gibt es jedoch keine Suchmaschine, die beispielsweise Projekte von unterschiedlich großen Code-Plattformen aggregiert und eine facettierte Suche über die jeweiligen Metadaten ermöglicht, um zielgerichtet eine Implementierung für ein spezialisiertes Problem zu finden.

## Aber was könnte man damit machen, wenn es anders wäre?

Und wenn man solche Metadaten hat, kann man diese natürlich indexieren und danach suchen. Letzteres kann man sich ungefähr wie die Schlagwortsuche bei GitHub vorstellen. Es wäre ein großer Gewinn, wenn GitLab (sowohl zentral als auch eigene Instanzen), Codeberg, Gitea und andere vergleichbare Plattformen und Tools entsprechende Daten zur Indexierung bereitstellen würden.

Noch spannender wird es, wenn man Agenten dazu bringen kann, auf Basis von Metadaten Komponenten zusammenzustecken. 
Ein konstruiertes Beispiel, das sich an einem vergangenen [Beitrag](/post/vintagereality-ai/) orientiert, wäre das folgende:
* Man instruiert einen Agenten, aus einer digitalen Sammlung eines Museums Stereogramme herauszusuchen. Diese müssten dafür natürlich als solche identifizierbar sein, dabei können auch Metadaten wie in diesem [Beitrag](/post/linkedart-metadata/) helfen (beisielsweise durch Suche nach [http://vocab.getty.edu/aat/300127197](http://vocab.getty.edu/aat/300127197.json)).
* Dafür soll eine Segmentierungsmethode gesucht werden. Idealerweise vergleicht der Agent dazu die Metadaten der Eingangsmenge zum Medientyp mit denen von möglichen Implementierungen. Diese könnten mit [https://www.wikidata.org/wiki/Q35158](https://www.wikidata.org/wiki/Q35158) und [https://www.wikidata.org/wiki/Q56933](https://www.wikidata.org/wiki/Q56933) markiert sein, um die Funktionalität grob (ohne Verhältnis zueinander) mit den Anforderungen zu vergleichen.
* Die gefundenen Implementierungen werden auf das Material angewendet und die Ergebnisse dem Auftraggeber zurückgegeben.

Dabei ist das "Zusammenstecken" eher das langfristige Ziel; im ersten Schritt würde man auf diesem Wege vermutlich erst einmal Agenten benutzen, um Trainingsdaten zusammenzustellen.

Dafür fehlen jedoch noch normierte Schlagworte bzw. spezifisches kontrolliertes Vokabular. Da das Feld sehr dynamisch ist, wird es sicher auf eine Mischung aus beidem hinauslaufen, um auch nischigere Nutzungsszenarien abbilden zu können.
