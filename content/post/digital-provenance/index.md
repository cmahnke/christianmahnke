---
date: 2025-03-16T22:33:44+02:00
title: "Digitale Provenienz für digitalisiertes Kulturgut"
keywords: CAI, C2PA
description: "Digital signierte Digitalisate"
cite: true
tags:
  - DigitalImages
  - ProjectIdea
  - CulturalPolicy
  - DigitalLibrary
  - Digitisation
wikidata:
  - https://www.wikidata.org/wiki/Q118496507
  - https://www.wikidata.org/wiki/Q628106
---

Wie kann man Authentizität digitalisierten Kulturgutes gewährleisten?
<!--more-->

In Zeiten, in denen die Generierung von Bildern durch Künstliche Intelligenz immer besser wird - während gleichzeitig mit manipulierten Bildern versucht wird, die Öffentliche Meinung zu beeinflussen - muss man sich die Frage stellen, wie man ein grundlegendes Vertrauen in die Authentizität digitalen Kulturgutes schaffen, aufrechterhalten und dies auch technisch unterstützen  kann.
Die dafür notwendige, maschinenlesbare und im Idealfall revisionssichere Dokumentation von Prozessschritten, den involvierten Akteuren (egal, ob menschlich oder maschinell) ist hier mit digitaler Provenienz gemeint.

# Ausgangslage
Eine institutionalisierte Digitalisierung von Drucken wird in Deutschland seit ca. 2000 durchgeführt. Anfangs in zwei "Leuchtturmprojekten", dem MDZ in München und dem GDZ in Göttingen. Ursprünglich ein relativ "nischiges" Unterfangen, wurde das Programm jedoch schnell der breiteren (Fach-)Öffentlichkeit bekannt und zunehmend nachgefragt.

Inzwischen digitalisieren viele Kultureinrichtungen ihre Werke und stellen sie online zur Verfügung. Die DFG erwartet für eine Förderung solcher Projekte, dass sich die Einrichtungen an gewisse Anforderungen, die [DFG-Praxisregeln](https://zenodo.org/records/7435724), halten. Diese werden ab und zu überarbeitet, um z. B. technische Neuerungen oder Rahmenbedingungen berücksichtigen zu können.

Eine dieser Neuerungen war z. B. die Verfügbarmachung der Digitalisate unter einer Creative Commons Lizenz, die je nach Ausgestaltung auch die Bearbeitung des Nutzungsdigitalisats von dem Werk erlaubt. Dies ist eine wichtige Errungenschaft der letzten Jahre, da damit auch ein Wandel im Verständnis der Eigentümerschaft kultureller Artefakte einher ging. : Viele Institutionen eigene (teilweise auch restriktivere) Vorgaben zur Nachnutzung der Digitalisate auf.

Letztlich und realistisch betrachtet bieten im Zeitalter der Digitalisierung rechtliche Mittel, konkret lizenzrechtliche Beschränkungen, schließlich wenig Abschreckungspotential gegenüber Manipulationen mit schlechten Intentionen, während sie legitime Nachnutzung massiv einschränken würden.
Die umfangreichen Möglichkeiten, die Bildbearbeitung mittels Künstlicher Intelligenz bieten, bringen aber auch Probleme mit sich, nicht zuletzt in Hinblick auf die Integrität und Authentizität, gerade von Bildwerken, im Kontext verzerrender und irreführender vermeintlicher "Nachrichten", vor allem auf Social Media.

# Gibt es ein Problem?
Damit komme ich zu dem Problem, dass das Vertrauen in öffentliche Wissenschafts- und Kultureinrichtungen schwindet: Viele Einrichtungen bekommen dies in Form sinkender Nutzerzahlen und  expliziten Misstrauens mehr und mehr zu spüren. Verbände und Vertretungen stellen in Jahrestagungen das Thema Vertrauen mit Zusätzen wie "...in die Wissenschaft" oder – inzwischen beliebter –  gleich "...in die Demokratie" regelmäßig in den Vordergrund.
Man fragt sich, wie man vor diesem Hintergrund zumindest das Vertrauen in die Prozesskette von der physischen Vorlage in das Portal einer Einrichtung und auch darüber hinaus nachvollziehbar gestalten könnte.

# Lösungsansatz
Da dieser Anwendungsfall natürlich nicht nur für Digitalisate, sondern z. B. auch für Pressefotografien und digitale Kunst relevant ist, gibt es bereits eine technische Lösung:

Die [Content Authenticity Initiative (CAI)](https://contentauthenticity.org/) ist eine 2019 gegründete Initiative, die Technologien zur Überprüfung der Provenienz digitaler Inhalte entwickelt. Die Initiative arbeitet eng mit der [Coalition for Content Provenance and Authenticity (C2PA)](https://c2pa.org/) zusammen und bietet Open Source-Implementierungen der entsprechenden Spezifikation an. Letztlich handelt es sich um eine kryptografisch abgesicherte Aussage über die Herkunft eines digitalen Bildes und die verschiedenen Bearbeitungsschritte an diesem. Diese wird in den Metadaten der Bilddatei hinterlegt und lässt sich somit direkt anhand desselben überprüfen – also ohne dass z.B. ein Erschließungssystem bzw. Prozessdokumentation aus einem Langzeitarchivierungssystem hinzugezogen werden muss. Das hat den Vorteil, das nachträgliche Änderungen einzig auf Basis der ausgelieferte Bilddatei zu erkennen sind.

Im Detail bedeutet das, dass eine Anpassung in den jeweils angewendeten Digitalisierungs-Workflows und der involvierten Werkzeuge notwendig ist. Dazu kommt die neue Anforderung, eine Infrastruktur zur Signierung zur Verfügung zu stellen.  Letzteres könnte auch zentralisiert erfolgen.

Auch wenn derzeit noch die Unterstützung meist nicht für die komplette Kette (also bis in den Browser) reicht und Derivate (also z. B. über IIIF bereitgestellte Kacheln) noch nicht berücksichtigt oder spezifiziert sind, ist davon auszugehen, dass sich das in Zukunft ändert.

Da die DFG auch weiterhin Digitalisierungsprogramme fördert und mit ihren Praxisregeln oft auch eine Vorbildfunktion hat,Daher sollte die DFGsie in der nächsten Version der Praxisregeln darüber nachdenken, diese Mechanismen zuerst als optional vorzusehen, auch um Innovation in diese Richtung zu forcieren.

Und wenn man eine entsprechende Infrastruktur für Digitalisate aufbaut, kann man auch gleich eh schon dabei ist, kann man sicher auch born-digital Material in Repositorien institutionell signieren...  

# Update 2.4.2025

Dieser Artikel wurde auch von [Archivalia verlinkt](https://archivalia.hypotheses.org/226296).

{{< related >}}
Potentielle Ergänzungen zu den DFG-Praxisregeln werden auch in dem [Artikel über Mikroformendigitalsierung](/post/stop-microfilm-digitisation) thematisiert.
{{< /related >}}
