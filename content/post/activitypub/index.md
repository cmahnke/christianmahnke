---
date: 2024-04-15T13:58:44+02:00
title: "ActivityPub"
preview:
  image: ActivityPub-logo.png
  hide: true
tags:
- DIY
- Blog
draft: true
---

Diese Seite unterstützt nun eine Untermenge von ActivityPub...

<!--more-->

...also den Teil, der sich statisch implementieren lässt.
Grundsätzlich nicht wirklich schwer, zu mal es auch einige Artikel zu dem Thema gibt:
* [Justin Garrison: Mastodon instance with 6 files](https://justingarrison.com/blog/2022-12-06-mastodon-files-instance/)
* [Maho Pacheco: A guide to implement ActivityPub in a static site (or any website)](https://maho.dev/2024/02/a-guide-to-implement-activitypub-in-a-static-site-or-any-website/)

# Umsetzung



```
...
content-type: application/octet-stream
...
```


# Tests

Um die Webfinger

https://git.qoto.org/fedipage/fedipage/

https://socialhub.activitypub.rocks/t/fedipage-v2-1-0-released-a-hugo-based-static-site-generator-with-activitypub-support/3659
https://justingarrison.com/blog/2022-12-06-mastodon-files-instance/
https://maho.dev/2024/02/a-guide-to-implementing-activitypub-in-a-static-site-or-any-website-part-4/


https://webfinger.net/lookup/
