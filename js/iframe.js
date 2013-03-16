function frameScroll(cond,options) {
	// オプション - 呼び出し元で指定
	var c = jQuery.extend({
		duration : 200,
		easing : 'swing',
		step : 300
	}, options || {});

	// frameScroll内で使う変数
	var d = document, content = jQuery.support.boxModel ? navigator.appName
			.match(/Opera/) ? 'html' : 'html,body' : 'body', scrollPos = d.body.scrollTop
			|| d.documentElement.scrollTop;

	// starterなら一番上、upなら上へ、downなら下へ
	this.scrollTop = cond.match(/starter/) ? 0
			: cond.match(/up/) ? scrollPos + c.step : scrollPos - c.step;
	this.documentHeight = jQuery('body').attr('scrollHeight');
	//スクロール
	jQuery(content).animate({
		scrollTop : this.scrollTop
	}, {
		duration : c.duration,
		easing : c.easing,
		queue : false
	});
	return this;
}