export function showFullscreenImage(imageUrl: string) {
  // Create overlay container
  const overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.9)",
    zIndex: "10000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: "0",
    transition: "opacity 0.3s ease-in-out",
    cursor: "zoom-out",
  });

  // Create image element
  const img = document.createElement("img");
  img.src = imageUrl;
  Object.assign(img.style, {
    maxWidth: "90%",
    maxHeight: "90%",
    objectFit: "contain",
    boxShadow: "0 0 20px rgba(0,0,0,0.5)",
  });

  overlay.appendChild(img);
  document.body.appendChild(overlay);

  // Trigger fade in
  requestAnimationFrame(() => {
    overlay.style.opacity = "1";
  });

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      overlay.click();
    }
  };

  // Handle fade out and removal
  overlay.onclick = () => {
    overlay.style.opacity = "0";
    overlay.addEventListener("transitionend", () => {
      overlay.remove();
    }, { once: true });
    document.removeEventListener("keydown", handleKeydown);
  };

  document.addEventListener("keydown", handleKeydown);
}

export function setupFullscreenImage(selector: string, imageUrl: string) {
  const element = document.querySelector(selector);
  if (element) {
    element.addEventListener("click", (e) => {
      e.preventDefault();
      showFullscreenImage(imageUrl);
    });
  }
}

(window as any).setupFullscreenImage = setupFullscreenImage;
(window as any).showFullscreenImage = showFullscreenImage;

const image = '/about/contact/self-portrait.jpg';

window.addEventListener('DOMContentLoaded', (event) => {
  setupFullscreenImage('.section-contact .section-content-body strong', image);
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' || event.key === 'Esc') {
      showFullscreenImage(image);
    }
  });
});