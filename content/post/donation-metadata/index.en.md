---
date: 2025-05-19T17:00:00+01:00
title: "Information on donors in cultural heritage aggregators"
keywords: XML, METS, MODS, EAD, museum:digital, LIDO
description:
tags:
  - Donation
  - Metadata
  - DigitalLibrary
  - Digitisation
draft: true
---

From time to time I donate objects to cultural institutions...
<!--more-->
...there are a few [conditions](https://christianmahnke.de/collections/#aktiver-spender) for this, which include providing evidence in various portals. As already [written](/post/archives-citizen-participation/), I am of the opinion that this can promote civic participation...
As there have been queries in the past, I have compiled some technical information for the portals mentioned in the list.

## Technical details

The following section provides information on the provision of data for three important collaborative portals. As various software solutions, data conversions and other processes are used to create datasets, these cannot be dealt with in detail here. The following section is therefore mainly limited to the metadata fields required for data exchange.

If you need support for your organisation, please feel free to contact me.

### German Digital Library (DDB)

In the library sector (and thus the [DDB](https://www.deutsche-digitale-bibliothek.de/)), the [METS (Metadata Encoding and Transmission Schema)](https://www.loc.gov/standards/mets/) format is used in conjunction with [MODS (Metadata Object Description Schema)](https://www.loc.gov/standards/mods/). In Germany, the [Schema](https://dfg-viewer.de/fileadmin/groups/dfgviewer/METS-Anwendungsprofil_2.3.1.pdf#page=27) for the [DFG Viewer](https://dfg-viewer.de/) (namespace `dv`) is also used.

A distinction must be made between two types of sponsorship for the portal:

#### Sponsorship for digitisation

The documentation of the use of the `<dv:rights>` element in the DDB can be found [here](https://wiki.deutsche-digitale-bibliothek.de/x/ssIeB).

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

The representation is as in this [example](http://www.deutsche-digitale-bibliothek.de/item/VOL7G43KNY6TE3ZRJSEBZHKTMM6USWPC).

#### Sponsorship of an object (digitisation template)

The situation is different if it is to be made clear that a book, for example, has been donated to an organisation. In this case, the details are stored in the MODS section (`<mods:name>`).

The documentation on the use of the `<mods:name>` element in the DDB can be found [here](https://wiki.deutsche-digitale-bibliothek.de/spaces/DFD/pages/19006819/name). At the bottom of the page is an example of funding (digitisation) - MARC Relator [`fnd` (funder)](https://id.loc.gov/vocabulary/relators/fnd.html)-

A donor can be specified as follows.

```xml
<mods:name type="personal" valueURI="http://d-nb.info/gnd/1143543866">
  <mods:displayForm>Mustermann, Max</mods:displayForm>
  <mods:role>
    <mods:roleTerm authority="marcrelator" type="code"
      valueURI="http://id.loc.gov/vocabulary/relators/dnr">dnr</mods:roleTerm>
    <mods:roleTerm type="text">Spender</mods:roleTerm>
  </mods:role>
</mods:name>
```

It is also possible to specify the [Provenance](https://wiki.deutsche-digitale-bibliothek.de/spaces/DFD/pages/19006846/note):

```xml
<note type="ownership">Dieses Buch gehörte Max Mustermann</note>
```

### museum-digital

As many institutions enter their data directly in [museum-digital](https://www.museum-digital.de/), it is of course possible to work directly with the input mask.

With direct entry, a donation can also be entered as part of the object history (in the [‘Administration’](https://de.handbook.museum-digital.info/musdb/Objekte/Registerkarten-Standard/Verwaltung.html) tab, "Date of acquisition", "As"). But this is not the only option: It is also possible to enter an acknowledgement or to use the [Events](https://de.handbook.museum-digital.info/Grundkonzepte/Ereignistypen.html) ‘Ownership’ or ‘Transfer title’.
More on this in the [comprehensive manual](https://de.handbook.museum-digital.info/musdb/Objekte/Registerkarten-Standard/Verwaltung.html).

However, it is also possible to transfer the information during data import.
For example, there is the field `owner_previous` for the [CSV import](https://csvxml.imports.museum-digital.org/), but the other fields ("Date of acquisition", "As") do not seem to be supported by CSV.

In principle, museum-digital also offers a tool for [quality assurance](https://quality.museum-digital.org/).

### Archivportal-D

In the archive area (and thus the [Archivportal-D](https://www.archivportal-d.de/)) the format [EAD (Encoded Archival Description)](https://www.loc.gov/ead/) is used, there are currently no specific fields for donors or sponsors, therefore it is recommended to use the `odd` element.

The documentation on the use of the `<ead:odd>` element in Archivportal-D can be found [here](https://wiki.deutsche-digitale-bibliothek.de/spaces/DFD/pages/25133350/odd).

```xml
<odd>
   <head>Förderung</head>
   <p>Freitext Förderhinweis</p>
<odd>
```

The display is as shown in this [example](http://www.archivportal-d.de/item/HX25DBKQOI2VOPJ77FGM3FITCBHWJWPS).

## Potential improvements

### German Digital Library (DDB) - METS/MODS

MODS also allows you to enter the acquisition in the `<mods:note>` element with the `type="acquisition"` attribute; this can also be a donation / gift. This variant may be more precise, as `type="ownership"` only specifies _one_ previous owner.

```xml
<mods:note type="acquisition">Donated by Max Mustermann</mods:note>
```

### Archive portal-D - EAD

For EAD, information can also be stored in [`<acqinfo>`](https://www.loc.gov/ead/EAD3taglib/EAD3-TL-eng.html#elem-acqinfo) instead of [`<odd`>](https://www.loc.gov/ead/EAD3taglib/EAD3-TL-eng.html#elem-odd), as in this example from the [Encoded Archival Description Tag Library Version EAD3 1.1.2](https://www.loc.gov/ead/EAD3taglib/EAD3-TL-eng.html):

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

## Acknowledgements

* Joshua Enslin, [museum-digital](https://www.museum-digital.de/)
* Timo Schleier and Stefanie Rühle, Library Centre of the [German Digital Library](https://www.deutsche-digitale-bibliothek.de/)
* Dr Denise Ruisinger, Archive Department of the [German Digital Library](https://www.deutsche-digitale-bibliothek.de/)
