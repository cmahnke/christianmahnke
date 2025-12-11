---
date: 2025-12-10T18:33:44+02:00
title: "Papiertiger CSS für den Druck"
description: "Eine Polemik über CSS für den Druck"
keywords: PDF, VivlioStyle, CSS, PrinceCSS, XSL-FO
cite: true
tags:
  - CSS
  - Printing
  - JavaScript
wikidata:
  - https://www.wikidata.org/wiki/Q46441
  - https://www.wikidata.org/wiki/Q42332
  - https://www.wikidata.org/wiki/Q24415127
  - https://www.wikidata.org/wiki/Q32087
---

Ich beschäftige mich immer mal wieder "nebenbei" mit Cross-Media-Publishing...
<!--more-->

Sogar beruflich haben sich da einige Projekte ergeben:
* 2004-2006: **The Rise of Modern Constitutionalism, 1776-1849**
  Im Rahmen des Projektes wurde ein Workflow entwickelt und implementiert, der aus Word Dateien mit einen themespezifischen Dokumwentvorlagen TEI erstellt, dass dann in weitere Präsentationsformate (inklusive einer Buchserie) umgewandelt wurde.

* 2014: **OUS-Print**
  Aus dem lokalen Bibliotheksystem wurden Bestellzettel / Begleitscheine erstellt: Text wird mittels XSL-FO zu PDF. Vorlagen können in Open Office bearbeitet werden. Dazu gibt es noch eine [alte Präsentation](https://subugoe.github.io/ous-print/slides.xhtml).

Nun habe ich versucht aus dem Kleiderbügel-Blog einen Katalog zu erstellen und war überrascht wie wenig weit aktuelle Technologien im letzten Jahrzent gekommen sind. Sicher, der Bedarf an aufwendig gestaltetn Druckerzeugnissen hat in den letzten Jahren sicher nicht unbedingt zugenommen. Aber ich hatte gehofft, das alte XML Technologien wie XSL-FO zumindest eingermaßen ersetzt wurden.

## CSS für den Druck

Daher lag es nahe, zu untersuchen, was heutige Webtechnologien in diesem Bereich bieten. Im Netz gibt es eine kleine Gruppe von Enthusiasten und Anbietern, die CSS für den Druck propagieren.

Sie werben mit ansprechend gestalteten Ergebnissen ihrer Arbeit. Grundsätzlich ist die Idee sehr gut, denn die Möglichkeiten von CSS müssen sich heutzutage nicht hinter denen einer DTP-Software verstecken. Dafür existieren auch eigene CSS-Module:
* hauptsächlich das [CSS Paged Media Module Level 3](https://www.w3.org/TR/css-page-3/):
  * [aktuelle Variante](https://drafts.csswg.org/css-page/) mit dem Status "Editor’s Draft"
* ergänzt durch das [CSS Generated Content Module Level 3](https://drafts.csswg.org/css-content-3/)

Nach der anfänglichen Euphorie fällt jedoch schnell die erste große Lücke auf:
Die (restlichen) großen Browser unterstützen die möglichen Features nur bedingt. Besonders der Mangel an den folgenden Funktionalitäten fällt auf:
* Querverweise, z. B. für die Erstellung von Inhaltsverzeichnissen
* Fußnoten
* druckspezifische Gestaltungselemente wie Füllzeichen (`leader`)

**Würden die Browser diese Funktionen unterstützen, wäre dieser Artikel vermutlich nun vorbei...**

Aber sie tun es nicht. Trotzdem gibt es keinen Grund zu verzagen, denn es gibt eigene Implementierungen, sowohl Open-Source als auch kommerzielle. Eine Übersicht bietet [print-css.rocks](https://print-css.rocks/). Die Seite bietet umfangreiche Komptibilitätstests, sowie Bewertungen und Einordnungen.

Grundsätzlich lassen sich die Implementierungen nach zwei Funktionsweisen unterscheiden:
* Browserbasiert: Steuern eine existierende Browser-Implementierung (meist Chromium) fern und implementieren die fehlenden CSS-Features als Polyfills. Sie sind sozusagen die Enkel von [wkhtmltopdf](https://wkhtmltopdf.org/).
* Eigene CSS-Implementierung: Hierbei wird ein (meist selbstgeschriebener) HTML/CSS-Renderer verwendet.

Der erste Ansatz hat den Charme, dass er die Ausführung von JavaScript ohne größere Probleme ermöglicht. Dadurch ist auch die Nachnutzung von dynamisch erzeugten Abbildungen, wie beispielsweise Diagrammen oder Karten, möglich.

Da der Markt recht fragmentiert ist und die begrenzten Ressourcen somit verteilt sind, haben nicht alle den gleichen Grad an Standardkonformität. Das heißt im Endeffekt, dass man sich nicht an einem Standard orientiert, sondern an der kleinsten gemeinsamen Untermenge, die von jedem unterstützt wird. Die Alternative ist, sich an eine konkrete Implementierung zu binden.

Dabei hilft es auch nicht, dass einige der Prozessoren gleich noch herstellerspezifische CSS-Erweiterungen mitbringen.

## Sind die Implementierungen das einzige Problem?

Die tatsächlichen Probleme scheinen jedoch woanders zu liegen:
Das, was derzeit als CSS für den Druck bezeichnet wird, ist in weiten Teilen unterambitioniert, zumindest wenn es um gebundene Meterialien geht: Das Ziel scheint primär das Layout einzelner (Form-)Blätter, wie beispielsweise Rechnungen oder Werbebriefe zu sein. Es existieren auch komplexere Beispiele, wie (wissenschaftliche) Paper oder auch technische Dokumentationen als Buch, aber auch hier muss man sich die Frage stellen, ob diese dann nicht eher für das Lesen als PDF am Bildschirm gedacht sind.

Sicher, das wird den größten Teil der Anwendungsfälle ausmachen. Wer mehr will, kann ja eine DTP Software, wie beispielsweise InDesign, verwenden.

**Aber ist das wirklich ein Anspruch, mit dem sich eine Community für offene Standards zufriedengeben sollte?**

Grundsätzlich wäre es wünschenswert, wenn die kreative Freiheit, die CSS Web-Designern und -Entwicklern bietet, auch im Druckbereich verfügbar wäre. Und zwar nicht nur für Loseblattsammlungen.

### Oder ist es die Spezifikation?

Ein Gefühl das einen bei CSS häufiger beschleicht, stellt sich auch hier ein: "Ease-of-Implementation" scheint wichtiger zu sein als "Ease-of-Use" oder gar "Feature-Completeness".

Viele der unter "Was fehlt?" genannten Funktionalitäten werden schnell offensichtlich, wenn man sich mit der Erzeugung von Büchern (oder komplexeren Broschüren) beschäftigt. Ein Teil davon findet sich sogar bei der W3C in der [Liste der für paginierte Medien erforderlichen CSS-Funktionen](https://www.w3.org/Style/2013/paged-media-tasks), trotzdem sind sie nie Teil der Spezifikation geworden. Dieser Teil wäre sicher im Rahmen des [CSS rigions Moduls](https://www.w3.org/TR/css-regions-1/) gelöst worden, aber auch dieses wurde [nie umgesetzt](https://caniuse.com/css-regions).


## Was fehlt?
Ein wichtiges Ziel (also neben der Darstellung) von CSS für den Druck sollte darin bestehen, die benötigte Vorverarbeitung zu reduzieren. In meinem Fall waren dies:

* Fußnoten: Es ist etwas begrenzt, einfach nur fixe Bereiche für einen Seitentyp anzugeben. Wünschenswert wäre auch die Möglichkeit, einen bestehenden Container zu spezifizieren. Hierfür könnte auch das Modul für generierte Inhalte genutzt werden.
* Bindungskante: Die Bindungskante ist für Druckwerke ab einem gewissen Umfang unerlässlich. Daher sollte sie analog zu Media Queries für Quer- und Hochformat unterstützt werden. Also inklusive darin enthaltener Selektoren.
* Überlauf in andere Container: Das Modul für generierte Inhalte sollte in der Lage sein, den Überlauf (`overflow`) eines anderen Containers zu "fangen".

Darüber hinaus sind weitere Verbesserungen denkbar:
* Derzeit sind die Seitenränder in [fixe Zonen unterteilt](https://www.w3.org/TR/css-page-3/#margin-boxes). Das sollte änderbar sein.
* Besonders Effekte müssen definiert werden, z. B. als Schwarzliste (also das, was nicht funktionieren sollte). Ein Beispiel ist `text-shadow`. Hier kann die Grundregel lauten, dass alles, was in SVG oder modernem PDF möglich ist (machen wir uns nichts vor, meistens gibt es vor dem Druck ein weiteres Zwischenformat), auch druckbar sein sollte. Keine valide Grundregel wäre: "Das sind GPU-Effekte und können daher nicht gedruckt werden", weil dies ein Implementierungsdetail ist. Notfalls erfindet man eine `raster`-Eigenschaft.

Dazu kommen Ergänzungen, von denen auch CSS im Browser profitieren würde, wie z.B. Text, der sich auf die Größe des Containers anpasst.

Bis dahin sollte man vorsichtiger sein, wenn man behauptet, dass CSS wirklich druckreif ist, da man sonst den Eindruck erweckt, es sei so einfach wie die Darstellung im Browser, unabhängig vom gewünschten Druckprodukt.

## Ein möglicher (Aus-)Weg

Wenn davon auszugehen ist, dass Browserhersteller CSS für den Druck nicht voll unterstützen, muss man bei der Definition eines Standards auch keine große Rücksicht nehmen. Im Gegenteil: Das sollte den Prozess eher beflügeln, da es die Beschränkungen reduziert. Man könnte sogar leicht polemisch verlangen, dass Browserhersteller erst einmal die bestehenden Spezifikationen umsetzen müssten, um ein Mitspracherecht zu erhalten – sozusagen als Beweis dafür, dass sie Stakeholder sind.
Gerade vor diesem Hintergrund sollten auch die eher kleineren Hersteller und Projekte, die Prozessoren erstellen, sich nicht ausbremsen lassen.

Und dann sollte auch der Umfang der zu erstellenden Spezifikation klar gemacht werden, also die Arten von Dokumenten, die mit ihrer Hilfe erstellt werden können sollten.
Dazu gehört übrigens auch sich explizit zu Vergegenwärtigen, dass es nicht nur um die Erstellung von PDF geht, sondern um gedruckte Informationen auf Papier: "Druck" ist ein sehr weites Feld. Manchmal möchte man mehr als nur die Vorstufe von Altpapier erstellen.

Wenn mehrere Hersteller eigene CSS-Erweiterungen mitbringen, die das gleiche Ergebnis erzielen, dann ist bei der Spezifikation etwas schiefgelaufen. Sonst wäre der jeweilige Anwendungsfall berücksichtigt worden.
Hier kann es ggf. auch helfen, ein Ende zu finden. Vielleicht würde es schon einige Probleme lösen, wenn man mit einem "CSS Paged Media Module Level 4" beginnt.

Letzendlich ist zu prüfen, ob mit der bestehenden Spezifikation alles erreicht werden kann, dass sich mit XSL-FO 1.1 erledigen ließe, falls nicht, zurück ans Zeichenbrett. Ein Migrationspfad zu offerieren würde zeigen, dass die Autoren es Ernst meinen...

Und vor diesem Hintergrund sollte man ggf. darüber nachdenken den bestehenden Standartierungspfad verlassen und eher seine Mühen in einen eigenen Weg stecken, ein (inaktives) Beispiel für eine solche Initiative ist [CSS Books](https://books.idea.whatwg.org/).

## Fazit

CSS für den Druck ist in Teilen ein Papiertiger: Es funktioniert für einfache, ungebundene Dokumente. Mit der Größe bzw. dem Umfang eines Projekts steigt jedoch der Aufwand in der Vorverarbeitung massiv an. (Teilweise so sehr, dass man sich daran erinnert, dass sich Inkscape mit Python scripten lässt.) Derzeit ist bei der Spezifikation kein großer Wurf erkennbar und die großen Browserhersteller zeigen kein erkennbares Interesse, die Situation zu verbessern.

Wer Ideen braucht, wie man es besser machen könnte, kann diese (ironischerweise) bei der W3C nachlesen.

## Dank

* An Andreas Jung, der die Seite [print-css.rocks](https://print-css.rocks/) aufgebaut hat, die eine wertvolle Informationsquelle war.
* Dem Team von [Vivliostyle](https://vivliostyle.org/), das meinen Anforderungen am nächsten gekommen ist und ich deshalb nutze.
