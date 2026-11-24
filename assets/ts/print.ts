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

  /* Insert the ↪ marker at the start of every visual continuation row. Code
     uses a monospaced font with word-break: break-all, so row capacities can
     be computed from the glyph width; single-character Ranges only correct
     subpixel off-by-one boundaries. The marker uses a proportional font, so
     its width is measured separately and reserved on continuation rows.
     Each pass starts from clean text, so repeated tryMeasure rounds cannot
     accumulate duplicate markers. Vivliostyle ignores absolute positioning,
     hence the inline marker. */
  const markWrappedLines = () => {
    document.querySelectorAll<HTMLElement>('pre code .line').forEach(line => {
      if (line.clientHeight === 0) {
        return;
      }

      Array.from(line.querySelectorAll<HTMLElement>('.line-wrap-marker')).forEach(marker => marker.remove());
      line.normalize();

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
      if (total === 0) {
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

      /* Preserved trailing whitespace would otherwise count as a row. */
      let end = total;
      while (end > 0 && /\s/.test(charAt(end - 1))) {
        end--;
      }
      if (end < 2) {
        return;
      }

      const code = line.closest('code');
      if (!code) {
        return;
      }
      const probe = document.createElement('span');
      probe.textContent = '0000000000';
      probe.style.visibility = 'hidden';
      probe.style.whiteSpace = 'pre';
      const markerProbe = document.createElement('span');
      markerProbe.className = 'line-wrap-marker';
      markerProbe.textContent = '↪';
      markerProbe.style.visibility = 'hidden';
      code.appendChild(probe);
      code.appendChild(markerProbe);
      const charWidth = probe.getBoundingClientRect().width / 10;
      const markerWidth = markerProbe.getBoundingClientRect().width;
      probe.remove();
      markerProbe.remove();
      if (!(charWidth > 0)) {
        return;
      }

      const codeStyle = window.getComputedStyle(code);
      const contentWidth = code.clientWidth - parseFloat(codeStyle.paddingLeft) - parseFloat(codeStyle.paddingRight);
      if (!(contentWidth > 0)) {
        return;
      }
      /* .line has padding-left: 2ch and text-indent: -2ch: the first row
         starts 2ch to the left and gets the full width, continuation rows
         are indented by 2ch and additionally carry the marker. */
      const firstCapacity = Math.max(1, Math.floor(contentWidth / charWidth + 0.01));
      const continuationCapacity = Math.max(1, Math.floor((contentWidth - 2 * charWidth - markerWidth) / charWidth + 0.01));

      const lineStyle = window.getComputedStyle(line);
      const fontSize = parseFloat(lineStyle.fontSize) || 12;
      const lineHeightValue = parseFloat(lineStyle.lineHeight);
      const rowTolerance = Math.max(3, (isFinite(lineHeightValue) ? lineHeightValue : fontSize * 1.2) / 2);

      const charTop = (offset: number): number | null => {
        for (const entry of nodes) {
          if (offset < entry.start + entry.node.length) {
            try {
              const range = document.createRange();
              range.setStart(entry.node, offset - entry.start);
              range.setEnd(entry.node, offset - entry.start + 1);
              const rect = range.getClientRects()[0];
              return rect ? rect.top : null;
            } catch {
              return null;
            }
          }
        }
        return null;
      };

      const predicted: number[] = [];
      let row = 0;
      let used = 0;
      let pending = -1;
      for (let i = 0; i < end; i++) {
        if (used >= (row === 0 ? firstCapacity : continuationCapacity)) {
          row++;
          used = 0;
          pending = i;
        }
        if (pending >= 0 && !/\s/.test(charAt(i))) {
          predicted.push(pending);
          pending = -1;
        }
        used++;
      }
      if (predicted.length === 0) {
        return;
      }

      const starts: number[] = [];
      for (const candidate of predicted) {
        let boundary = candidate;
        let bestDistance = Infinity;
        const lo = Math.max(1, candidate - 4);
        const hi = Math.min(end - 1, candidate + 4);
        for (let i = lo; i <= hi; i++) {
          const before = charTop(i - 1);
          const after = charTop(i);
          if (before === null || after === null || Math.abs(after - before) <= rowTolerance) {
            continue;
          }
          const distance = Math.abs(i - candidate);
          if (distance < bestDistance) {
            bestDistance = distance;
            boundary = i;
          }
        }
        while (boundary < end && /\s/.test(charAt(boundary))) {
          boundary++;
        }
        if (boundary < end && !starts.includes(boundary)) {
          starts.push(boundary);
        }
      }
      if (starts.length === 0) {
        return;
      }

      /* Insert from the last offset backwards so earlier node/local mappings
         stay valid while text nodes get split. */
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
        marker.textContent = '↪';
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
