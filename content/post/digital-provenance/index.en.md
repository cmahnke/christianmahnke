---
date: 2025-03-16T22:33:44+02:00
title: "Digital provenance for digitised cultural heritage"
keywords: CAI, C2PA
description: "Digitally signed digital reproductions"
tags:
  - DigitalImages
  - ProjectIdea
  - CulturalPolicy
  - DigitalLibrary
  - Digitisation
---

How can the authenticity of digitised cultural assets be guaranteed?
<!--more-->

In times when the generation of images by artificial intelligence is getting better and better - while at the same time attempts are being made to influence public opinion with manipulated images - the question must be asked as to how fundamental trust in the authenticity of digital cultural assets can be created, maintained and technically supported.
The necessary, machine-readable and ideally audit-proof documentation of process steps, the actors involved (whether human or machine) is meant here by digital provenance.

# Background
The institutionalised digitisation of printing has been carried out in Germany since around 2000. Initially in two "lighthouse projects", the MDZ in Munich and the GDZ in Göttingen. Originally a relatively "niche" undertaking, the programme quickly became known to the wider (specialist) public and increasingly in demand.

Many cultural institutions are now digitising their works and making them available online. In order to fund such projects, the DFG expects institutions to adhere to certain requirements, the DFG Code of Practice ([DFG-Praxisregeln](https://zenodo.org/records/7435724)). These are revised from time to time in order to take account of technical innovations or general conditions, for example.

One of these innovations was, for example, making the digital copies available under a Creative Commons licence, which, depending on how it is structured, also allows the digital copy of the work to be edited. This is an important achievement of recent years, as it has also brought about a change in the understanding of ownership of cultural artefacts. Many institutions have established their own (sometimes more restrictive) guidelines for the subsequent use of digitised material.

Ultimately and realistically, in the age of digitisation, legal means, specifically licensing restrictions, ultimately offer little deterrent potential against manipulation with bad intentions, while they would massively restrict legitimate re-use.
However, the extensive possibilities offered by image processing using artificial intelligence also pose problems, not least with regard to the integrity and authenticity of images in particular, in the context of distorting and misleading supposed "news", especially on social media.

# Is there a problem?
This brings me to the problem of dwindling trust in public scientific and cultural institutions: Many institutions are feeling this more and more in the form of falling user numbers and explicit mistrust. Associations and representatives regularly emphasise the issue of trust at annual conferences with phrases such as "...in science" or - now more popular - "...in democracy".
Against this background, one wonders how trust in the process chain from the physical submission to the portal of an institution and beyond could at least be made comprehensible.

# Solution
As this use case is of course not only relevant for digital copies, but also for press photographs and digital art, for example, there is already a technical solution:

The [Content Authenticity Initiative (CAI)](https://contentauthenticity.org/)  is an initiative founded in 2019 that develops technologies for verifying the provenance of digital content. The initiative works closely with the [Coalition for Content Provenance and Authenticity (C2PA)](https://c2pa.org/) and offers open source implementations of the corresponding specification. Ultimately, this is a cryptographically secured statement about the origin of a digital image and the various processing steps carried out on it. This is stored in the metadata of the image file and can therefore be checked directly on the basis of this - i.e. without having to consult an indexing system or process documentation from a long-term archiving system, for example. This has the advantage that subsequent changes can be recognised solely on the basis of the image file supplied.

In detail, this means that the digitisation workflows used and the tools involved need to be adapted. In addition, there is the new requirement to provide an infrastructure for signing.  The latter could also be centralised.

Even if support is not currently sufficient for the entire chain (i.e. up to the browser) and derivatives (e.g. tiles provided via IIIF) are not yet taken into account or specified, it can be assumed that this will change in the future.

As the DFG continues to fund digitisation programmes and often serves as a role model with its rules of practice, the DFG should consider making these mechanisms optional in the next version of the rules of practice, also to encourage innovation in this direction.

And if an appropriate infrastructure for digitised material is set up, you can also sign born-digital material in repositories institutionally anyway...  
