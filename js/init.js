$(document).ready(function(){
						   
	// Homepage Slideshow
	if ($('#slideshow').length > 0) {
		$('#slideshow').slidertron({
			viewerSelector:			'.viewer',
			reelSelector:			'.viewer .reel',
			slidesSelector:			'.viewer .reel .slide',
			linkSelector:			'.link',
			navPreviousSelector:	'.previous',
			navNextSelector:		'.next',
			speed:					'slow'
		});
	}

});
