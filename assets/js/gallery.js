import PhotoSwipeLightbox from 'photoswipe/lightbox';
import PhotoSwipe from 'photoswipe';

function photoswipe(id, children) {
  const lightbox = new PhotoSwipeLightbox({
    gallery: id,
    children: children,
    showHideAnimationType: 'zoom',
    pswpModule: PhotoSwipe
  });
  lightbox.init();
}

window.photoswipe = photoswipe;
