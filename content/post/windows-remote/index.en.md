---
date: 2026-03-04T19:22:44+02:00
title: "Windows Remote Management"
tags:
  - Windows
---

Many systems for remote control of Windows-based computers require their own client on the respective system....

<!--more-->

...Examples of this include changing the volume of a media station or shutting down the computer. This is usually implemented via [MQTT](https://de.wikipedia.org/wiki/MQTT) or proprietary protocols. However, this makes the setup unnecessarily complicated, especially if you are trying to customise the respective systems as little as possible.

As with the [last project on Windows remote installation](/post/windows-deployer/), the following applies: for cases where there are no tools available, you have to build your own:

An alternative built into Windows is: [WMI (Windows Management Instrumentation)](https://de.wikipedia.org/wiki/Windows_Management_Instrumentation). This can be used to start processes, for example. At the same time, a ([PowerShell](https://de.wikipedia.org/wiki/PowerShell)) script can also be transferred.

This combination offers many possibilities for manipulating a Windows client, especially since it is also possible to load additional components via [NuGet](https://de.wikipedia.org/wiki/NuGet)).

The Python library [impacket](https://github.com/fortra/impacket/) is used for implementation, which makes it possible to address WMI without (Windows) native dependencies (e.g. from Linux systems). To do this, the WMI service only needs to be configured for external access on the client.

Das Skript (inklusive Docker-Image und REST-Service) ist auf [GitHub](https://github.com/cmahnke/mediastation-remote) verfügbar.
