---
date: 2025-08-08T18:33:44+02:00
title: "Debian Repository mit GitLab"
keywords: Debian, GitLab
cite: true
tags:
  - Git
  - SoftwareDevelopment
wikidata:
  - https://www.wikidata.org/wiki/Q16639197
  - https://www.wikidata.org/wiki/Q7715973
#draft: true
---

A simple Debian repository knitted by yourself...
<!--more-->

Sometimes you need your own Debian repository, e.g. to install [Electron](https://www.electronjs.org/) applications with [`rpi-image-gen`](https://github.com/raspberrypi/rpi-image-gen).

Even if GitLab has an [experimental feature](https://docs.gitlab.com/user/packages/debian_repository/) for this, it is not activated on every instance.

# Create repository

Basically there are two ways or tools to create static Debian package repositories, `dpkg-scanpackages` and `reprepro`. The following examples assume that there is another one called `debian` below the working directory. This contains one or more "`.deb`" files.

## `dpkg-scanpackages`

This is the simpler variant. First, the package `dpkg-dev` must be installed (`apt install -y dpkg-dev`). The program can then be executed with the following command:

```bash
dpkg-scanpackages -m debian /dev/null | gzip -9c > debian/Packages.gz
```

The `debian` directory can then be made available on a web storage area.


## `reprepro`

This is the variant that offers more possibilities, first the package `reprepro` must be installed (`apt install -y reprepro`). This variant has the advantage that you can also provide GPG keys...

Since configuration files must also be created here, it is recommended to create an additional shell script in the repository:

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

`reprepro` also offers [further parameters and options](https://wiki.debian.org/DebianRepository/SetupWithReprepro).

# Create directory index

This step is optional and requires the programs `tree`and `find` (`apt install -y tree findutils`). `tree` can create directory listings in HTML format, `find` is used to run `tree` recursively:

```bash
find . -type d -print -exec sh -c 'tree "$0" -H "." -L 1 --noreport --houtro "" --dirsfirst --charset utf-8 -I "index.html" --timefmt "%d-%b-%Y %H:%M" -s -D -o "$0/index.html"' {} \;
```

# Deployment on the Web - Example for GitLab

This simple example creates a Debian repository on GitLab Pages.

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
