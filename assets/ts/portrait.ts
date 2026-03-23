export function setupFullscreenImage(selector: string, imageUrl: string) {
  const element = document.querySelector(selector);
  if (element) {
    element.addEventListener("click", (e) => {
      e.preventDefault();
      
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

      // Handle fade out and removal
      overlay.onclick = () => {
        overlay.style.opacity = "0";
        overlay.addEventListener("transitionend", () => {
          overlay.remove();
        }, { once: true });
      };
    });
  }
}

(window as any).setupFullscreenImage = setupFullscreenImage;

window.addEventListener('DOMContentLoaded', (event) => {
  setupFullscreenImage('.section-contact .section-content-body strong', '/about/contact/self-portrait.jpg');
});