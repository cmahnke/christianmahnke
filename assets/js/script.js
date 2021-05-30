var sticky = new Sticky('#head');

enterView({
	selector: '.type-text',
	enter: function(el) {
		el.classList.add('show');
	},
    offset: 0.5,
	once: true
});

/*
function mobileMenu() {
    $('body').on('click', '.js-fh5co-nav-toggle', function(event){

        var $this = $(this);

        if( $('body').hasClass('mobileMenu-active') ) {
            $('body').removeClass('mobileMenu-active);
            $this.removeClass('active');
        } else {
            $('body').addClass('offcanvas-visible fh5co-overflow');
            $this.addClass('active');
        }

        event.preventDefault();

    });
}
*/


/*
(function ($) {
  'use strict';
  var options = {
      offset: 40,
  };
  var header = new Headroom(document.getElementById('head'), options);
  header.init();

})(jQuery);
*/
