import { pagesToWikidata } from "./transformations";
import { visualizeRelations } from "./wikidata";

const lang = navigator.language.split("-")[0];

const options = {
  // Optional renderOptions
  intermediateItemRadius: 6,
  intermediateItemColor: "purple",
  nodeCollisionPadding: 2,
  linkDistanceOther: 70
  // defaultInitialRadius, linkDistanceInitialToInitial can also be set
};

document.addEventListener("DOMContentLoaded", () => {
  fetch("/meta/wikidata/index.json")
    .then((response) => response.json())
    .then((data) => {
      const items = pagesToWikidata(data);
      console.log(items);
      /*
      const processedData = convertTags(data).map((pair) => {
        let a = Object.values(pair);
        a.push(1);
        return a;
      });
      */
      visualizeRelations(lang, items, options);
    });
});
