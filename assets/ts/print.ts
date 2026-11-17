
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('details').forEach(el => el.open = true);
});

const addWrapMarkers = () => {
  document.querySelectorAll('pre').forEach((pre) => {
    const preRect = pre.getBoundingClientRect();
    pre.querySelectorAll('code .line').forEach((line) => {
      const rects = line.getClientRects();
      if (rects.length < 2) {
        return;
      }
      for (let i = 1; i < rects.length; i++) {
        const marker = document.createElement('span');
        marker.className = 'wrap-marker';
        marker.textContent = '↪';
        marker.style.top = `${rects[i].top - preRect.top}px`;
        pre.appendChild(marker);
      }
    });
  });
};

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => addWrapMarkers());
} else {
  window.addEventListener('load', () => addWrapMarkers());
}
