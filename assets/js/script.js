let mql = window.matchMedia('(max-width: 35em)');

if (!mql.matches) {
    var sticky = new Sticky('#head');
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
});
