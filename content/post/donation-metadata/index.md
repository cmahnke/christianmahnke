---
date: 2025-05-21T06:00:00
title: "Informationen zu Spendern in Kulturerbeaggregatoren"
keywords: XML, METS, MODS, EAD, museum:digital, LIDO
cite: true
description:
tags:
  - Donation
  - Metadata
  - DigitalLibrary
  - Digitisation
  - Archive
wikidata:
  - https://www.wikidata.org/wiki/Q621630
  - https://www.wikidata.org/wiki/Q24045714
  - https://www.wikidata.org/wiki/Q1360745
---

Ab und zu spende ich Objekte an Kultureinrichtungen...
<!--more-->
...dafür gibt es ein paar [Konditionen](https://christianmahnke.de/collections/#aktiver-spender), zu denen es auch gehört Nachweise in verschiedenen Portalen bereitzustellen. Wie bereits [geschrieben](/post/archives-citizen-participation/), bin ich der Meinung, dass dies zivilgesellschaftliche Partizipation befördern kann...
Da es hier in der Vergangenheit zu Rückfragen kam, habe ich für die in der Liste genannten Portalen ein paar technische Informationen zusammengetragen.

## Technische Details

Der folgenden Abschnitt gibt Hinweise zur Bereitstellung der Daten für drei wichtige Verbundportale. Da für die Erstellung von Datensätzen verschiedene Softwarelösungen, Datenkonversionen und andere Prozesse zum Einsatz kommen, können diese hier nicht im einzelnen behandelt werden. Der folgenden Abschnitt beschränkt sich daher hauptsächlich auf die für den Datenaustausch notwendigen Metadatenfelder.

Falls sie für ihre Einrichtung Unterstützung benötigen, können Sie sich gerne an mich wenden.

### Deutsche Digitalen Bibliothek (DDB)

Die [DDB](https://www.deutsche-digitale-bibliothek.de/) nutzt für Metadaten, die von Bibliotheken bereitgestellt werden, Formate die im Bibliotheksbereich verbreitet sind. Dies sind entweder [MARC](https://www.loc.gov/marc/) oder [METS (Metadata Encoding and Transmission Schema)](https://www.loc.gov/standards/mets/) in Verbindung mit [MODS (Metadata Object Description Schema)](https://www.loc.gov/standards/mods/) verwendet. Hinzu kommt in Deutschland das [Schema](https://dfg-viewer.de/fileadmin/groups/dfgviewer/METS-Anwendungsprofil_2.3.1.pdf#page=27) für den [DFG-Viewer](https://dfg-viewer.de/) (Namensraum `dv`).

Für das Portal muss zwischen zwei Arten der Förderung / Sponsoring unterschieden werden:

#### Sponsorschaft für die Digitalisierung

Die Dokumentation der Nutzung des `<dv:rights>` Elements in der DDB ist [hier](https://wiki.deutsche-digitale-bibliothek.de/x/ssIeB) zu finden.

```xml
<mets:amdSec ID="AMD">
    <mets:rightsMD ID="RIGHTS">
        <mets:mdWrap MDTYPE="OTHER" MIMETYPE="text/xml"
          OTHERMDTYPE="DVRIGHTS">
            <mets:xmlData>
                <dv:rights>
                    ...
                    <dv:sponsor>Förderer</dv:sponsor>
                    ...
                </dv:rights>
            </mets:xmlData>
        </mets:mdWrap>
    </mets:rightsMD>
    ...
</mets:amdSec>

```

Die Darstellung erfolgt wie in diesem [Beispiel](http://www.deutsche-digitale-bibliothek.de/item/VOL7G43KNY6TE3ZRJSEBZHKTMM6USWPC).

#### Spende eines Objekts (der Digitalisierungsvorlage)

Anders verhält es sich, wenn deutlich gemacht werden soll, dass ein z.B ein Buch an eine Einrichtung gespendet wurde. In diesem Fall werden die Angeben im MODS Abschnitt (`<mods:name>`) hinterlegt.

Die Dokumentation der Nutzung des `<mods:name>` Elements in der DDB ist [hier](https://wiki.deutsche-digitale-bibliothek.de/spaces/DFD/pages/19006819/name) zu finden. Am Ende der Seite ist ein Beispiel für die Finanzierung (der Digitalisierung) - MARC Relator [`fnd` (funder)](https://id.loc.gov/vocabulary/relators/fnd.html)-

Ein Spender (Donor) kann wie folgt angegeben werden.

```xml
<mets:dmdSec ID="DMD">
  ...
  <mets:mdWrap MDTYPE="MODS">
    <mets:xmlData>
      <mods:name type="personal" valueURI="http://d-nb.info/gnd/1143543866">
        <mods:displayForm>Mustermann, Max</mods:displayForm>
        <mods:role>
          <mods:roleTerm authority="marcrelator" type="code"
            valueURI="http://id.loc.gov/vocabulary/relators/dnr">dnr</mods:roleTerm>
          <mods:roleTerm type="text">Spender</mods:roleTerm>
        </mods:role>
      </mods:name>
    </mets:xmlData>
  </mets:mdWrap>
  ...
</mets:dmdSec>
```

Zusätzlich ist es möglich die [Provenienz](https://wiki.deutsche-digitale-bibliothek.de/spaces/DFD/pages/19006846/note) anzugeben:

```xml
<note type="ownership">Dieses Buch gehörte Max Mustermann</note>
```

### museum-digital

Da bei [museum-digital](https://www.museum-digital.de/) viele Institutionen ihre Daten direkt eingeben, gibt es natürlich die Möglichkeit direkt mit der Eingabemaske zu arbeiten.

Bei der Direkteingabe kann im Rahmen der Objektgeschichte (in der Registerkarte ["Verwaltung"](https://de.handbook.museum-digital.info/musdb/Objekte/Registerkarten-Standard/Verwaltung.html), "Zugangszeitpunkt", "als") auch eine Schenkung eingetragen werden. Aber das ist nicht die einzige Möglichkeit: Es ist auch möglich eine Danksagung zu hinterlegen oder mit den [Ereignissen](https://de.handbook.museum-digital.info/Grundkonzepte/Ereignistypen.html) "Besitz" oder "Rechtstitel übertragen".
Mehr dazu im [umfangreichen Handbuch](https://de.handbook.museum-digital.info/musdb/Objekte/Registerkarten-Standard/Verwaltung.html).

Zusätzlich ist es aber auch möglich, die Informationen beim Datenimport zu übergeben.
Dazu gibt es z.B. für den [CSV Import](https://csvxml.imports.museum-digital.org/) das Feld `owner_previous`, die weiteren Felder ("Zugangszeitpunkt", "als") scheinen aber nicht vie CSV unterstützt zu werden.

Grundsätzlich bietet museum-digital auch ein Werkzeug zur [Qualitätssicherung](https://quality.museum-digital.org/).

### Archivportal-D

Im Archivbereich (und damit dem [Archivportal-D](https://www.archivportal-d.de/)) wird das Format [EAD (Encoded Archival Description)](https://www.loc.gov/ead/) in der Version 2002 entsprechend des Anwendungsprofils [EAD(DDB) 1.2](https://github.com/Deutsche-Digitale-Bibliothek/ddb-metadata-ead) verwendet. Dort sind derzeit keine expliziten Felder zu Spendern oder Förderern vorgesehen.

Auch hier kann zwischen einer Förderung (der Digitalisierung oder Erschließung) und einer Spende unterschieden werden:

#### Sponsorschaft

Für eine Sponsorschaft wird empfohlen das `<odd>` Element zu verwenden.

Die Dokumentation der Nutzung des `<odd>` Elements im Archivportal-D ist [hier](https://wiki.deutsche-digitale-bibliothek.de/spaces/DFD/pages/25133350/odd) zu finden.

```xml
<odd>
   <head>Förderung</head>
   <p>Freitext Förderhinweis</p>
<odd>
```

Die Darstellung erfolgt wie in diesem [Beispiel](http://www.archivportal-d.de/item/HX25DBKQOI2VOPJ77FGM3FITCBHWJWPS).

#### Spende eines Objekts

Die Spende eines physischen Objektes kann über eine Provenienzangabe abgebildet werden. Dazu dient das Element `<origination>`

Die Dokumentation der Nutzung des `<origination>` Elements im Archivportal-D ist [https://wiki.deutsche-digitale-bibliothek.de/spaces/DFD/pages/25133352/origination) zu finden.

```xml
<origination label="Provenienz">            
    <name source="GND" authfilenumber="1143543866">Mustermann, Max</name>        
</origination>
```

Dabei ist die Nutzung des `<name>` Elements optional, es dient zur Verbindung der Provenienzstelle mit einem Normdatensatz.

Die Darstellung erfolgt wie in diesem [Beispiel](https://www.archivportal-d.de/item/SJ4W777QFAG3T6UX5PTPGPUKWELI5QH5).

## Potentielle Verbesserungen

### Deutsche Digitalen Bibliothek (DDB) - METS/MODS

MODS erlaub es auch im Element `<mods:note>`, mit dem Attribut `type="acquisition"` den Erwerb zu hinterlegen, dies kann auch eine Spende / Schenkung / Stiftung sein. Diese Variante ist ggf. etwas genauer, da `type="ownership"` nur _einen_ Vorbesitzer angibt.

```xml
<mods:note type="acquisition">Donated by Max Mustermann</mods:note>
```

### Archivportal-D - EAD

Für EAD lassen sich Informationen statt im [`<odd`>](https://www.loc.gov/ead/EAD3taglib/EAD3-TL-eng.html#elem-odd) auch in [`<acqinfo>`](https://www.loc.gov/ead/EAD3taglib/EAD3-TL-eng.html#elem-acqinfo) ablegen, wie in diesem Beispiel aus der [Encoded Archival Description Tag Library Version EAD3 1.1.2](https://www.loc.gov/ead/EAD3taglib/EAD3-TL-eng.html):

```xml
<acqinfo>
  <p>The collection (Donor No.
    <num localtype="donor"> 8338 </num>

  ) was donated by
    <persname relator="donor">
      <part>Vonda Thomas</part>

    </persname>

  and
    <persname relator="donor">
      <part>Francine Farrow</part>

    </persname>

  in March 1995.</p>

</acqinfo>
```
[Quelle](https://www.loc.gov/ead/EAD3taglib/EAD3-TL-eng.html#elem-num)

## Danksagungen

* Joshua Enslin, [museum-digital](https://www.museum-digital.de/)
* Timo Schleier und Stefanie Rühle, Fachstelle Bibliothek der [Deutschen Digitalen Bibliothek](https://www.deutsche-digitale-bibliothek.de/)
* Dr. Denise Ruisinger, Fachstelle Archiv der [Deutschen Digitalen Bibliothek](https://www.deutsche-digitale-bibliothek.de/)

## Updates

* Kommentare eingearbeitet
  * METS/MODS als Metadatenformate für Bibliotheken nicht DDB allgemein
  * Unterscheidung zwischen Förderung der Digitalisierung (für DDB und Archivportal-D) und Objektspenden verdeutlicht
  * EAD Version und Anwendungsprofil ergänzt

# Update 23.5.2025

Dieser Artikel wurde auch von [Archivalia verlinkt](https://archivalia.hypotheses.org/229536).