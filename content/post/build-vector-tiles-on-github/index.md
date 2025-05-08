---
date: 2023-07-01T20:14:44+02:00
title: "Vektor Kartenmaterial mit GitHub bauen"
class: toc-text
tags:
- Projektemacher.org
- Geodata
- GitHub
- Docker
---
Da die Nutzung von frei verfügbaren Kartendiensten sowohl eine [Kommunikation mit externen Diensten](/post/maps/) erfordert, als auch die Gestaltung eingeschränkt, war es Zeit für etwas eigenes...

<!--more-->
{{< toc >}}

## Vektorkacheln

Kartenmaterialien im Netz sind in der Regel in Kacheln (Tiles) nach Zoomstufe und Koordinaten  organisiert, um den Zugriff über ein URL Schema zu ermöglichen. Dabei ist das Format (Pixel oder Vektoren) erstmal unerheblich. Viewer wie OpenLayers oder Leaflet können mit beiden Formaten arbeiten.  
Das [Vektorformat](https://github.com/mapbox/vector-tile-spec/tree/master/2.1) hat dabei den Vorteil, dass es zur Laufzeit im Client in der Darstellung noch angepasst werden kann. Beispiele können die Dicke von Straßen, Farbe von Landflächen usw. sein, auch ist es möglich, ganze Layer einfach abzuschalten. Und das Ganze auch nach unterschiedlichen Zoomstufen.  
Für das Styling der Vektorkacheln existieren zwei verbreitete Konventionen:

* [Mapbox Styles](https://docs.mapbox.com/style-spec/guides/)  
* [MapLibre Styles](https://maplibre.org/maplibre-style-spec/)

Diese erlauben es, die Erstellung des Kartenmaterials von der geplanten Darstellung zu entkoppeln. Und das ist ein großer Vorteil, wenn man potentiell mehrere Blogs hat, die jeweils eine eigene Gestaltung haben und sich das auch im Kartenmaterial widerspiegeln soll.  
Um die Styles auf Vektorkacheln anzuwenden, existiert ein Plugin z.B. für [OpenLayers](https://github.com/openlayers/ol-mapbox-style).

## Planetiler

[Planetiler](https://github.com/onthegomap/planetiler) ist ein Werkzeug, um aus OpenStreetMap Daten Vektorkachel zu erzeugen, gegenüber anderen dieser Art hat es den Vorteil, direkt mit den Datendumps arbeiten zu können und nicht den Umweg über einen Datenbankimport nehmen zu müssen. Das bedeutet nicht nur weniger Transformationsprozesse, sondern auch eine höhere Effizient bei der Nutzung der zur Verfügung stehenden Ressourcen. Gleichzeitig sind die Konfigurationsoptionen sehr umfangreich. So können z.B. verschiedene Schichten (Layer) auch einfach ignoriert werden, Beispiele können Hausnummer, Sehenswürdigkeiten oder Luftverkehrswege sein.

## GitHub Runner vorbereiten

### Limitierungen

Da die OpenstreetMap Rohdaten sehr umfangreich sind, und der Prozess auch einiges an zusätzlichen temporären Daten braucht, wird ein (relativ) großer zusammenhängender Speicherbereich benötigt. Zwar sind die Standart GitHub Runner relativ gut ausgestattet, aber um viele Anwendungsfälle ohne zusätzlichen Aufwand bedienen zu können sind sehr viele Laufzeitumgebungen und Bibliotheken vorinstalliert. Zusätzlich ist die Verteilung zwischen virtuellen "Festplatten" (Mount-Punkten) für unsere Zwecke eher suboptimal...

**Dazu ist die Laufzeit eines Runners beschränkt: Nach spätestens 6 Stunden wird er beendet!**

### Ressourcen schaffen

Die Probleme mit dem verfügbaren Speicherplatz lassen sich aber zur Laufzeit des Runners mit Actions und ggf. eigenen Scripten lösen: Also Software löschen / deinstallieren und den Runner ein wenig umpartionieren. Dafür gibt es eine GitHub Aktion, [`maximize-build-space`](https://github.com/easimon/maximize-build-space).

Ggf. muss man aber die Repartionierung nach den eigenen Anforderungen gestalten. Das Verfahren ist aber immer ähnlich: Swap Bereich deaktivieren ([`swapoff`](https://linux.die.net/man/8/swapoff)), zu bearbeitende Bereiche aushängen ([`umount`](https://linux.die.net/man/8/umount)), entsprechende logische Volumes (ggf. inklusiver der Volume-Gruppe) löschen, eventuelle Loopback-Geräte löschen und ggf. neu anlegen. Dann ein neues logisches Volume (ggf. vorher eine Volume-Gruppe) erstellen...  
Es ist auch möglich, Dateien auf verschiedenen Volumes anzulegen, diese als Loopback-Geräte einzubinden und dann mittels [LVM](https://sourceware.org/lvm2/) zu einem logischen Speicherbereich zusammenzufassen.

Unabhängig vom gewünschten Speicherlayout muss am Ende noch ein neuer Swap-Bereich erstellt und aktiviert werden, da Planetiler mehr Arbeitsspeicher braucht, als der Runner bietet. Für den Bereich empfiehlt sich die Nutzung von `fallocate`, da so der maximal zur Verfügung stehende Platz vorher alloziert wird und damit vermieden wird, dass der Bereich wachsen können muss. Der zu erwartende Speicherbedarf lässt sich mit lokalen Experimenten ermitteln: Wenn man für Planetiler 4G braucht (Start mit `java -Xmx4g`), sollte der Swap Bereich auch entsprechend groß sein.

Wichtig ist allerdings zu beachten, dass nicht zu viel gelöscht wird: Falls man z.B. eine Laufzeitumgebung bis zu einer gewissen Stufe im Ablauf benötigt, kann diese natürlich nicht sofort gelöscht werden. Zusätzlich bietet es sich für Docker-Images an, diese gezielt zu löschen. Und man sollte nach Möglichkeit nicht einfach Programmdateien oder Verzeichnisse löschen, sondern die Deinstallation über das Paketmanagement erledigen, da dies dann in der Lage ist, auch nicht mehr benötigte Abhängigkeiten abzuräumen.

Um die verfügbare Laufzeit bestmöglich auszunutzen, ist es möglich, verschiedene Vorbereitungsschritte ebenfalls auszulagern bzw. in einem anderen Zusammenhang zu erledigen. Dies lässt sich erreichen, indem man ein Docker-Image erstellt, das nicht nur Planetiler enthält, sondern auch noch die unabhängig von der zu erstellenden Karte notwendigen [Daten](https://github.com/onthegomap/planetiler/blob/main/NOTICE.md#data), wie Grenzen, Küsten- / Wasserlinien und eventuelle zusätzliche Werkzeuge (s.u.).

## Eigene Kartenzuschnitte generieren

Da Planetiler (wie auch andere auf OpenStreetMap basierende Dienste) die Abzüge von [GeoFabrik](https://download.geofabrik.de/) benutzen, ist man initial auf die entsprechenden Zuschnitte (Länder, größere Verwaltungseinheiten, wie Bundesländer oder Provinzen) beschränkt. Das ist ggf. etwas weniger als wünschenswert wäre (Beispiele können Karten von Mitteleuropa oder historischen Gebietskörperschaften sein).  
In dem Fall muss man vor der Erstellung von Vektorkacheln erstmal das Eingangsmaterial vorbereiten. Auch das lässt sich natürlich auf einem Runner erledigen, knabbert aber an der zur Verfügung stehenden Zeit: So brauchen sowohl der Download als auch das Zusammenführen Zeit.  
Grob gesagt, sieht der Workflow dafür wie folgt aus:

1. Gewünschte Ausschnitte herunterladen, idealerweise überlappend  
   Osmium ist in der Lage Punkte zu deduzieren, Pfade bleiben aber abgeschnitten.   
2. Zusammenführen  
   Unter Umständen ist es ratsam, die Ausschnitte inkrementell zusammenzuführen, da man dadurch nach jeder Zusammenführung die Ausgangsdaten löschen kann.  
3. Beschneiden (optional)  
   Um eine kontinuierliche Qualität in einem Rechteck zu garantieren, empfiehlt es sich, das Eingangsmaterial zu beschneiden.

### Daten bereinigen

Zusätzlich können Daten auch noch vor der Verarbeitung bereinigt werden, so können z.B. die Gebäude aus den Dumps entfernt werden, das spart viel Zeit und Speicherplatz.  
Es ist auch möglich, einzelne oder Klassen von OSM-Tags vor der Verarbeitung zu entfernen. Als Faustregel lässt sich sagen, je kleiner das Ausgangsmaterial ist, um so schneller der Prozess. Allerdings ist die Zeit zum Filtern auch proportional zur Größe des Datendumps, daher lohnt es sich für Tags mit wenigen Vorkommen eher nicht. Hier kann man entweder experimentieren oder [OSM-Taginfo](https://taginfo.openstreetmap.org/) für eine Abschätzung verwenden. Da aber die Gebäudedaten mit Abstand den größten Anteil eines Dumps haben, lohnt sich die Entfernung derselben eigentlich immer (außer natürlich, sie sollen gezeigt werden, dann empfiehlt sich eine weitere Eingrenzung, z.B. auf denkmalgeschützte Gebäude).

Die folgenden Werkzeuge eignen sich zur Vorverarbeitung (Zusammenführen und filtern):

* [Osmium](https://osmcode.org/osmium-tool/)  
* [Osmfilter](https://wiki.openstreetmap.org/wiki/Osmfilter)


Auch lassen sich Zusammenführung und Bereinigung kombinieren, `osmium` kann auch Daten filtern, ist allerdings etwas langsamer.

## Erstellung der Kacheln

Wenn man die Daten für den gewünschten Kartenausschnitt vorbereitet hat, kann man sie an Planetiler übergeben.  
Da Planetiler die Kacheln in einer einzelnen Datei im [`mbtiles`](https://wiki.openstreetmap.org/wiki/MBTiles) Format speichert, kann diese, falls man noch etwas Laufzeit als Puffer hat, vor der Weiterverarbeitung auch gleich wieder extrahiert werden. Das kann z.B. das Python Script [`mbutil`](https://github.com/mapbox/mbutil).

## Extraktion der generierten Daten

Nachdem man die Kacheln generiert hat, ist man mit einem weiteren Problem konfrontiert: Wie bekommt man sie wieder aus dem Runner heraus? Was zuerst trivial klingt, ist durch die maximale Größe für GitHub-Artefakte recht limitiert. Diese liegt bei lediglich 2 GB.  
Aber GitHub erlaubt ein Schlupfloch: Das Limit findet für Docker-Images keine Anwendung. Daher erfolgt das Packaging einfach als Image, was auch Vorteile bei der Weiterverarbeitung bietet. Allerdings folgt daraus gleich das nächste Problem: Docker selbst kopiert erstmal den gesamten Kontext, um daraus ein Image zu bauen, das bedeutet, dass man zum Abschluss den dreifachen Speicherplatz braucht (Ausgangsdateien, Zwischenspeicher und das finale Image). Abhilfe schafft hier die alternative Implementierung [Buildah](https://buildah.io/) (Redhat bietet eine entsprechende [GitHub Action](https://github.com/redhat-actions/buildah-build)), diese erfordert nun den Platz für das Eingangsmaterial und das finale Image. Das erzeugte Image kann dann mit der [`push-to-registry` GitHub Action](https://github.com/redhat-actions/push-to-registry) in die Container Registry geschoben werden.

Auch hier sind Kombinationen möglich, so kann man, um auf einem sehr leer geräumten Runner arbeiten zu können, auch die oberen Schritte in einem Build mit einem Spezialisierten Basis-Image ausführen, das nicht nur die notwendigen Daten, sondern auch Programme enthält.

## Nächste Schritte

Es existieren noch einige Optimierungspotenziale: So ist es denkbar Planetiler mittels [GraalVM](https://www.graalvm.org/) nativ zu kompilieren, das hätte den Vorteil, dass sich die Laufzeit um maximal 30% reduzieren würde und der Speicherplatz für die Java Laufzeitumgebung wegfallen könnte. Dafür sind allerdings noch ein paar kleine Hürden zu nehmen, da die derzeitige Art native Funktionalität des Betriebssystems zu nutzen nicht mit GraalVM kompatibel ist.

Auch ist es denkbar, manche der immer notwendigen Schritte als eine eigene GitHub Aktion bereitzustellen, aber bisher lohnt sich für mich der Aufwand nicht.

## Kann man schon was sehen?

Dieser Beitrag enthält absichtlich keine Konfigurations- und Codebeispiele, da die tatsächliche Ausführung auf Grund der beschränkten Ressourcen stark auf das gewünschte Kartenmaterial zugeschnitten sein muss.

Grob lässt sich sagen, dass man unter Ausnutzung aller Tricks den Dump für Europa ohne Gebäude bis Zoomstufe 13 in knapp unter 6 Stunden erzeugen kann.

## Update

* **14.3.2025**: [Never Built Göttingen: Karte basierend auf selbst generiertem Material](https://never-built.goettingen.xyz/map/)
