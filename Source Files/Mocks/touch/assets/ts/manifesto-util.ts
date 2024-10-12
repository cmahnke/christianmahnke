// See https://github.com/IIIF-Commons/manifesto/issues/125

import { Canvas, Manifest, AnnotationPage, RawAnnotationPage, Annotation } from "manifesto.js";

function getAnnotationPages(canvases: Canvas[], options: Manifest["options"]): Array<AnnotationPage> {
  const annotationPages: Array<AnnotationPage> = [];

  if (canvases.length) {
    canvases.forEach((canvas) => {
      // "getProperty" ejects and results in raw JSON
      // We need to instantiate each level with the appropriate constructor
      const rawAnnotationPages: Array<RawAnnotationPage> = canvas.getProperty("annotations") || [];

      annotationPages.push(
        ...rawAnnotationPages.map((rawAnnotationPage) => {
          const rawAnnotations: Array<RawAnnotation> | undefined = rawAnnotationPage.items;

          return new AnnotationPage(
            {
              ...rawAnnotationPage,
              items: rawAnnotations.map((rawAnnotation) => {
                return new Annotation(rawAnnotation, options);
              }),
              type: rawAnnotationPage.type
            },
            options
          );
        })
      );
      return [];
    });
  }
  return annotationPages;
}

export { getAnnotationPages };
