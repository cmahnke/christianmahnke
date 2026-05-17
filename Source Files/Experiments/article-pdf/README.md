# TODO
* Use CSS Footnotes 
  * Make sure links and Markdown footnotes are merged in a single data structure (done - not tested)
  * Pages with markdown footnotes: (done)
    * content/post/json-compression/
    * content/post/stop-microfilm-digitisation
* Fix PDF CSS
   * Page breaks

# Testing

 npx vivliostyle-batch-cli -i docs/post/iiif-proxy/article.html --static /:./docs/ --asset-base https://christianmahnke.de/=./docs/ --asset-base http://localhost:1313/=./docs/ --ignore-asset /livereload.js -o --mode preview