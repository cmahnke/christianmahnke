---
date: 2026-11-25T22:52:22+02:00
title: 'AI-assisted attributions'
description: "Two previously unknown artists identified"
params:
  cite: true
  wikidata:
    - https://www.wikidata.org/wiki/Q860755
    - https://www.wikidata.org/wiki/Q230768
tags:
- Art
- AI
- ArtHistory
- UnknownArtist
- AgenticCoding
---

Yesterday evening, two works whose artists had previously been unknown were identified....
<!--more-->

This time with the help of AI. In both cases, it was helpful that I always included a close-up of the signature (where available) alongside a photo of the artwork in my post.

## Found

* A [woodcut by Juan Castells Martí (1906–1980)](/post/print-unknown-6/)
* A [drawing by Hartmut Eing (1938–2021)](/post/drawing-art-brut/)

Both attributions come from Google Images" AI. Incidentally, it handles such tasks far better than Gemini, which, unfortunately, is [unable to interact with Google Images on its own](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/grounding/grounding-with-google-search). Both results were visually confirmed.
Attempts to get other models to use Google Image Search directly have so far failed due to anti-bot measures. However, DeepSeek V4.1 Flash 1017, in conjunction with [Omkarcloud Camoufox scraper](https://github.com/omkarcloud/google-scraper), managed to find both names as the top candidates in each case.

## Further investigations

Incidentally, suggestions were also made regarding other images; however, these did not stand up to scrutiny of the signatures, insofar as they led to sufficient reference material at all. The most interesting examples are:

* [Silkscreen print of a light bulb](/post/print-unknown-1): Could be by Helga Jahnke (1939–2024) – but the signatures and style do not match those of the images available online.
* [Woodcut "Am Hang"](/post/print-unknown-3): Whilst the artist is known by name, that is all that is known. A teacher of that name was identified in Danzig, but no comparable works are known:
  * In the [1914 Danzig address book](https://pbc.gda.pl/Content/3703/Od_714_8_1914.pdf#page=591), "Josef, teacher" is listed under "Winkelmann" at the address Am Holzraum 20. The [Karlovy Vary guest registers for 1913](https://data.onb.ac.at/ANNO/clk19130612?seite=1) and [1914](https://data.onb.ac.at/ANNO/clk19140615?seite=4) also list him as a teacher from Danzig.
  * The [1939 Danzig address book](https://books.google.com/books?id=pUnxVraz7o0C&dq=%22Winkelmann%22+%22Am+Holzraum%22+%22Lehrer%22) lists a senior teacher named “Winkelmann, Jos.” on the same street.

Both results were provided by GPT-6.2 Sol (max) for approximately $5 each.

## Next steps

## Next steps

As Google Images' bot protection can be bypassed automatically, it is possible to have an agent carry out the search for visually similar candidates, including a rough classification (candidates with signatures). This classification could then, in turn, be used to facilitate further research into techniques, styles and comparative material. Where appropriate, this may also allow for direct comparisons of signatures. All of this could culminate in a general-purpose skill for this task.

Whilst waiting for the train this morning, I came across a very similar approach on Heise Online: [AI identifies the unknown artist of an 1808 sketchbook in 22 minutes](https://www.heise.de/news/KI-ermittelt-in-22-Minuten-den-unbekannten-Zeichner-eines-Skizzenbuchs-von-1808-11537049.html).
