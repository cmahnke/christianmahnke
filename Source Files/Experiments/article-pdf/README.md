# TODO
* Use CSS Footnotes 
  * Make sure links and Markdown footnotes are merged in a single data structure (done - not tested)
  * Format footnote area
    * partial line only
* Fix PDF CSS
  * Page breaks with footnotes
  * Page flow (without explicit page break)
* Javascript renderings
  * PDF preview

# Testing

npx vivliostyle-batch-cli -i docs/post/iiif-proxy/article.html --static /:./docs/ --asset-base https://christianmahnke.de/=./docs/ --asset-base http://localhost:1313/=./docs/ --ignore-asset /livereload.js --mode preview

# Things to test:
* Pages with markdown footnotes:
  * content/post/json-compression/
  * content/post/stop-microfilm-digitisation
* JS funtionality
  * https://christianmahnke.de/post/print-malte-satorius/
  * https://christianmahnke.de/post/wallpaper-generator/
  * https://christianmahnke.de/post/marmolada-woodcut/
  * https://christianmahnke.de/post/hdr-iiif/
  * https://christianmahnke.de/post/maps/
  * https://christianmahnke.de/post/haptic-feedback/
  * https://christianmahnke.de/post/digital-lost-places/
  * https://christianmahnke.de/post/uv-photogrammetry/
  * https://christianmahnke.de/post/blog-visualisation/
  * https://christianmahnke.de/post/blog-sparql/
  * https://christianmahnke.de/post/tag-pairs/
  * https://christianmahnke.de/post/pong/
  * https://christianmahnke.de/post/coat-hangers-book/
  * https://christianmahnke.de/post/vintagereality-apple-spatial/