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
wikipedia:
  - https://www.wikidata.org/wiki/Q40463886
---

This site now supports a subset of ActivityPub...

<!--more-->

...the part that can be implemented statically.
Basically not that hard, especially since there are some articles about it:
* [Justin Garrison: Mastodon instance with 6 files](https://justingarrison.com/blog/2022-12-06-mastodon-files-instance/)
* [Maho Pacheco: A guide to implement ActivityPub in a static site (or any website)](https://maho.dev/2024/02/a-guide-to-implement-activitypub-in-a-static-site-or-any-website/)

# Implementation

The site provides three files:

* `/.well-known/webfinger` – a static JRD file that resolves `acct:cmahnke@christianmahnke.de` and points to the actor
* `/@cmahnke.json` – a static ActivityStreams `Person` object that serves as a profile and links to the real Mastodon account on [openbiblio.social](https://openbiblio.social/@cmahnke)
* `/outbox.json` – an `OrderedCollection` listing the blog posts as `Create`/`Note` objects

This is implemented using custom [output formats](https://gohugo.io/templates/output-formats/) in Hugo (`activity-pub-actor` and `activity-pub-outbox` with the media type `application/activity+json`), so the files are generated directly during the build.

# Limitations

Since the site is delivered purely statically, the server-side parts of the protocol are missing: there is no `inbox` endpoint, so following, mentions, replies and deleting are not possible. The actor therefore only serves for discoverability and points to the real Mastodon account. Also, the posts from the outbox are not backfilled into Mastodon timelines automatically – there, the articles stay visible via the real account.

# Tests

The WebFinger resolution can be checked at https://webfinger.net/lookup/.
