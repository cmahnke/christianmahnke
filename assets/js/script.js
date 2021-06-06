let mql = window.matchMedia('(max-width: 35em)');

if (!mql.matches) {
    var sticky = new Sticky('#head');
}

enterView({
	selector: '.type-text',
	enter: function(el) {
		el.classList.add('show');
	},
    offset: 0.25,
	once: true
});

enterView({
	selector: '.iframe-wrapper',
	enter: function(el) {
		el.classList.add('show');
	},
    offset: 0.45,
	once: true
});
