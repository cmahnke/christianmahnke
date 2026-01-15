#!/usr/bin/env bash

if [ -z "$BACKUP_BRANCH" ] ; then
  BACKUP_BRANCH="mastodon-backup"
fi

if [ -z "$BACKUP_DIRECTORY" ] ; then
  BACKUP_DIRECTORY="./data/mastodon"
fi

if [ -z "$BACKUP_FILE" ] ; then
  BACKUP_FILE="openbiblio.social.user.cmahnke.json"
fi

git config --global remote.origin.fetch "+refs/heads/*:refs/remotes/origin/*"
git ls-remote --exit-code origin $BACKUP_BRANCH
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ] ; then
  git fetch origin $BACKUP_BRANCH
  #git checkout origin/$BACKUP_BRANCH -- "$BACKUP_DIRECTORY/*.json"
  git show $BACKUP_BRANCH:$BACKUP_DIRECTORY/$BACKUP_FILE > $BACKUP_DIRECTORY/$BACKUP_FILE
else
  echo "No backup branch '$BACKUP_BRANCH' found, skipping checkout."
fi