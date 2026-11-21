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

  const markWrappedLines = () => {
    document.querySelectorAll<HTMLElement>('pre code .line').forEach(line => {
      if (line.querySelector('.line-wrap-marker')) {
        return;
      }

      const cs = getComputedStyle(line);
      let lh = parseFloat(cs.lineHeight);
      if (!Number.isFinite(lh) || lh <= 0) {
        const probe = document.createElement('span');
        probe.style.visibility = 'hidden';
        probe.textContent = 'A';
        line.appendChild(probe);
        lh = probe.getBoundingClientRect().height;
        probe.remove();
      }
      if (!Number.isFinite(lh) || lh <= 0) {
        return;
      }

      const rows = Math.round(line.clientHeight / lh);
      if (rows < 2 || line.clientHeight === 0) {
        return;
      }

      for (let n = 1; n < rows; n++) {
        const marker = document.createElement('span');
        marker.className = 'line-wrap-marker';
        marker.textContent = '↩';
        marker.style.top = `${n * lh}px`;
        line.appendChild(marker);
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
