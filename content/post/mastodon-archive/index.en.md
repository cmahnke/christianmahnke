---
date: 2026-02-01T12:22:44+02:00
title: "Mastodon Archive"
tags:
  - Projektemacher.org
  - SocialMedia
  - Archive
  - Hugo 
wikidata:
  - https://www.wikidata.org/wiki/Q27986619
  - https://www.wikidata.org/wiki/Q115232190
---

Having recently created an [archive of my Mastodon posts](/post/github-action-mastodon-backup/)...

<!--more-->

...these are now also part of this website. The archive isn’t yet linked in the menu; it can be accessed at [`/mastodon`](/mastodon).

## Implementation

The implementation is quite straightforward using a [Hugo Content Adapter](https://gohugo.io/content-management/content-adapters/). This reads the archive created in the previous post (as JSON) and generates representations in Hugo’s internal page format. To do this, an empty subdirectory with a file named `_content.gotmpl` must be created in the Hugo `content` directory. The example uses the name `mastodon/_content.gotmpl` for this.

At the start of the file, you simply need to specify the source file (`$mastodonFile`) and the folder where the media is stored (`$mastodonMediaPath`).

```gotemplate
{{- $mastodonFile := "mastodon/mastodon-archive.json" -}}
{{- $mastodonMediaPath := "mastodon/media/" -}}
{{- $adapter := . -}}

{{- $data := dict -}}
{{- warnf "[mastodon/_content.gotmpl] Generating content from %s" $mastodonFile -}}
{{- with resources.Get $mastodonFile -}}
  {{ $data = . | transform.Unmarshal }}
{{- else -}}
  {{- errorf "mastodon/_content.gotmpl] Failed to load %s" $mastodonFile -}}
{{- end -}}
{{- .EnableAllLanguages -}}

{{- $structures := slice "statuses" "favourites" "mentions" -}}
{{- range $structure := $structures -}}

  {{- range (index $data $structure) -}}

    {{- $account := .account.username -}}
    {{- $content := .content -}}
    {{- $createdAt := .created_at -}}
    {{- $id := .id -}}
    {{- $media_attachments := slice -}}
    {{- with .media_attachments -}}
      {{- range . -}}
        {{- $mediaType := .type -}}
        {{- $url := .url -}}
        {{- $localMedia := path.Join $mastodonMediaPath (urls.Parse .url).Path -}}
        {{- if os.FileExists (path.Join "assets" $localMedia) -}}
          {{- $url := $localMedia -}}
        {{- else -}}
          {{- warnf "[mastodon/_content.gotmpl] Local media file not found: %s" $localMedia -}}
        {{- end -}}
        {{- $previewUrl := .preview_url -}}
        {{- $localPreview := path.Join $mastodonMediaPath (urls.Parse .preview_url).Path -}}
        {{- if os.FileExists (path.Join "assets" $localPreview) -}}
          {{- $previewUrl := $localPreview -}}
        {{- else -}}
          {{- warnf "[mastodon/_content.gotmpl] Local preview file not found: %s" $localPreview -}}
        {{- end -}}
        {{- $description := .description -}}
        {{- $media_attachments = $media_attachments | append (dict "type" $mediaType "url" $url "preview_url" $previewUrl "description" $description) -}}
      {{- end -}}
    {{- end -}}
    {{- $reblog := slice -}}
    {{- with .reblog -}}
      {{- range . -}}
        {{- $reblog = $reblog | append . -}}
      {{- end -}}
    {{- end -}}
    {{- $language := .language -}}
    {{- $reblogsCount := .reblogs_count -}}
    {{- $favouritesCount := .favourites_count -}}
    {{- $card := dict -}}
    {{- with .card -}}
      {{- $url := .url -}}
      {{- $title := .title -}}
      {{- $description := .description -}}
      {{- $card = dict "url" $url "title" $title "description" $description -}}
    {{- end -}}
    {{- $url := .url -}}
    {{- $repliesCount := .replies_count -}}
    {{- $tags := slice -}}
    {{- with .tags -}}
      {{- range . -}}
        {{- $name := .name -}}
        {{- $url := .url -}}
        {{- $tags = $tags | append (dict "name" $name "url" $url) -}}
      {{- end -}}
    {{- end -}}
    {{- $mentions := .mentions -}}
    {{- $reply := dict -}}
    {{- if and (ne .in_reply_to_id nil) -}}
      {{- $reply = dict "in_reply_to_id" .in_reply_to_id "in_reply_to_account_id" .in_reply_to_account_id -}}
    {{- end -}}
    {{- $poll := .poll -}}
    {{- $pinned := .pinned -}}
    {{- $favourited := .favourited -}}
    {{- $sensitive := .sensitive -}}
    {{- $spoilerText := .spoiler_text -}}

    {{ $content := dict
      "mediaType" "text/html"
      "value" $content
    }}
    {{ $page := dict
      "content" $content
      "kind" "page"
      "date" (time.AsTime $createdAt)
      "params" (dict
        "account" $account
        "created_at" $createdAt
        "id" $id
        "media_attachments" $media_attachments
        "language" $language
        "reblogs_count" $reblogsCount
        "favourites_count" $favouritesCount
        "card" $card
        "url" $url
        "replies_count" $repliesCount
        "_tags" $tags
        "reblog" $reblog
        "mentions" $mentions
        "reply" $reply
        "poll" $poll
        "pinned" $pinned
        "favourited" $favourited
        "sensitive" $sensitive
        "type" $structure
        "spoiler_text" $spoilerText
      )
      "path" $id
    }}
    {{ $adapter.AddPage $page }}
  {{- end -}}
{{- end -}}
```