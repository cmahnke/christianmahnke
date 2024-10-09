---
date: 2023-11-09T19:22:44+02:00
title: "911TV started"
preview:
  image: screenshot.png
  hide: true
tags:
- Website
- HybridMedia
- Archives
- JavaScript
---

An old idea of mine has now been realised:

<!--more-->

# 9/11/2001 on television

The original idea was to present the content "physically", i.e. in the form of an armchair and a television in an otherwise empty room in order to increase the immersion. However, this could only have been a temporary installation and would have required some (interesting) technical gimmicks, so the project has now been realised as a [website](https://911tv.projektemacher.org/).

{{< zoom-link link="https://911tv.projektemacher.org/" title="911TV" >}}
    {{< figure src="screenshot.png" alt="Screenshot 911TV" class="post-image" >}}
{{< /zoom-link >}}

# Why?

[11 September 2001](https://en.wikipedia.org/wiki/September_11_attacks) was not only an unprecedented terrorist attack, but also a special media event. The images have become iconic, of course, but also the density of events and length, mediated by live television coverage were without precedent.

I can still remember that day and the days that followed, how the event developed: first "just" a news ticker to a spectacular accident...
And further developments then led to more and more broadcasters taking up the unfolding events and accompanying it with special programmes.

The [impact of the event](https://en.wikipedia.org/wiki/September_11_attacks#Aftermath) is manifold. Besides the well-known global political, cultural ones, there are also social ones such as the [truther movement](https://en.wikipedia.org/wiki/9/11_truth_movement), which was certainly also fostered by contradictions and rumours in the context of the live coverage.

Of course, it is no longer possible today to recreate the reception situation of 9/11, if only because it is now known what happened and how it ended. But this page should at least be an attempt to recreate this situation and thus to create immersion. Contrary to current media usage habits, the television programme is linear, but you can change channels.

# How?

In 2007, the Internet Archive set up the [September 11 Television Archive](https://archive.org/details/sept_11_tv_archive), a collection of TV broadcasts from 20 channels over 7 days, totalling about 3000 hours of material. Although mainly US channels, it also includes some international channels such as [BBC](https://en.wikipedia.org/wiki/BBC), [NTV](https://en.wikipedia.org/wiki/NTV_(Russia)), [TV Azteca](https://en.wikipedia.org/wiki/TV_Azteca), [MCM](https://en.wikipedia.org/wiki/MCM_(TV_channel)) and [CCTV-3](https://en.wikipedia.org/wiki/CCTV-3).

In addition, there is a [day view](https://archive.org/details/911), which is presented like an [EPG](https://en.wikipedia.org/wiki/Electronic_program_guide), which allows a good overview, but unfortunately also prevents immersion, as it forces constant interaction.

Therefore, this website summarises the videos and presents them in a very reduced user interface: As an TV set.

Contrary to current media usage habits, the TV programme is linear, but you can change channels.
Key events can be displayed as teletext sub titles. Teletext can also be deactivated and the "TV" displayed in full-screen mode. Loading the teletext panels can take some time.
If errors occur, such as longer loading times or missing recordings, there is a picture disturbance. This also occurs when you try to switch off the television.

This also allows presentation on a CRT screen, e.g. as part of an installation.

## Technical realisation

The page is realised as a [React](https://react.dev/), i.e. JavaScript application, the additional dependencies are documented on the page. In order to reduce the user interface as much as possible, the interaction options with the screen text are limited to keyboard input.
