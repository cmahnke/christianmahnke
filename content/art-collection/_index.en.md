---
title: "Art Collection"
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
          languages: [en]
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
  <summary>Various classifications</summary>
  <div class="toc-list">
    <div class="toc-list-inner">
      <div class="toc-group">
        <h2 class="toc-header">Techniques:</h2>
        <ul class="artists-toc" role="list">
          <li><a href="/en/art-collection/collage/">Collages</a></li>
          <li><a href="/en/art-collection/computerart/">Computer art</a></li>
          <li><a href="/en/art-collection/painting/">Paintings</a></li>
          <li><a href="/en/art-collection/woodblockprint/">Woodcuts</a></li>
          <li><a href="/en/art-collection/linocut/">Linocuts</a></li>
          <li><a href="/en/art-collection/lithography/">Lithographs</a></li>
          <li><a href="/en/art-collection/photo/">Photographs</a></li>
          <li><a href="/en/art-collection/etching/">Etchings</a></li>
          <li><a href="/en/art-collection/serigraphy/">Screen prints</a></li>
          <li><a href="/en/art-collection/drawing/">Drawings</a></li>
        </ul>
      </div>
      <div class="toc-group">
        <h2 class="toc-header">Regional:</h2>
        <ul class="artists-toc" role="list">
          <li><a href="/en/art-collection/goettingen/">Göttingen</a></li>
          <li><a href="/en/art-collection/niedersachsen/">Lower Saxony</a></li>
          <li><a href="/art-collection/czechia/">Czechia</a></li>
        </ul>
      </div>
      <div class="toc-group">
        <h2 class="toc-header">Other:</h2>
        <ul class="artists-toc" role="list">
          <li><a href="/art-collection/unknownartist/">Works by unknown artists</a></li>
        </ul>
      </div>
    </div>
  </div>
</details>
