---
date: 2026-04-26T06:22:44+02:00
title: "My experience with WASM"
tags:
  - JavaScript
  - SoftwareDevelopment
  - Hugo
wikidata:
  - https://www.wikidata.org/wiki/Q20155677
  - https://www.wikidata.org/wiki/Q111590996
  - https://www.wikidata.org/wiki/Q114900810
---

For the last two blog posts on SPARQL and triple stores, I had to grapple with [WASM](https://webassembly.org/)...
<!--more-->

...and was genuinely surprised at how poor browser integration and the developer experience (DX) still are.

The former becomes apparent relatively quickly once you’ve embedded the component on a webpage that reloads with every change via a watcher. After a while, the evidence mounts that the browser isn’t reliably clearing out old resources. In Chrome, this can manifest as tabs freezing or crashing, or even esoteric memory errors in the WASM application.
You can get used to this after a while, and the effects certainly don’t manifest in this form for the end user, but WASM still feels, for the time being, like a botched job.

The main problem, however, is the integration of WASM artefacts into JavaScript (for the browser): it is complicated or counterintuitive, particularly if you also have to use a bundler. Simply because you are forced to include the WASM code as a separate asset in its own right, following its own loading semantics (asynchronous initialisation), whilst simultaneously ensuring that the JavaScript wrapper for the code is loaded into the WASM file. The [MDN documentation](https://developer.mozilla.org/en-US/docs/WebAssembly) provides an example of this complexity.

For older readers: The whole thing seems heavily inspired by the use of inline assembler for various architectures in C. After all, it does contain the word ‘Assembly’ in its name.

## Digression

Admittedly, the structure of this blog is also quite complicated:
* I first develop more complex JavaScript functionalities based on [Vite](https://www.typescriptlang.org/) and [TypeScript](https://www.typescriptlang.org/).
* These are then bundled together using [Rollup](https://rollupjs.org/) (as it makes it easier to generate various artefacts from a single source tree) (one JS and one CSS artefact each)
* A wrapper is then created from this as a [Hugo shortcode](https://gohugo.io/content-management/shortcodes/) – this step is not yet automated. Linking the JavaScript artefact to the shortcode is described here: [Split metadata for Hugo pages](https://christianmahnke.de/post/hugo-shared-metadata/)
* Hugo then uses [esbuild](https://esbuild.github.io/) to generate the JavaScript for the browser.

The fact that it takes more than one step to transform JavaScript (also known as compiling) is a well-known problem in modern web development and is far from ideal.

This includes the fact that the entire JavaScript ecosystem is designed to cope with its own shortcomings. For more traditional reasons, dating back to the pre-tree-shaking era (i.e. code optimisation where unused functions are prevented from entering the client-side code, as the page load time improves due to the transmission of less data), the entire community tends to atomise its software artefacts and package them into very small units.
Others have written better and wiser things on this issue (and other problems of ‘modern’ JavaScript in the sense of contemporary, not innovative JavaScript), e.g. in [The Three Pillars of JavaScript Bloat](https://43081j.com/2026/03/three-pillars-of-javascript-bloat)

This pattern is generally regarded as an anti-pattern in other communities, yet it is used in almost everything, including build tools such as bundlers. Consequently, one inevitably has to spend more time on one’s build infrastructure than one would like.
This has the ‘amusing’ consequence, for example, that not all of these tools cover the full range of modern web technologies on their own.
For instance, [Rollup](https://rollupjs.org/) or [Vite](https://vite.dev/) require plugins for Wasm. 

## Back to Wasm:
The main problem is probably that, although it’s called WebAssembly, it was designed to be used across many platforms. So if you take the name as an indication of its intended purpose, it suffers from over-generalisation. 

Twenty years ago, with Java, we had something in the browser that was already more advanced in this respect. Admittedly, the language doesn’t have as many fans anymore, but the embedding and also the access to DOM elements on the page where the applet was running were significantly better.

## How could it be improved?
But WASM also has other theoretical advantages, such as increased execution speed or the ability to use legacy code as a starting point.
Nevertheless, developers could benefit if the focus were primarily on the web as a platform. The usage scenario should be designed to feel like JavaScript. For example, one could do away with the necessary external JS wrappers by bundling them into the WASM file (or the WASM bytecode into a JS file), so that they are automatically available upon instantiation. 
Building on this, a simplified API would also have been helpful:

```javascript
const wasm_obj = await WebAssembly.new(‘./simple.wasm’);
```

Instead of all that faff of fetching (`fetch`), possibly compiling, instantiating and "marrying" it with the JS wrapper code – which you’d also have to bundle or load. So it really is "seamless". Of course, this would be optional. Anyone who prefers the existing API should, of course, still be able to use it.

As this change is not expected in the browser JS API, we need to tackle this at the bundler level...