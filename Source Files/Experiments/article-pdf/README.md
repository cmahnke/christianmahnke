# TODO
* Use CSS Footnotes 
  * Make sure links and Markdown footnotes are merged in a single data structure (done - not tested)
  * Format footnote area
    * partial line only
    * check http://localhost:1313/post/stop-microfilm-digitisation/article.html
* Fix PDF CSS
  * Page breaks with footnotes (done)
  * Page flow (without explicit page break)
  * Figcaption margins
  * Updates with sub headings (done)
  * Check overlabs fit `figCaption`
*  Maps (tiles wrong origin)
* Javascript renderings
  * PDF preview (done)
  * IIIF (http://localhost:1313/post/seelischerkrankte-krankenhaus/article.html)
  * 3D Models
* Video (done)
  * http://localhost:1313/post/vintagereality-apple-spatial/article.html
* HDR check (done)
  * http://localhost:1313/post/visualising-ai-segmentation-with-hdr/article.html
* Tables (done)
  * http://localhost:1313/post/vintagereality-apple-spatial/article.html
* Footnotes (area to small?)
  * http://localhost:1313/post/blog-sparql/article.html
  * summary can break footnotea

# Testing

npx vivliostyle-batch-cli -i docs/post/iiif-proxy/article.html --static /:./docs/ --asset-base http://localhost:1313/=./docs/ --asset-base http://localhost:1313/=./docs/ --ignore-asset /livereload.js --mode preview

# Things to test:
* Pages with markdown footnotes:
  * content/post/json-compression/
  * content/post/stop-microfilm-digitisation
* JS funtionality
  * http://localhost:1313/post/print-malte-satorius/article.html
  * http://localhost:1313/post/wallpaper-generator/article.html
  * http://localhost:1313/post/marmolada-woodcut/article.html
  * http://localhost:1313/post/hdr-iiif/article.html
  * http://localhost:1313/post/maps/article.html
  * http://localhost:1313/post/haptic-feedback/article.html
  * http://localhost:1313/post/digital-lost-places/article.html
  * http://localhost:1313/post/uv-photogrammetry/article.html
  * http://localhost:1313/post/blog-visualisation/article.html
  * http://localhost:1313/post/blog-sparql/article.html
  * http://localhost:1313/post/tag-pairs/article.html (done)
  * http://localhost:1313/post/pong/article.html (done)
  * http://localhost:1313/post/vintagereality-apple-spatial/article.html (done, except Video)
  * http://localhost:1313/post/3d-models/article.html
  * http://localhost:1313/post/911tv/article.html

## General layout
  * http://localhost:1313/post/merch.projektemacher.org/article.html (image with zoom link)
  * http://localhost:1313/post/build-vector-tiles-on-github/article.html (Update with sub heding)


# Done
  * http://localhost:1313/post/coat-hangers-book/article.html (done)
