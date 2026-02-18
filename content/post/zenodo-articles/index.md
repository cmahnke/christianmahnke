---
date: 2026-02-18T19:22:44+02:00
title: "Blog Beiträge bei Zenodo"
cite: true
draft: true
tags:
  - Blog
  - Archive
---

Aufwendigere Blogbeiträge werden nun auch auf Zenodo veröffentlicht...
<!--more-->

...nachdem Exerimente seitens der DNB zur Webarchivierung meiner Blogs Anfang 2024 nicht erfolgreich waren und die Limits des Internetarchivs in letzter Zeit immer weiter reduziert wurden, sodass die Archivierung dieses Blogs (und der verlinkten Seiten) nicht mehr zuverlässig funktioniert, werden nun ausgewählte Beiträge als PDF auf Zenodo veröffentlicht.

Die technische Umsetzung nutzt [Vivliostyle](https://vivliostyle.org/) für die Erzeugung der einzelnen PDFs und das Python-Modul [`zenodo-client`](https://github.com/cthoyt/zenodo-client) um die PDFs hochzuladen.

Für die Metadatenmodellierung habe ich mich am Artikel ["Making your blog FAIR"](https://drmowinckels.io/blog/2024/fair-blog/) von Athanasia Mo Mowinckel orientiert.

## Technische Umsetzung

Für die Umsetzung wurde ein eigenes Hugo-Ausgabeformat für die PDF-Generierung definiert. Der einzige Unterschied besteht darin, ein angepasstes CSS für HTML bereitzustellen. Die erzeugten Ausgabedaten werden dann mit einem einfachen Skript im Ausgabeverzeichnis gesucht und an Vivliostyle übergeben, um daraus PDFs zu generieren.
Im nächsten Schritt werden die entstandenen Dateien dann mit den Metadaten der jeweiligen Blogbeiträge abgeglichen.
