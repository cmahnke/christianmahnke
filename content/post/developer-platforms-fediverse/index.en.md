---
date: 2026-04-30T17:30:00+02:00
title: Fediverse integration for development platforms
tags:
  - SoftwareDevelopment
  - ProjectIdea
  - GitHub
  - DigitalSovereignty
cite: true
wikidata:
  - https://www.wikidata.org/wiki/Q364
  - https://www.wikidata.org/wiki/Q16639197
  - https://www.wikidata.org/wiki/Q30325419
  - https://www.wikidata.org/wiki/Q27986619
  - https://www.wikidata.org/wiki/Q40463886
---

GitHub is currently facing a lot of issues – what does it take to switch?
<!--more-->

A great deal has already been written about the technical issues (reliability, security problems, etc.), and numerous videos have been produced. There is also plenty of information available on the topics of digital sovereignty and independence from Microsoft.

To cut a long story short: there are good reasons to look for alternatives to GitHub. And at first glance, there is a fair selection available:

* [GitLab](https://about.gitlab.com/)
* [Codeberg](https://codeberg.org/)
* [Gitea](https://about.gitea.com/)
* [Forgejo](https://forgejo.org/)
* [Bitbucket](https://bitbucket.org/)

Some of these offer only hosting services, whilst others also provide the software for local installation.  

However, hosting services have a few drawbacks compared to GitHub (at least if you have an old account). GitHub offers a vast array of resources, orders of magnitude more than the competition:
* Storage space: Particularly with my image-heavy blogs, a repository can sometimes run to several gigabytes in size. There are also the odd files that are around 50 MB in size.
* Container images of a few gigabytes in size can also be stored.
* The runners have a maximum runtime of six hours and provide a virtual machine which, with a bit of [fiddling](https://christianmahnke.de/post/build-vector-tiles-on-github/), offers a mid-double-digit gigabyte amount of free space, thereby also allowing for extensive data transformations.

In addition, there are CI infrastructures and other automation tools that can be set up on GitHub.

Another factor arising from the platform’s scale is the [network effect](https://de.wikipedia.org/wiki/Netzwerkeffekt), which receives little attention. In my view, this is a major oversight if one is seriously advocating for a replacement.

## GitHub is a social network

Simply because so many projects, particularly from the JavaScript and TypeScript communities, can now be found on GitHub, they are interconnected not only in terms of software but also in terms of the people involved. Although these are primarily working relationships, one should not forget that a simple @ mention in an issue or comment can be used to draw other people’s attention to something. The same applies to linking information between projects. GitHub also recognises these links and integrates them into various history views (issues, comments, discussions, pull requests, etc.).

In other words: **GitHub is a social network**, and so for many people, concerns about sovereignty or dependence on the big tech giant Microsoft are simply not a sufficient reason to leave this convenient ecosystem.

The prospect of having to maintain their code on a small island, cut off from their community, is unlikely to inspire much enthusiasm for switching. For smaller projects in particular, the network effect also means potentially increased visibility – for example, when maintaining one’s own projects to improve one’s prospects on the job market.

## Development platforms must join the Fediverse!

Therefore, the following applies: anyone who is serious about reducing the use of GitHub or replacing it with decentralised European solutions or providers must advocate for the interconnection of platforms. Digital sovereignty alone isn’t really that appealing.

[ActivityPub](https://de.wikipedia.org/wiki/ActivityPub) (the technical foundation of the Fediverse) provides all the necessary mechanisms. Every platform must be able to address at least the following entities:
* Users
* Issues / Discussions – and comments where applicable
* Pull / Merge Requests
* Tags / Releases

At the presentation level, the platforms must then provide various ‘inboxes’ and display them in the appropriate contexts, e.g. notifications or issue discussions for users.

Meanwhile, the platforms also offer additional features such as simple project management or boards, and documentation or wikis. But let’s start with the basics first.

The idea isn’t new; there’s [ForgeFed](https://forgefed.org/), for example, but the integration has been fairly limited so far. Instead, the focus tends to be on hype topics such as "Agentic AI". These certainly have their place, particularly when you need to attract customers using buzzwords (e.g. organisations as). But you won’t reach (informal open-source) communities that way.

**Anyone who wants a future of open-source collaboration free from dependence on Big Tech must not treat interconnectivity as a mere additional feature, but must recognise it as an infrastructural necessity.**
