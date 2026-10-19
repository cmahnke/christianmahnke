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
  const posts: { [key: string]: string[] } = {};

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

function translate(tag: string, tags?: Tags): string {
  const translations = tags?.[tag]?.translations;
  if (translations !== undefined && lang in translations) {
    return translations[lang]
  }
  return tag
}

function page(tag: string, tags?: Tags): string {
  const url = tags?.[tag]?.url;
  if (url !== undefined) {
    return url
  }
  return '/tags/' + tag
}

export function convertTags(tags: Tags): { from: string; to: string; url: string; page: string }[] {
  const pairs: { from: string; to: string; url: string; page: string }[] = [];
  const posts = tagsToPages(tags);

  for (const [post, postTags] of Object.entries(posts)) {
    const combinations = postTags.flatMap((v, i) =>
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
