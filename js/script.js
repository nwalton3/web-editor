/*! 
 * script.js 
 */


// Variables
var assetBase = window.assets ? window.assets : '';
var savedSelection;


// On page load
$(document).ready(function(){

	rangy.init();
	$('#addLink').modal({show: false, });

	// Text selection
	$(document)
		.on('mouseup', handleSelection)
		.on('keyup', handleSelection);
	//$('.editable')
	//	.on('blur', hideTextEditBox);

	// Buttons
	$('.add-bold').on('click', function(){ toggleTag('strong'); } );
	$('.add-italic').on('click', function(){ toggleTag('em'); } );
	$('.add-link').on('click', addLink );
	$('#addLink .save').on('click', addURL);
	$('#addLink .cancel').on('click', removeLink);

});



/* 
 * Func: handleSelection
 * Desc: Check to see if any text is selected. If so, mark the selection in the DOM using setSelectionMarker.
 * Args: none
 */
function handleSelection() {

	checkSelectedText();
	handleTextEditBox();
}

function toggleTag(tag, newClass) {
	var range = addWrapper();
	var thisClass = newClass ? "." + newClass : "";
	var tagSelector = tag + thisClass;
	var curr = $('.currentSelection');
	var wrapped = curr.closest( tagSelector ).size() > 0 || curr.find( tagSelector ) > 0;

	if( wrapped ) {
		curr.closest( tagSelector ).contents().unwrap();
		curr.find( tagSelector ).contents().unwrap();
	} else {
		surroundRange( tag, newClass, range);
	}

	removeWrapper();
	rangy.restoreSelection( savedSelection );
}

function addURL() {
	$('#addLink').modal('hide');
	rangy.restoreSelection( savedSelection );
}

function removeLink() {
	$('#addLink').modal('hide');
	rangy.restoreSelection( savedSelection );
}

function addLink() {
	var curr;

	toggleTag('a');
	addWrapper();

	curr = $('.currentSelection').parent('a');

	if ( curr.size() ) {
		$('#addLink').modal( 'show' );
	}
}

function addWrapper() {
	var range = getFirstRange();
	surroundRange('span', 'currentSelection', range);
	return range;
}

function removeWrapper() {
	$('.currentSelection').contents().unwrap();
}

function hideTextEditBox() {
	$('.textEditBar').addClass('hidden');
}

/* 
 * Func: handleTextEditBox
 * Desc: Position the correct text edit box relative to the selection
 * Args: none
 */
function handleTextEditBox() {
	var selectionMarker = $('.rangySelectionBoundary').css('display', 'inline').first(),
		editBar = $('.textEditBar'),
		sPos = selectionMarker.position(),
		top = sPos.top - editBar.height() - 15,
		left = sPos.left - 15;
		
	if ( selectionMarker ) {
		editBar.removeClass('hidden');
		top = sPos.top - editBar.height() - 15;
		left = sPos.left - 15;

		$('.textEditBar').css('top', top).css('left', left);
	} else {
		$('.textEditBar').hide();
	}
}


/* 
 * Func: checkSelectedText
 * Desc: Check to see if any text is selected. If so, mark the selection in the DOM using setSelectionMarker.
 * Args: none
 */
function checkSelectedText() {
	var sel = rangy.getSelection();
	var selectedText = sel.toString();
	var hasSelection = false;
	
	if (selectedText) {
		hasSelection = setSelectionMarker();
	} else {
		hideTextEditBox();
		hasSelection = setCursorMarker();
	}
}


/* Func: setCursorMarker
 * Desc: Set a marker at the position of the cursor
 * Args: none
 */
function setCursorMarker() {
	var range = getFirstRange();
	var parent = $(range.startContainer);
	var cursorActive = parent.closest('.editable').size() > 0;

	clearSelectionMarkers();

	if ( cursorActive ) {
		//surroundRange('span', 'cursorSelection rangySelectionBoundary', range);
		return false;
	}
}


/* Func: clearCursorMarker
 * Desc: Remove all cursor markers
 * Args: none
 */
function clearCursorMarker() {
	$('.cursorSelection').remove();
}


/* 
 * Func: clearSelectionMarkers
 * Desc: Remove all selection markers, including cursor marker, from the text
 * Args: none
 */
function clearSelectionMarkers() {

	clearCursorMarker();
	if ( savedSelection ) {
		rangy.removeMarkers( savedSelection );
		savedSelection = null;
		normalizeText();
	}
}


/* 
 * Func: setSelectionMarker
 * Desc: Mark the beginning and end of the current selection with empty elements.
 * Args: none
 */
function setSelectionMarker() {

	clearSelectionMarkers();
	savedSelection = rangy.saveSelection();

}


/* 
 * Func: getFirstRange
 * Desc: Get the selection object from the rangy object.
 * Args: none
 */
function getFirstRange() {
	var sel = rangy.getSelection();
	return sel.rangeCount ? sel.getRangeAt(0) : null;
}


/* 
 * Func: normalizeText
 * Desc: When HTML nodes are added and removed, it leaves split text nodes within an element.
 *			This combines the text nodes together again.
 * Args: none
 */
function normalizeText() {
	
	var range = getFirstRange(),
		sCon = range.startContainer,
		eCon = range.endContainer;

	try {
		sCon.parentNode.normalize();
		eCon.parentNode.normalize();
	} catch (e) {

	}

}


/* 
 * Func: surroundRange
 * Desc: Wrap the range in the specified HTML element, with optional class
 * Args: @newElement - A string representing the HTML element to wrap the selection in (i.e. "div")
 *		 @elClass - OPTIONAL - A class to give to the wrapper element
 *		 @inputRange - OPTIONAL - A rangy range object (will use the getFirstRange function if this is omitted)
 */
function surroundRange( newElement, elClass, inputRange ) {

	var range = inputRange ? inputRange : getFirstRange();
	var elementClass = elClass ? elClass : "";

	if (range) {
		var el = document.createElement(newElement);
		el.className = elementClass;

		try {
			range.surroundContents(el);
		} catch(ex) {
			if ((ex instanceof rangy.RangeException || Object.prototype.toString.call(ex) == "[object RangeException]") && ex.code == 1) {
				console.log("Unable to surround range because range partially selects a non-text node. See DOM Level 2 Range spec for more information.\n\n" + ex);
			} else {
				console.log("Unexpected errror: " + ex);
			}
		}
	}
	rangy.getSelection().setSingleRange(range);
	range.refresh();
}


/* 
 * Func: makeSelectionWrappable
 * Desc: Expand the selection so it can legitimately be wrapped in enclosing tags, based on HTML syntax.
 *			Returns the smallest wrappable range based on the input range.
 * Args: @inputRange - OPTIONAL - A rangy range object (will use the getFirstRange function if this is omitted)
 */
function makeSelectionWrappable( inputRange ) {
	var range = inputRange ? inputRange : getFirstRange();

	// Make sure the range really isn't valid. If it is, we're done :)
	if ( range.canSurroundContents() ) {
		return range;
	}

	console.log("Can't surround contents");

	console.log(range.startOffset);
	console.log(range.endOffset);
	range.setStartBefore(range.startContainer);
	range.setEndAfter(range.endContainer);
	console.log(range.startOffset);
	console.log(range.endOffset);
	console.log(range);

	return range;
}


/*
function gEBI(id) {
	return document.getElementById(id);
}

function reportSelectionText() {
	console.log(rangy.getSelection().getRangeAt(0));
}

function reportSelectionHtml() {
	console.log(rangy.getSelection().toHtml());
}

function inspectSelection() {
	console.log(rangy.getSelection().inspect());
}

function deleteSelection() {
	rangy.getSelection().deleteFromDocument();
}

function collapseSelectionToStart() {
	rangy.getSelection().collapseToStart();
}

function collapseSelectionToEnd() {
	rangy.getSelection().collapseToEnd();
}

function getFirstRange() {
	var sel = rangy.getSelection();
	return sel.rangeCount ? sel.getRangeAt(0) : null;
}

function showContent(frag) {
	var displayEl = gEBI("selectioncontent");
	var codeEl = gEBI("code");
	while (displayEl.firstChild) {
		displayEl.removeChild(displayEl.firstChild);
	}
	if (frag) {
		displayEl.appendChild(frag);
	}
	codeEl.value = displayEl.innerHTML;
}

function inspectRange() {
	var range = getFirstRange();
	if (range) {
		console.log(range.inspect());
	}
}

function reportRangeHtml() {
	var range = getFirstRange();
	if (range) {
		console.log(range.toHtml());
	}
}

function extractRange() {
	var range = getFirstRange();
	if (range) {
		showContent(range.extractContents());
	}
}

function cloneRange() {
	var range = getFirstRange();
	if (range) {
		showContent(range.cloneContents());
	}
}

function deleteRange() {
	var range = getFirstRange();
	if (range) {
		range.deleteContents();
	}
}



function insertNodeAtRange() {
	var range = getFirstRange();
	if (range) {
		var el = document.createElement("span");
		el.style.backgroundColor = "lightblue";
		el.style.color = "red";
		el.style.fontWeight = "bold";
		el.appendChild(document.createTextNode("**INSERTED NODE**"));
		range.insertNode(el);
		rangy.getSelection().setSingleRange(range);
	}
}

function createButton(parentNode, clickHandler, value) {
	var button = document.createElement("input");
	button.type = "button";
	button.unselectable = true;
	button.className = "unselectable";
	button.ontouchstart = button.onmousedown = function() {
		clickHandler();
		return false;
	};
	button.value = value;
	parentNode.appendChild(button);
	button = null;
}

window.onload = function() {
	rangy.init();

	// Enable multiple selections in IE
	try {
		document.execCommand("MultipleSelection", true, true);
	} catch (ex) {}

	// Create selection buttons
	var selectionButtonsContainer = gEBI("selectionButtons");
	createButton(selectionButtonsContainer, reportSelectionText, "Get selection text");
	createButton(selectionButtonsContainer, inspectSelection, "Inspect selection");
	createButton(selectionButtonsContainer, reportSelectionHtml, "Get selection HTML");
	createButton(selectionButtonsContainer, deleteSelection, "Delete selection");
	createButton(selectionButtonsContainer, collapseSelectionToStart, "Collapse to start");
	createButton(selectionButtonsContainer, collapseSelectionToEnd, "Collapse to end");

	// Create Range buttons
	var rangeButtonsContainer = gEBI("rangeButtons");
	createButton(rangeButtonsContainer, inspectRange, "Inspect");
	createButton(rangeButtonsContainer, reportRangeHtml, "Get HTML");
	createButton(rangeButtonsContainer, extractRange, "Extract");
	createButton(rangeButtonsContainer, cloneRange, "Clone");
	createButton(rangeButtonsContainer, deleteRange, "Delete");
	createButton(rangeButtonsContainer, surroundRange, "Surround (where possible)");
	createButton(rangeButtonsContainer, insertNodeAtRange, "Insert node");

	// Display the control range element in IE
	if (rangy.features.implementsControlRange) {
		gEBI("controlRange").style.display = "block";
	}
};
*/