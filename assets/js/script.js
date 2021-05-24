(function ($) {
  'use strict';

  var options = {
      /* offset: $(window).height() */
      offset: 150,
  };
  var header = new Headroom(document.getElementById('head'), options);
  header.init();

})(jQuery);
