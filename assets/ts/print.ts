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
     Idempotent: after the split the block has element children. The spans are
     display:block in print, so no newline separators go between them —
     preserved newlines would render phantom empty rows. */
  const splitPlainCodeLines = () => {
    document.querySelectorAll<HTMLElement>('pre code').forEach(code => {
      if (code.childElementCount > 0 || code.dataset.lineSplit) {
        return;
      }
      code.dataset.lineSplit = 'true';
      const fragment = document.createDocumentFragment();
      (code.textContent ?? '').split('\n').forEach(line => {
        const span = document.createElement('span');
        span.className = 'line';
        span.textContent = line;
        fragment.appendChild(span);
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

  /* Insert the ↩ markers: for each .line the visual rows are measured with
     Ranges confined to the content text nodes — markers inserted by earlier
     rounds are excluded from both the offset bookkeeping and the rects, so
     the measurement is stable and cannot feed back on itself (markers that
     take part in the measurement wrap one per row and multiply). Element
     fragments sharing one row (chroma wraps every token and whitespace run
     in its own span) are deduplicated by their top coordinate, so the count
     follows the rendered rows and not the DOM fragments. A marker is
     inserted INLINE before the first character of every continuation row. No
     absolute positioning — Vivliostyle does not honor it and would push the
     marker onto its own line. */
  /* Content offsets per .line, remembered across invocations: tryMeasure
     re-runs while other content is still laying out, and a fresh set would
     re-mark the same rows on every retry. */
  const markedLines = new WeakMap<HTMLElement, Set<number>>();

  const markWrappedLines = () => {
    document.querySelectorAll<HTMLElement>('pre code .line').forEach(line => {
      if (line.clientHeight === 0) {
        return;
      }

      const inMarker = (node: Text): boolean => {
        let el = node.parentElement;
        while (el && el !== line) {
          if (el.classList.contains('line-wrap-marker')) {
            return true;
          }
          el = el.parentElement;
        }
        return false;
      };

      /* Content offsets never change between rounds (markers are invisible
         to the measurement), so remembering the marked offsets makes any
         later round a no-op. */
      let markedOffsets = markedLines.get(line);
      if (!markedOffsets) {
        markedOffsets = new Set<number>();
        markedLines.set(line, markedOffsets);
      }

      /* A handful of rounds: every insertion round can create further wraps. */
      for (let round = 0; round < 8; round++) {
        // Content text nodes in document order with their cumulative offsets
        // (marker characters are excluded entirely, keeping the offsets
        // stable across rounds and invocations).
        const nodes: { node: Text; start: number }[] = [];
        let total = 0;
        const collect = (node: Node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            if (!inMarker(node as Text)) {
              nodes.push({ node: node as Text, start: total });
              total += node.textContent?.length ?? 0;
            }
          } else {
            node.childNodes.forEach(collect);
          }
        };
        Array.from(line.childNodes).forEach(collect);
        if (total === 0 || nodes.length === 0) {
          return;
        }

        const charAt = (offset: number): string => {
          for (const entry of nodes) {
            if (offset < entry.start + entry.node.length) {
              return (entry.node.textContent ?? '').charAt(offset - entry.start);
            }
          }
          return '';
        };

        /* Measure up to the last non-whitespace character: preserved trailing
           whitespace would otherwise count as an extra (phantom) row. */
        let end = total;
        while (end > 0 && /\s/.test(charAt(end - 1))) {
          end--;
        }
        if (end === 0) {
          return;
        }

        const lineStyle = window.getComputedStyle(line);
        const fontSize = parseFloat(lineStyle.fontSize) || 12;
        const lineHeightValue = parseFloat(lineStyle.lineHeight);
        const rowTolerance = Math.max(3, (isFinite(lineHeightValue) ? lineHeightValue : fontSize * 1.2) / 3);

        /* Rows of the content prefix [0, offset): every content node is
           measured with its own (sub-)range — one rect per row per node —
           and the tops are merged. Ranges spanning several elements would
           include the marker spans between them. */
        const rowsAt = (offset: number): number => {
          const tops: number[] = [];
          for (const entry of nodes) {
            if (entry.start >= offset) {
              break;
            }
            const localEnd = Math.min(entry.node.length, offset - entry.start);
            try {
              const range = document.createRange();
              range.setStart(entry.node, 0);
              range.setEnd(entry.node, localEnd);
              const rects = range.getClientRects();
              for (let i = 0; i < rects.length; i++) {
                const top = rects[i].top;
                if (tops.every(t => Math.abs(t - top) >= rowTolerance)) {
                  tops.push(top);
                }
              }
            } catch {
              return 0;
            }
          }
          return tops.length;
        };

        const rows = rowsAt(end);
        if (rows < 2) {
          return;
        }

        // The offsets where each continuation row starts, measured on the
        // current layout (the covered row count only grows with the offset,
        // so a binary search finds each boundary). The search yields the
        // first offset whose prefix reaches INTO the row (one past its first
        // character — a range only counts a row once it includes one of its
        // characters), so the marker goes before high - 1.
        const starts: number[] = [];
        for (let row = 1; row < rows; row++) {
          let low = 0;
          let high = end;
          while (high - low > 1) {
            const mid = Math.floor((low + high) / 2);
            if (rowsAt(mid) > row) {
              high = mid;
            } else {
              low = mid;
            }
          }
          const offset = high - 1;
          if (offset < 0 || markedOffsets.has(offset)) {
            continue;
          }
          markedOffsets.add(offset);
          starts.push(offset);
        }

        if (starts.length === 0) {
          return;
        }
        // Insert from the last wrap backwards, so the earlier (node, local)
        // mappings stay valid while text nodes get split.
        for (const offset of starts.reverse()) {
          let node: Text | null = null;
          let local = 0;
          for (const entry of nodes) {
            if (offset < entry.start + entry.node.length) {
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
    trimChromaLineBreaks();
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
