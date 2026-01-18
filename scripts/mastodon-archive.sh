#!/usr/bin/env bash

if [ -z "$ARCHIVE_BRANCH" ] ; then
  ARCHIVE_BRANCH="mastodon-backup"
fi

if [ -z "$ARCHIVE_DIRECTORY" ] ; then
  ARCHIVE_DIRECTORY="./data/mastodon"
fi
rm -rf $ARCHIVE_DIRECTORY/*

if [ -z "$ARCHIVE_FILE" ] ; then
  ARCHIVE_FILE="openbiblio.social.user.cmahnke.json"
fi

IMAGE_DIRECTORY=$(basename $ARCHIVE_FILE .json)
ASSET_DIRECTORY=./assets/mastodon
rm -rf "$ASSET_DIRECTORY"
mkdir -p "$ASSET_DIRECTORY"

git config --global remote.origin.fetch "+refs/heads/*:refs/remotes/origin/*"
git ls-remote --exit-code origin $ARCHIVE_BRANCH
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ] ; then
  git fetch origin $ARCHIVE_BRANCH
  git checkout origin/$ARCHIVE_BRANCH -- "$ARCHIVE_DIRECTORY/*.json"
  git checkout origin/$ARCHIVE_BRANCH -- "$ARCHIVE_DIRECTORY/$IMAGE_DIRECTORY"
  git restore --staged "$ARCHIVE_DIRECTORY"
  mv "$ARCHIVE_DIRECTORY/$ARCHIVE_FILE" "$ASSET_DIRECTORY/mastodon-archive.json"
  mv "$ARCHIVE_DIRECTORY/$IMAGE_DIRECTORY" "$ASSET_DIRECTORY/media"
else
  echo "No backup branch '$ARCHIVE_BRANCH' found, skipping checkout."
fi