/*
 * Ambient declarations for packages that don't ship TypeScript types and
 * for the globals the site's entry points attach to `window`.
 *
 * This must stay a script file (no imports/exports on the top level) —
 * otherwise the declarations would become module augmentations, which
 * require the augmented module to be typed already.
 */

declare module 'elevator.js' {
  interface ElevatorOptions {
    mainAudio?: string;
    endAudio?: string;
    element?: HTMLElement | null;
    duration?: number;
    vertical?: boolean;
    openDuration?: number;
    closeDuration?: number;
  }

  class Elevator {
    constructor(options?: ElevatorOptions);
    elevate(): void;
  }

  export default Elevator;
}

declare module 'enter-view' {
  interface EnterViewOptions {
    selector: string | string[];
    enter?(el: Element): void;
    exit?(el: Element): void;
    progress?(el: Element, progress: number): void;
    offset?: number;
    once?: boolean;
  }

  function enterView(options: EnterViewOptions): void;

  export default enterView;
}

interface Window {
  stickybits: typeof import('stickybits').default;
  addConsent: typeof import('./iframe-consent.ts').addConsent;
  initMap: typeof import('./maps/osm-map.ts').initMap;
  chroma: any;
  WordCloud: any;
  enterView: typeof import('enter-view').default;
  photoswipe(id: string, children: string): void;
  touchViewer: typeof import('./iiif/openseadragon-annotorious3.ts').default;
  anno: unknown;
}

declare const AFRAME: {
  registerComponent(name: string, definition: any): void;
};
