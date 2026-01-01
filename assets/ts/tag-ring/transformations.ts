const lang = navigator.language.split('-')[0]

export type Tags = {
  [key: string]: {
    count: string;
    sameAs: URL;
    posts: string[];
    url: string;
    translations?: {[key: string]: string};
  };
};

export function tagsToPages(tags: Tags): { [key: string]: string[] } {
  let posts: { [key: string]: string[] } = {};

  for (const [key, value] of Object.entries(tags)) {
    value.posts.forEach((post) => {
      if (post in posts) {
        posts[post].push(key);
      } else {
        posts[post] = [key];
      }
    });
  }
  return posts;
}

function translate(tag, tags = undefined) {
  if (tags !== undefined && tag in tags && "translations" in tags[tag]) {
    if (lang in tags[tag]["translations"]) {
      return tags[tag]["translations"][lang]
    }
  }
  return tag
}

function page(tag, tags = undefined) {
  if (tags !== undefined && tag in tags && "url" in tags[tag]) {
    return tags[tag]["url"]
  }
  return '/tags/' + tag
}

export function convertTags(tags: Tags):{ from: string; to: string; url: string }[] {
  let pairs: { from: string; to: string; url: string; page: string }[] = [];
  const posts = tagsToPages(tags);

  for (const [post, postTags] of Object.entries(posts)) {
    var combinations = postTags.flatMap((v, i) =>
      postTags.slice(i + 1).map((w) => {
        const fromTag = translate(v, tags);
        const toTag = translate(w, tags);
        const url = page(v, tags)
        pairs.push({ from: fromTag, to: toTag, url: post, page: url });
      })
    );
  }
  return pairs;
}
