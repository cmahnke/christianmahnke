#!/usr/bin/env bash

if [ -z "$BACKUP_BRANCH" ] ; then
  BACKUP_BRANCH="mastodon-backup"
fi

if [ -z "$BACKUP_DIRECTORY" ] ; then
  BACKUP_DIRECTORY="./data/mastodon"
fi
rm -rf $BACKUP_DIRECTORY/*

if [ -z "$BACKUP_FILE" ] ; then
  BACKUP_FILE="openbiblio.social.user.cmahnke.json"
fi

IMAGE_DIRECTORY=$(basename $BACKUP_FILE .json)
ASSET_DIRECTORY=./assets/mastodon/media
rm -rf "$ASSET_DIRECTORY"
mkdir -p `dirname "$ASSET_DIRECTORY"`

git config --global remote.origin.fetch "+refs/heads/*:refs/remotes/origin/*"
git ls-remote --exit-code origin $BACKUP_BRANCH
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ] ; then
  git fetch origin $BACKUP_BRANCH
  git checkout origin/$BACKUP_BRANCH -- "$BACKUP_DIRECTORY/*.json"
  git checkout origin/$BACKUP_BRANCH -- "$BACKUP_DIRECTORY/$IMAGE_DIRECTORY"
  git restore --staged "$BACKUP_DIRECTORY"
  mv "$BACKUP_DIRECTORY/$IMAGE_DIRECTORY" "$ASSET_DIRECTORY"
else
  echo "No backup branch '$BACKUP_BRANCH' found, skipping checkout."
fi