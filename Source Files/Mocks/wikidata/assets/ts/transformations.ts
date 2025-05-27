export interface InfoLink {
  label: string;
  url: string;
}

export interface InitialItemInput {
  id: string; // Wikidata QID
  weight: number; // For initial node size
  infoLinks?: InfoLink[];
}

export type WikidataExport = {
  pages: {
    url: string;
    title?: string;
    wikidata: string[];
  }[];
  tags: {
    [key: string]: string;
  };
};

export function pagesToWikidata(wikidata: WikidataExport): InitialItemInput[] {
  let ids: InitialItemInput[] = [];

  wikidata.pages.forEach((page) => {
    const infoLink = { url: page.url, label: "" };
    if ("title" in page) {
      infoLink.label = page.title;
    }
    page.wikidata.forEach((idUrl) => {
      const qId = idUrl.replace("https://www.wikidata.org/wiki/", "");

      let idReference = ids.find((id) => id.id === qId);

      if (idReference !== undefined) {
        idReference.infoLinks.push(infoLink);
        idReference.weight = idReference.infoLinks.length;
        ids.push(idReference);
      } else {
        idReference = { id: qId, infoLinks: [infoLink], weight: 1 };
        ids.push(idReference);
      }
    });
  });
  return ids;
}
