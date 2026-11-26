/* In the print rendering context (Vivliostyle) scripts run after the document
   is already complete, so a DOMContentLoaded listener would never fire. */
const onReady = (fn: () => void) => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
};

onReady(() => {
  /* Plain code blocks (no chroma line wrappers) get their text split into
     .line spans so the wrap-marker logic below applies to them too.
     Idempotent: after the split the block has element children. Newlines are
     kept BETWEEN the spans: Vivliostyle does not honor display:block on the
     plain spans, so without them the source lines would flow together. They
     sit outside the .line elements, so the wrap-marker measurement is not
     affected. */
  const splitPlainCodeLines = () => {
    document.querySelectorAll<HTMLElement>('pre code').forEach(code => {
      if (code.childElementCount > 0 || code.dataset.lineSplit) {
        return;
      }
      code.dataset.lineSplit = 'true';
      const fragment = document.createDocumentFragment();
      (code.textContent ?? '').split('\n').forEach((line, index, lines) => {
        const span = document.createElement('span');
        span.className = 'line';
        span.textContent = line;
        fragment.appendChild(span);
        if (index < lines.length - 1) {
          fragment.appendChild(document.createTextNode('\n'));
        }
      });
      code.replaceChildren(fragment);
    });
  };

  /* Chroma wraps every source line in <span class="line"><span class="cl">
     …\n</span></span> — the preserved trailing newline renders a phantom empty
     row in the block layout and would be counted by the wrap-marker
     measurement below. Drop it. */
  const trimChromaLineBreaks = () => {
    document.querySelectorAll<HTMLElement>('pre code .line').forEach(line => {
      if (line.dataset.lineTrimmed) {
        return;
      }
      line.dataset.lineTrimmed = 'true';
      const texts: Text[] = [];
      const collect = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').length > 0) {
          texts.push(node as Text);
        } else {
          node.childNodes.forEach(collect);
        }
      };
      Array.from(line.childNodes).forEach(collect);
      const last = texts[texts.length - 1];
      const text = last?.textContent ?? '';
      if (last && text.endsWith('\n')) {
        last.textContent = text.slice(0, -1);
      }
    });
  };

  /* Insert the ↪ marker at the start of every visual continuation row (one
     monospace advance, inline). Row boundaries are read from the rendered
     text with single-character Ranges. Inserting a marker pushes the row's
     last char onto the next row, so the marker inserted at the measured
     boundary ends up one char late inside the paginated row ("second
     char"). The fix is a closed loop: after each placement, re-measure the
     layout WITH the markers in place, move the markers to the newly measured
     starts, and repeat until the measured starts equal the marker positions
     (fixed point). Then the marker sits exactly at the paginated row start.
     Marker text is always skipped while measuring, so the markers
     themselves are never mistaken for row starts, and re-placement from
     clean text keeps every round idempotent. Vivliostyle ignores absolute
     positioning, hence the inline marker. */
  const markWrappedLines = () => {
    document.querySelectorAll<HTMLElement>('pre code .line').forEach(line => {
      if (line.clientHeight === 0) {
        return;
      }

      Array.from(line.querySelectorAll<HTMLElement>('.line-wrap-marker')).forEach(marker => marker.remove());
      line.normalize();

      const lineStyle = window.getComputedStyle(line);
      const fontSize = parseFloat(lineStyle.fontSize) || 12;
      const lineHeightValue = parseFloat(lineStyle.lineHeight);
      const rowTolerance = Math.max(3, (isFinite(lineHeightValue) ? lineHeightValue : fontSize * 1.2) / 2);

      /* Marker glyphs still occupy space, but must not be treated as row
         starts themselves. */
      const charEntries = (): { node: Text; local: number }[] => {
        const entries: { node: Text; local: number }[] = [];
        const walk = (node: Node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node as Text;
            if (text.parentElement?.classList.contains('line-wrap-marker')) {
              return;
            }
            for (let i = 0; i < (text.textContent ?? '').length; i++) {
              entries.push({ node: text, local: i });
            }
          } else {
            node.childNodes.forEach(walk);
          }
        };
        Array.from(line.childNodes).forEach(walk);
        return entries;
      };

      const topOf = (entry: { node: Text; local: number }): number | null => {
        try {
          const range = document.createRange();
          range.setStart(entry.node, entry.local);
          range.setEnd(entry.node, entry.local + 1);
          const rects = range.getClientRects();
          /* A char straddling the break can yield two rects; the LAST
             (lowest) one is the row the glyph actually sits on. Taking
             [0] attributes it to the previous row and shifts the marker
             one char late — the 'second char' defect. */
          if (rects.length === 0) return null;
          let lowest = rects[0].top;
          for (let k = 1; k < rects.length; k++) {
            if (rects[k].top > lowest) lowest = rects[k].top;
          }
          return lowest;
        } catch {
          return null;
        }
      };

      const readRowStarts = (): number[] => {
        const entries = charEntries();
        if (entries.length < 2) return [];
        const tops = entries.map(topOf);
        const indices: number[] = [];
        let previousTop: number | null = null;
        for (let i = 0; i < entries.length; i++) {
          const top = tops[i];
          if (top === null) {
            continue;
          }
          if (previousTop !== null && Math.abs(top - previousTop) > rowTolerance) {
            indices.push(i);
          }
          previousTop = top;
        }
        return indices;
      };

      /* Place markers at linear char indices (marker-stripped order, so the
         indices stay valid across remove/re-insert cycles). Insert from the
         end so earlier node/local pairs stay valid while text nodes get
         split. */
      const placeMarkers = (indices: number[]) => {
        Array.from(line.querySelectorAll<HTMLElement>('.line-wrap-marker')).forEach(marker => marker.remove());
        if (indices.length === 0) return;
        const entries = charEntries();
        for (const index of [...indices].sort((a, b) => b - a)) {
          const entry = entries[index];
          if (!entry) continue;
          const marker = document.createElement('span');
          marker.className = 'line-wrap-marker';
          marker.textContent = '↪';
          if (entry.local > 0) {
            const tail = entry.node.splitText(entry.local);
            entry.node.parentNode?.insertBefore(marker, tail);
          } else {
            entry.node.parentNode?.insertBefore(marker, entry.node);
          }
        }
      };

      let positions = readRowStarts();
      if (positions.length === 0) {
        return;
      }
      const samePositions = (a: number[], b: number[]) =>
        a.length === b.length && a.every((v, k) => v === b[k]);
      let measured = positions;
      for (let round = 0; round < 10; round++) {
        placeMarkers(measured);
        const next = readRowStarts();
        if (samePositions(next, measured)) {
          measured = next;
          break;
        }
        measured = next;
      }
      placeMarkers(measured);
    });
  };

  /* The SPARQL result table lives in the component's shadow root, where the
     PDF stylesheet cannot reach it. Apply print-friendly table rules to
     every oxigraph-sparql host once its shadow root is available; the host
     itself already spans both columns via .script in article-pdf.scss. */
  const styleShadowResultTables = () => {
    document.querySelectorAll<HTMLElement>('oxigraph-sparql').forEach(host => {
      const shadow = host.shadowRoot;
      if (!shadow || shadow.querySelector('style[data-pdf-table-style]')) {
        return;
      }
      const style = document.createElement('style');
      style.setAttribute('data-pdf-table-style', '');
      style.textContent = `
        :host, .wrapper, .results-section, .bindings-result, .table-wrap {
          display: block;
          width: 100%;
          max-width: none;
        }
        .table-wrap { overflow: visible; margin: 0; }
        table { width: 100%; }
        thead th { white-space: normal; overflow-wrap: anywhere; }
        tbody td {
          max-width: none;
          overflow: visible;
          text-overflow: clip;
          white-space: normal;
          overflow-wrap: anywhere;
        }
      `;
      shadow.appendChild(style);
    });
  };

  /* Limit caption boxes (figcaption and gallery hidden captions) to 1.5× the
     width of their image so they don't span the full text width when the
     image is narrower. Idempotent, re-run until images are loaded. */
  const sizeCaptions = () => {
    document.querySelectorAll<HTMLElement>('figure').forEach(fig => {
      const img = fig.querySelector('img');
      const cap = (fig.querySelector('figcaption') ?? fig.querySelector('.hidden-caption-content')) as HTMLElement | null;
      if (!img || !cap || cap.dataset.captionSized) {
        return;
      }
      const avail = fig.parentElement?.clientWidth ?? 0;
      const iw = img.getBoundingClientRect().width;
      if (!avail || !iw || !img.naturalWidth) {
        return;
      }
      const capMax = Math.min(iw * 1.5, avail);
      if (capMax >= avail - 1) {
        /* image is (nearly) full width, keep the caption width as-is */
        cap.style.textAlign = 'center';
        cap.dataset.captionSized = 'full';
        return;
      }
      cap.style.maxWidth = `${capMax}px`;
      cap.style.marginInline = 'auto';
      cap.style.textAlign = 'center';
      cap.dataset.captionSized = 'true';
    });
  };

  const tryMeasure = (attempts: number) => {
    splitPlainCodeLines();
    trimChromaLineBreaks();
    markWrappedLines();
    styleShadowResultTables();
    sizeCaptions();
    const lines = Array.from(document.querySelectorAll<HTMLElement>('pre code .line'));
    const unlaid = lines.some(line => line.clientHeight === 0 && !line.querySelector('.line-wrap-marker'));
    const unsized = Array.from(document.querySelectorAll<HTMLElement>('figure')).some(fig =>
      fig.querySelector('img') && (fig.querySelector('figcaption') ?? fig.querySelector('.hidden-caption-content')) &&
      !((fig.querySelector('figcaption') ?? fig.querySelector('.hidden-caption-content')) as HTMLElement | null)?.dataset.captionSized);
    const unstyled = Array.from(document.querySelectorAll<HTMLElement>('oxigraph-sparql'))
      .some(host => !host.shadowRoot?.querySelector('style[data-pdf-table-style]'));
    if ((unlaid || unsized || unstyled) && attempts > 0) {
      requestAnimationFrame(() => tryMeasure(attempts - 1));
    }
  };

  if (typeof customElements !== 'undefined' && customElements.whenDefined) {
    customElements.whenDefined('oxigraph-sparql').then(() => {
      styleShadowResultTables();
      requestAnimationFrame(styleShadowResultTables);
    });
  }

  tryMeasure(20);
});
