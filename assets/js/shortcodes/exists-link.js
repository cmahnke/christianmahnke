/*
 * exists-link shortcode runtime.
 *
 * The shortcode (layouts/_shortcodes/exists-link.html) emits placeholder
 * spans for urls that are not guaranteed to exist at build time. This script
 * HEAD-checks every url in the browser and replaces the placeholder with a
 * real link only when the server answers with a success status. Anything
 * else — an error status, a network failure, a cross-origin host without
 * CORS headers — removes the placeholder and stays quiet except for a
 * console warning.
 *
 * Loaded as a module, so the DOM is already parsed when it runs; the
 * readyState guard keeps it safe if that ever changes.
 */

(function () {
  "use strict";

  function renderLink(placeholder) {
    var url = placeholder.getAttribute("data-exists-link-url");
    var label = placeholder.getAttribute("data-exists-link-label");
    if (!url) {
      placeholder.remove();
      return;
    }
    var link = document.createElement("a");
    link.href = url;
    link.className = "exists-link";
    link.textContent = label || url;
    try {
      if (new URL(url, window.location.href).origin !== window.location.origin) {
        link.target = "_blank";
      }
    } catch (err) {
      /* invalid url — leave the link without target */
    }
    placeholder.replaceWith(link);
  }

  function check(placeholder) {
    var url = placeholder.getAttribute("data-exists-link-url");
    fetch(url, { method: "HEAD" })
      .then(function (response) {
        if (response.ok) {
          renderLink(placeholder);
        } else {
          console.warn("[exists-link] " + response.status + " — removing: " + url);
          placeholder.remove();
        }
      })
      .catch(function (err) {
        console.warn("[exists-link] unreachable: " + url, err);
        placeholder.remove();
      });
  }

  function run() {
    var placeholders = document.querySelectorAll("[data-exists-link-url]");
    Array.prototype.forEach.call(placeholders, check);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
