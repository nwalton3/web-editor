/*! 

* @fileOverview Touch.js
* @version 1.0
* 
* @author BYU Web Community
* @see https://github.com/byuweb/
* @see https://github.com/byuweb/byu-responsive-dev/
* @see https://github.com/byuweb/byu-responsive-dev/blob/gh-pages/src/js/touch.js
*/


(function ($) {

	"use strict";


	// Document ready - Execute on page load
	$(function() {

		var width = $(window).width(),
			swipewidth = Math.floor(width * 0.16);

		if( swipewidth > 150 ) {
			swipewidth = 150;
		}

		if( swipewidth < 50 ) {
			swipewidth = 50;
		}

		//Enable swiping...
		$(".portfolio .project").swipe( {

			
			// Swipe left: close the side nav if it's open
			swipeLeft:function(event, direction, distance, duration, fingerCount) {
				
			},

			// Swipe right: open the side nav if it's closed
			swipeRight:function(event, direction, distance, duration, fingerCount) {
				
			},

			// Will trigger as soon as swipewidth is reached rather than waiting until the end of the swipe
			triggerOnTouchEnd:false,

			// Default is 75px. Set to swipewidth (defined above)
			threshold:swipewidth
		});


	});


}(jQuery));
