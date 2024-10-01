---
date: 2023-11-09T19:22:44+02:00
title: "911TV gestartet"
preview:
  image: screenshot.png
  hide: true
tags:
- Website
- HybridMedia
- Archives
draft: true
---

Eine alte Idee von mir ist nun um gesetzt:

<!--more-->

# Der 11.9.2001 im Fernsehen

Die ursprüngliche Idee war die Inhalte "physisch" zu präsentieren, also in Form eines Sessels und eines Fernsehers in einem ansonsten leeren Raum, um die Immersion zu verstärken. Allerdings hätte das nur eine temporäre Umsetzung werden können und hätte auch einige (interessante) technische Spielereien erfordert, daher ist das Projekt nun als [Webseite](https://911tv.projektemacher.org/) realisiert.

{{< zoom-link link="https://911tv.projektemacher.org/" title="911TV" >}}
    {{< figure src="screenshot.png" alt="Screenshot 911TV" class="post-image" >}}
{{< /zoom-link >}}

# Warum?

Der [11. September 2001](https://en.wikipedia.org/wiki/September_11_attacks) war ein nicht nur ein beispielloser Terroranschlag, sondern auch ein besonderes Medienereignis. Ikonisch sind natürlich die Bilder geworden, aber auch die Dichte an (Teil-) Ereignissen und Länge, vermittelt durch die Live-Berichterstattung im Fernsehen waren ohne Beispiel.

Ich kann mich noch an diesen und die darauffolgenden Tage erinnern, wie sich das Ereignis entwickelte: Zuerst "nur" ein Laufband zu einem spektakulären Unglück...
Und die weiteren Entwicklungen führten dann dazu, dass sich immer mehr Sender dem Thema annahmen und mit Sondersendungen begleiteten.

Die [Auswirkungen des Ereignisses](https://en.wikipedia.org/wiki/September_11_attacks#Aftermath) sind vielfältig. Neben den bekannten weltpolitischen, kulturellen gibt es auch soziale wie die [Truther-Bewegung](https://en.wikipedia.org/wiki/9/11_truth_movement), die sicher auch durch Wiedersprüche und Gerüchte im Rahmen der Live-Berichterstattung begünstigt wurde.

Natürlich ist es heute nicht mehr möglich die Rezeptionssituation des 11.9.2001 herzustellen, alleine schon, weil heute bekannt ist, was passiert und wie es ausgeht. Aber diese Seite soll zumindest der Versuch sein, diese nachzustellen und so die Immersion zu erleben.

# Wie?

Das Internet Archiv hat 2007 das [September 11 Television Archive](https://archive.org/details/sept_11_tv_archive) eingerichtet, eine Sammlung von TV-Sendungen von 20 Kanälen über 7 Tage, insgesamt ca. 3000 Stunden Material. Auch wenn es sich hauptsächlich um US-amerikanische Sender handelt, sind auch einige internationale Kanäle wie [BBC](https://en.wikipedia.org/wiki/BBC), [NTV](https://en.wikipedia.org/wiki/NTV_(Russia)), [TV Azteca](https://en.wikipedia.org/wiki/TV_Azteca) [MCM](https://en.wikipedia.org/wiki/MCM_(TV_channel)) und [CCTV-3](https://en.wikipedia.org/wiki/CCTV-3) dabei.

Dazu gibt es eine [Tagesansicht](https://archive.org/details/911), die wie ein [EPG](https://en.wikipedia.org/wiki/Electronic_program_guide) aufgemacht ist, diese erlaubt zwar einen guten Überblick, verhindert aber leider auch die Immersion, da sie eine konstante Interaktion erzwingt.

Daher fasst diese Webseite die Videos zusammen und präsentiert sie in einer sehr reduzierten Oberfläche.

Entgegen aktueller Mediennutzungsgewohnheiten verläuft das Fernsehprogramm linear, man kann aber die Kanäle wechseln.
Schlüsselereignisse lassen sich als Teletexttafel einblenden. Ebenfalls kann der Teletext deaktiviert werden und der "Fernseher" im Vollbildmodus anzeigen. Das Laden der Teletexttafeln kann etwas dauern.
Bei Fehlern, wie längeren Ladezeiten oder fehlende Aufzeichnungen, kommt es zu einer Bildstörung. Diese tritt auch auf, wenn man versucht den Fernseher auszuschalten.

Dies erlaubt auch die Präsentation auf einem Röhrenbildschirm, z.B. im Rahmen einer Installation.

## Technische Realisierung

Die Seite ist als [React](https://react.dev/), also JavaScript Anwendung realisiert, die zusätzlichen Abhängigkeiten sind auf der Seite dokumentiert. Um die Nutzerschnittstelle so weit wie möglich zu reduzieren, sind die Interaktionsmöglichkeiten mit dem Bildschirmtext auf Tastatureingaben beschränkt.
