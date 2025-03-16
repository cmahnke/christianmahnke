---
date: 2025-02-25T15:52:22+02:00
title: 'KI und Software-"Entwicklung"'
description: "Oder: Akademische Software-Verlage"
#keywords:
tags:
- SoftwareDevelopment
- ProjectIdea
- CulturalPolicy
- DigitalLibrary
---

Im letzten Jahr habe ich mich ab und zu mit KI beschäftigt, um meine Blogs mit zusätzlichen Features anzureichern und auch ihre Weiterentwicklung zu beschleunigen.
<!--more-->

Die meisten Beispiele liegen im Hintergrund, in den Scripten, die Dinge wie Bildnachbearbeitung, -optimierung und -transformation erledigen. Durch KI lassen sich Methoden relativ simpel in Python übersetzen und in den Workflow einbetten.

Das Alles erinnerte mich an eine Phase vor ca. 15 Jahren, während der ich beruflich an einem großen Forschungsprojekt zur optischen Zeichenerkennung involviert war. Damals war es für viele der direkt aus der Forschung stammenden Funktionalitäten neu diese miteinander "sprechen" zu lassen und das in einer Art, die dem Know-how der Anwenderzielgruppe entsprach.

Die Probleme waren vielfältig:
*	Kode, der "überoptimiert" war, z. B. C mit Inline Assembler
*	Kode, der gar nicht optimiert war, also z. B. performance-kritisch ist, aber in einer interpretierten Sprache geschrieben
*	Kode, der nicht skalierte, z. B. über mehr als eine CPU / Kern, nicht Thread-sicher ist usw.

Da es damals auch darum ging, die verschiedenen Implementierungen für die Massendigitalisierung zum Einsatz zu bringen, bestand aber eine Möglichkeit die verschiedenen State-of-the-art-Werkzeuge skalieren zu können und auch mit einheitlichen Schnittstellen auszustatten.

Die Lösung damals: Ein Generator der aus einer maschinenlesbaren Beschreibung der Kommandozeilenschnittstelle des entsprechenden Werkzeugs einen Webservice zaubert. Also einen zusätzlichen Overhead erzeugt, ohne strukturelle Probleme zu lösen...

Nach meinen jetzigen Erfahrungen (siehe oben) könnte eine elegantere Lösung darin bestehen, solche Algorithmen / Funktionsblöcke direkt aus der Forschung mittels KI in eine Form zu überführen, die einen Betrieb in einem Anwendungskontext vereinfacht bzw. optimiert.

Letztlich werden die Rahmenbedingungen Zusehens komplexer und diese von den Wissenschaftler*innen (mit-)erledigen zu lassen ist eher als Ressourcenverschwendung  zu sehen, da sich diese besser um die Implementierung der für sie konkreten Problemlösung kümmen sollten:
*	Betriebsumgebungen wie Docker / Kubernetes / Cloud
*	Anforderungen an Logging und Monitoring der Anwendung
*	Qualitätssicherung und Wartbarkeit (der Software selbst)
*	Metriken
*	Datenmanagement

Und das sind nur die mehr oder weniger technischen Anforderungen, dazu kommen noch viele weitere aus den Bereichen:
*	Sicherheit / Datenschutz
*	EU-Produkthaftungsrichtlinie
*	Usability
*	Dokumentation

Beide Listen sind nicht mal vollständig.

# Akademische Software-Verlage

Hier kann man sich ein (Geschäfts-)Modell vorstellen, dass analog zu den Uni-Verlagen für Publikationen ein Uni-Softwarepublisher institutionalisiert wird: Eine Einrichtung bzw. ein Kompetenzzentrum, das Problemlösungen aus der Forschung zu echten Produkten macht. Und auch wenn sich inzwischen viele dieser Anforderungen von KI-gestützten Methoden lösen lassen, ist dafür ein gewisses Know-how notwendig. Denn die Anforderungen sind nicht statisch, sie werden sich verändern und vor allem im Umfang erhöhen. Es wird also notwendig werden, Modelle zu trainieren, Standards, Vorschriften und Best-Practices zu verfolgen usw.

Und hier würde die Kompetenz des Uni-Softwarepublishers liegen!
Gleichzeitig wäre es auch denkbar, dass die Integration / Bereitstellung über eine Art Publikationspauschale mitfinanziert werden könnte und somit auch ein wirtschaftlicher Anreiz für einheitlichere Plattformen (technisch und organisatorisch) geschaffen wird.
