---
date: 2024-10-09T19:22:44+02:00
title: "911TV as desktop application"
description: "A website as a media installation using the example of 911TV"
preview:
  image: 911tv-mac.png
  hide: true
tags:
- Website
- HybridMedia
- Archives
- JavaScript
- Electron
- MediaInstallation
---

Another corona project:

<!--more-->

This time I am affected myself. This gave me the opportunity to renovate a project from [last fall](https://christianmahnke.de/post/911tv/):

[911TV](https://911tv.projektemacher.org/) was "finished" last November - it did roughly what it was supposed to, but there were still minor problems and more ideas. The problems are significantly less now, especially with mobile clients. And the site is now also available as an application for the desktop:

{{< figure src="911tv-mac.png" alt="Screenshot 911TV Desktop Mac" caption="Screenshot 911TV Desktop on MacOS" >}}

The availability as a desktop app also means that provision as a media station, i.e. a type of physical installation, is coming closer. If only because these are easier to handle and distribute than websites in a browser (no additional settings for lockdown / kiosk modes, no management of media handling).


## Technical realization

The application is realized [Electron](https://www.electronjs.org/) and is therefore in principle available for Windows, Linux and MacOS. However, the MacOS version is currently not created automatically.
Apart from that, not much has changed implementation wise, some modules have been switched to [TypeScript](https://www.typescriptlang.org/) and my next project will certainly not be made with the [React](https://react.dev/) framework.

## Download (updated)

* **Windows**
* {{< figure src="favicon-32.png" alt="Screenshot 911TV Desktop Mac" link="" >}}[Zip 64 Bit Intel](https://github.com/cmahnke/911tv/releases/download/2024.10.21/911tv-win-x64.zip)
* {{< figure src="favicon-32.png" alt="Screenshot 911TV Desktop Mac" link="" >}}[Zip 64 Bit ARM](https://github.com/cmahnke/911tv/releases/download/2024.10.21/911tv-win-arm64.zip)

* **Linux**
* {{< figure src="favicon-32.png" alt="Screenshot 911TV Desktop Mac" link="" >}}[Tar.gz 64 Bit Intel](https://github.com/cmahnke/911tv/releases/download/2024.10.21/911tv-linux-amd64.tgz)
* {{< figure src="favicon-32.png" alt="Screenshot 911TV Desktop Mac" link="" >}}[Tar.gz 64 Bit ARM](https://github.com/cmahnke/911tv/releases/download/2024.10.21/911tv-linux-arm64.tgz)

The application can be downloaded from [GitHub](https://github.com/cmahnke/911tv/releases).
