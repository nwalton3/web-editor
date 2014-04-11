/*! init.js 

	This script loader uses Modernizr.load syntax (an alias of yepnope).
	
	Documentation found at: 
		http://modernizr.com/docs/#load
		http://yepnopejs.com/
*/

(function () {

	"use strict";

	if ( !window.assets ) { window.assets = '/'; }
	if ( !window.jsVersion ) { window.jsVersion = 1; }

	// Load scripts
	Modernizr.load([
		
		// If touch is enabled, load alternate script file with touch support added.
		{
			test: Modernizr.touch,
			nope: window.assets + "js/script.min.js?v=" + window.jsVersion,
			yep:  window.assets + "js/script-touch.min.js?v=" + window.jsVersion
		}

	]);

}());