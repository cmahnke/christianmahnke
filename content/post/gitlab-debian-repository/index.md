---
date: 2025-08-08T18:33:44+02:00
title: "Debian Repository mit GitLab Pages"
keywords: Debian, GitLab
cite: true
tags:
  - Git
  - SoftwareDevelopment
wikidata:
  - https://www.wikidata.org/wiki/Q16639197
  - https://www.wikidata.org/wiki/Q7715973
---

Ein einfaches Debian-Repository selbst gestrickt...
<!--more-->

Manchmal braucht man ein eigenes Debian-Repository, z.B. um [Electron](https://www.electronjs.org/)-Anwendungen mit [`rpi-image-gen`](https://github.com/raspberrypi/rpi-image-gen) zu installieren.

Auch wenn GitLab ein [experimentelles Feature](https://docs.gitlab.com/user/packages/debian_repository/) dafür hat, ist es nicht auf jeder Instanz aktiviert.

# Repository erstellen

Grundsätzlich gibt es zwei Wege bzw. Werkzeuge um statische Debian-Paketquellen zu erzeugen, `dpkg-scanpackages` und `reprepro`. Die folgenden Beispiele gehen davon aus, dass es unterhalb des Arbeitsverzeichnisses ein weiteres mit dem Namen `debian` gibt. Darin befinden sich eine oder mehrere "`.deb`"-Dateien.


## `dpkg-scanpackages`

Dies ist die einfachere Variante. Zunächst muss das Paket `dpkg-dev` installiert werden (`apt install -y dpkg-dev`). Anschließend kann das Programm mit dem folgenden Befehl ausgeführt werden:

```bash
dpkg-scanpackages -m debian /dev/null | gzip -9c > debian/Packages.gz
```

Danach kann dann das Verzeichnis `debian` auf einem Web Speicherbereich zur Verfügung gestellt werden.


## `reprepro`

Dies ist die Variante, die mehr Möglichkeiten bietet, zuerst muss das Paket `reprepro` installiert werden (`apt install -y reprepro`). Diese Variante hat den Vorteil, dass man auch GPG Schlüssel bereitstellen kann...

Da hier auch Konfigurationsdateien erzeugt werden müssen, empfielt es sich ein zusätzliches Shellscript im Repository anzulegen:

```bash
REPO_DIR=$1

mkdir -p $REPO_DIR/{conf,incoming,debian}

RELEASE_NAME=bookworm

echo "Using $REPO_DIR as local repository"

cat <<EOF >> $REPO_DIR/conf/distributions
Origin: My Electron App
Label: My Electron App
Suite: stable
Codename: $RELEASE_NAME
Architectures: arm64 armhf
Components: main
Description: Personal Electron App software repository
EOF

cd $REPO_DIR
reprepro createsymlinks
reprepro export

for DEB in `find $REPO_DIR/debian/ -name "*.deb" -type f`; do
    echo "Adding $DEB"
    reprepro -b $REPO_DIR includedeb "$RELEASE_NAME" "$DEB"
done
```

`reprepro` bietet auch noch [weitere Parameter und Optionen](https://wiki.debian.org/DebianRepository/SetupWithReprepro).

# Verzeichnis-Index erzeugen

Dieser Schritt ist optional und erfordert die Programme `tree`und `find` (`apt install -y tree findutils`). `tree` kann Verzeichnislisten im HTML Format erstellen, `find` wird genutzt um `tree` rekursiv auszuführen:

```bash
find . -type d -print -exec sh -c 'tree "$0" -H "." -L 1 --noreport --houtro "" --dirsfirst --charset utf-8 -I "index.html" --timefmt "%d-%b-%Y %H:%M" -s -D -o "$0/index.html"' {} \;
```

# Bereitstellung im Web - Beispiel für GitLab

Dieses einfache Beispiel erzeugt ein Debian-Repository auf GitLab Pages.

```yaml
# This collects all *.deb files from the workdir and creates the package index
packages:
  stage: deploy
  image: debian:bookworm
  artifacts:
    paths:
      - repo
  before_script:
    - apt-get update
    - apt-get install -y dpkg-dev tree findutils
  script:
    - mkdir -p repo/debian
    - find . -name '*.deb' -print -exec cp {} repo/debian/ \;
    - cd repo
    - find . -type d -print -exec sh -c 'tree "$0" -H "." -L 1 --noreport --houtro "" --dirsfirst --charset utf-8 -I "index.html" --timefmt "%d-%b-%Y %H:%M" -s -D -o "$0/index.html"' {} \;
    - dpkg-scanpackages -m debian /dev/null | gzip -9c > debian/Packages.gz

# This depends on the artifacts of the `packages` step and deploys them on GitLab pages
pages:
  stage: deploy
  needs:
    - packages
  script:
    - mkdir -p public
    - cp -r repo/debian public/
  artifacts:
    paths:
      - public

```
