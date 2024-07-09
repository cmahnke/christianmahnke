import PhotoSwipeLightbox from 'photoswipe/lightbox';
import PhotoSwipe from 'photoswipe';

window.photoswipe = function (id, children) {
  const lightbox = new PhotoSwipeLightbox({
    gallery: id,
    children: children,
    showHideAnimationType: 'zoom',
    //pswpModule: () => import('photoswipe')
    pswpModule: PhotoSwipe
  });
  lightbox.init();
}
