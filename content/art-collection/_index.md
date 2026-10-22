---
title: "Kunstsammlung"
params:
  metaPage: true
  displayinlist: false
  archive: false
  news: false
  sectionContent: false
  js:
    - ts/art-collection.ts
layout: art-collection
cascade:
  - target:
      kind: '{page,section}'
      sites:
        matrix:
          languages: [de]
      path: '**'
    params:
      archive: false
      news: false
      metaPage: true
      displayinlist: false
      sitemap:
        disable: true
---

<details class="sub-galleries">
  <summary>Verschiedene Klassifikationen</summary>
  <div class="toc-list">
    <div class="toc-list-inner">
      <div class="toc-group">
        <h2 class="toc-header">Techniken:</h2>
        <ul class="artists-toc" role="list">
          <li><a href="/art-collection/collage/">Collagen</a></li>
          <li><a href="/art-collection/computerart/">Computerkunst</a></li>
          <li><a href="/art-collection/painting/">Gemälde</a></li>
          <li><a href="/art-collection/woodblockprint/">Holzschnitte</a></li>
          <li><a href="/art-collection/linocut/">Linolschnitte</a></li>
          <li><a href="/art-collection/lithography/">Lithografien</a></li>
          <li><a href="/art-collection/photo/">Photos</a></li>
          <li><a href="/art-collection/etching/">Radierungen</a></li>
          <li><a href="/art-collection/serigraphy/">Siebdrucke</a></li>
          <li><a href="/art-collection/drawing/">Zeichnungen</a></li>
        </ul>
      </div>
      <div class="toc-group">
        <h2 class="toc-header">Regional:</h2>
        <ul class="artists-toc" role="list">
          <li><a href="/art-collection/goettingen/">Göttingen</a></li>
          <li><a href="/art-collection/niedersachsen/">Niedersachsen</a></li>
          <li><a href="/art-collection/czechia/">Tschechien</a></li>
        </ul>
      </div>
      <div class="toc-group">
        <h2 class="toc-header">Sonstige:</h2>
        <ul class="artists-toc" role="list">
          <li><a href="/art-collection/unknownartist/">Werke unbekannter Urherberschaft</a></li>
        </ul>
      </div>
    </div>
  </div>
</details>
