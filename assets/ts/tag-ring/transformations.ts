export type Tags = {
  [key: string]: {
    count: string;
    sameAs: URL;
    posts: string[];
    url: string;
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

export function convertTags(tags: Tags) {
  let pairs: { from: string; to: string; url: string }[] = [];
  const posts = tagsToPages(tags);

  for (const [post, postTags] of Object.entries(posts)) {
    var combinations = postTags.flatMap((v, i) =>
      postTags.slice(i + 1).map((w) => {
        pairs.push({ from: v, to: w, url: post });
      })
    );
  }
  return pairs;
}
