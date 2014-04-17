
/*! 
 *
 * @fileOverview Touch.js
 * @version 1.0
 * 
 * @author BYU Web Community
 * @see https://github.com/byuweb/
 * @see https://github.com/byuweb/byu-responsive-dev/
 * @see https://github.com/byuweb/byu-responsive-dev/blob/gh-pages/src/js/touch.js
 */

(function() {
  (function($) {
    "use strict";
    $(function() {
      var swipewidth, width;
      width = $(window).width();
      swipewidth = Math.floor(width * 0.16);
      if (swipewidth > 150) {
        swipewidth = 150;
      }
      if (swipewidth < 50) {
        swipewidth = 50;
      }
      $(".portfolio .project").swipe({
        swipeLeft: function(event, direction, distance, duration, fingerCount) {},
        swipeRight: function(event, direction, distance, duration, fingerCount) {},
        triggerOnTouchEnd: false,
        threshold: swipewidth
      });
    });
  })(jQuery);

}).call(this);
