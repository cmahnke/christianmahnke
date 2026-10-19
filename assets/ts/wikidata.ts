
export function checkLinksForQClasses() {
  const links = document.querySelectorAll('a');

  links.forEach(link => {
    for (const className of link.classList) {
      if (className.startsWith('Q')) {
        link.dataset.wikidata = className;
        break;
      }
    }
  });
}
