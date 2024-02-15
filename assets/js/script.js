let mql = window.matchMedia('(max-width: 35em)');

if (!mql.matches) {
    /* var sticky = new Sticky('#head');*/
    /* useGetBoundingClientRect: true, customVerticalPosition: true */
    var sticky = stickybits('#head', { useStickyClasses: true, stuckClass: "sticky-top"});
}

if (document.querySelector('.type-text')) {
  enterView({
  	selector: '.type-text',
  	enter: function(el) {
  		el.classList.add('show');
  	},
      offset: 0.25,
  	once: true
  });
}

if (document.querySelector('.iframe-wrapper')) {
  enterView({
  	selector: '.iframe-wrapper',
  	enter: function(el) {
  		el.classList.add('show');
  	},
      offset: 0.45,
  	once: true
  });
}

document.addEventListener("DOMContentLoaded", function() {
  document.querySelector('.backToTop').removeAttribute("href");
  //if (!document.querySelector('body').classList.contains('home')) {
    //console.log("Back to top button won't hide");
    document.addEventListener("scroll", function(e) {
      if (window.scrollY > window.innerHeight) {
        document.querySelector('#head').classList.add('show-top-button');
      } else {
        document.querySelector('#head').classList.remove('show-top-button');
      }
    });
  //}

});
