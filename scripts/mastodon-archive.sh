#!/usr/bin/env bash

if [ -z "$BACKUP_BRANCH" ] ; then
  BACKUP_BRANCH="mastodon-backup"
fi

if [ -z "$BACKUP_DIRECTORY" ] ; then
  BACKUP_DIRECTORY="./data/mastodon"
fi

git checkout $BACKUP_BRANCH -- "$BACKUP_DIRECTORY/*.json"