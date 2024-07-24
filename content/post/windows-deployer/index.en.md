---
date: 2023-08-21T19:22:44+02:00
title: "Windows Deployer"
tags:
  - Windows
---

How to install a freshly built software from GitLab / GitHub?
On a Windows computer.
In an internal network - behind a VPN gateway
<!--more-->

For cases for which there are no tools, you have to build your own:
The first problem is remote deployment on Windows machines (from Linux). There are various approaches such as [WMI](https://en.wikipedia.org/wiki/Windows_Management_Instrumentation), but these are not always directly available on other platforms. For example, PowerShell is also available for Mac OS and Linux, but only with a subset of the features. There is also another [WMI client for Linux](https://gist.github.com/rickheil/7c89a843bf7c853997a1), but this has a problem with Windows 10. Some libraries only run on Windows, as they are simply wrappers around the operating system infrastructure.

In the end, the Python library [`impacket`](https://github.com/fortra/impacket) was chosen because it is actively maintained and comes with extensive examples.

Windows Installer packages (MSI)](https://en.wikipedia.org/wiki/Windows_Installer) can be installed via WMI, these packages can also be created with the open source project [`msitools`](https://gitlab.gnome.org/GNOME/msitools) - therefore a corresponding Docker image is also included.

The second problem is access to a system in an internal network. However, since there is a Cisco VPN gateway, [`openconnect`](https://gitlab.com/openconnect/openconnect) and [`vpnc-scripts`](https://gitlab.com/openconnect/vpnc-scripts) can be used for access. This also works for Docker containers if you specify a corresponding network configuration (for `/dev/net/tun`) at startup.

Another easy-to-solve problem was the provision of the file to be installed. You can simply use [Samba](https://www.samba.org/) for this.

To simplify the interaction of all these factors, the subsystems were packaged as Docker images. This also has the advantage that the components can be used relatively easily as part of a GitLab / Github workflow.

The result and many more details of the implementation can be found [https://github.com/cmahnke/windows-deployer](here).
