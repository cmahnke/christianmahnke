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
  document.querySelectorAll('details').forEach(el => el.open = true);

  /* Plain code blocks (no chroma line wrappers) get their text split into
     .line spans so the wrap-marker logic below applies to them too.
     Idempotent: after the split the block has element children. */
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

  /* Insert the ↩ markers: for each .line the visual rows are measured with a
     Range (one rect per rendered line) and a marker is inserted INLINE at the
     start of every continuation row, before the wrapped characters. No
     absolute positioning — Vivliostyle does not honor it and would push the
     marker onto its own line. */
  const markWrappedLines = () => {
    document.querySelectorAll<HTMLElement>('pre code .line').forEach(line => {
      if (line.querySelector('.line-wrap-marker') || line.clientHeight === 0) {
        return;
      }

      // Text nodes in document order with their cumulative offsets.
      const nodes: { node: Text; start: number }[] = [];
      let total = 0;
      const collect = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          nodes.push({ node: node as Text, start: total });
          total += node.textContent?.length ?? 0;
        } else {
          node.childNodes.forEach(collect);
        }
      };
      Array.from(line.childNodes).forEach(collect);
      if (total === 0 || nodes.length === 0) {
        return;
      }

      const range = document.createRange();
      const rowsAt = (offset: number): number => {
        try {
          range.setStart(nodes[0].node, 0);
          for (const entry of nodes) {
            if (offset <= entry.start + entry.node.length) {
              range.setEnd(entry.node, offset - entry.start);
              break;
            }
          }
          return range.getClientRects().length;
        } catch {
          return 0;
        }
      };

      const rows = rowsAt(total);
      if (rows < 2) {
        return;
      }

      // The offsets where each continuation row starts, measured before any
      // insertion (the covered row count only grows with the offset, so a
      // binary search finds each boundary).
      const starts: number[] = [];
      for (let row = 1; row < rows; row++) {
        let low = 0;
        let high = total;
        while (high - low > 1) {
          const mid = Math.floor((low + high) / 2);
          if (rowsAt(mid) > row) {
            high = mid;
          } else {
            low = mid;
          }
        }
        starts.push(high);
      }

      // Insert from the last wrap backwards, so the earlier (node, local)
      // mappings stay valid while text nodes get split.
      for (const offset of starts.reverse()) {
        let node: Text | null = null;
        let local = 0;
        for (const entry of nodes) {
          if (offset <= entry.start + entry.node.length) {
            node = entry.node;
            local = offset - entry.start;
            break;
          }
        }
        if (node === null) {
          continue;
        }
        const marker = document.createElement('span');
        marker.className = 'line-wrap-marker';
        marker.textContent = '↩';
        if (local > 0) {
          const tail = node.splitText(local);
          node.parentNode?.insertBefore(marker, tail);
        } else {
          node.parentNode?.insertBefore(marker, node);
        }
      }
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
    markWrappedLines();
    sizeCaptions();
    const lines = Array.from(document.querySelectorAll<HTMLElement>('pre code .line'));
    const unlaid = lines.some(line => line.clientHeight === 0 && !line.querySelector('.line-wrap-marker'));
    const unsized = Array.from(document.querySelectorAll<HTMLElement>('figure')).some(fig =>
      fig.querySelector('img') && (fig.querySelector('figcaption') ?? fig.querySelector('.hidden-caption-content')) &&
      !((fig.querySelector('figcaption') ?? fig.querySelector('.hidden-caption-content')) as HTMLElement | null)?.dataset.captionSized);
    if ((unlaid || unsized) && attempts > 0) {
      requestAnimationFrame(() => tryMeasure(attempts - 1));
    }
  };

  tryMeasure(20);
});
