#! 
# script.js 


# Variables
assetBase = (if window.assets then window.assets else "")
savedSelection = undefined


# On page load
$(document).ready ->
	
	rangy.init()

	$("#addLink").modal show: false

	# Document Bindings
	$(document).on("mouseup", handleSelection).on "keyup", handleSelection

	# Button bindings
	$(".add-bold").on "click", ->
		toggleTag "strong"
	$(".add-italic").on "click", ->
		toggleTag "em"
	$(".add-link").on "click", addLink
	$("#addLink .save").on "click", addURL
	$("#addLink .cancel").on "click", removeLink





# Func: handleSelection
# Desc: Check to see if any text is selected. If so, mark the selection in the DOM using setSelectionMarker.
# Args: none

handleSelection = ->
	checkSelectedText()
	handleTextEditBox()


toggleTag = (tag, newClass) ->
	range = addWrapper()
	thisClass = (if newClass then "." + newClass else "")
	tagSelector = tag + thisClass
	curr = $(".currentSelection")
	wrapped = curr.closest(tagSelector).size() > 0 or curr.find(tagSelector) > 0
	if wrapped
		curr.closest(tagSelector).contents().unwrap()
		curr.find(tagSelector).contents().unwrap()
	else
		surroundRange tag, newClass, range
	removeWrapper()
	rangy.restoreSelection savedSelection
	return

addURL = ->
	$("#addLink").modal "hide"
	rangy.restoreSelection savedSelection
	return
removeLink = ->
	$("#addLink").modal "hide"
	rangy.restoreSelection savedSelection
	return
addLink = ->
	curr = undefined
	toggleTag "a"
	addWrapper()
	curr = $(".currentSelection").parent("a")
	$("#addLink").modal "show"  if curr.size()
	return
addWrapper = ->
	range = getFirstRange()
	surroundRange "span", "currentSelection", range
	range
removeWrapper = ->
	$(".currentSelection").contents().unwrap()
	return
hideTextEditBox = ->
	$(".textEditBar").addClass "hidden"
	return


# Func: handleTextEditBox
# Desc: Position the correct text edit box relative to the selection
# Args: none

handleTextEditBox = ->
	selectionMarker = $(".rangySelectionBoundary").css("display", "inline").first()
	editBar = $(".textEditBar")
	sPos = selectionMarker.position()
	top = sPos.top - editBar.height() - 15
	left = sPos.left - 15
	if selectionMarker
		editBar.removeClass "hidden"
		top = sPos.top - editBar.height() - 15
		left = sPos.left - 15
		$(".textEditBar").css("top", top).css "left", left
	else
		$(".textEditBar").hide()
	return


# Func: checkSelectedText
# Desc: Check to see if any text is selected. If so, mark the selection in the DOM using setSelectionMarker.
# Args: none

checkSelectedText = ->
	sel = rangy.getSelection()
	selectedText = sel.toString()
	hasSelection = false
	if selectedText
		hasSelection = setSelectionMarker()
	else
		hideTextEditBox()
		hasSelection = setCursorMarker()
	return


# Func: setCursorMarker
# Desc: Set a marker at the position of the cursor
# Args: none

setCursorMarker = ->
	range = getFirstRange()
	parent = $(range.startContainer)
	cursorActive = parent.closest(".editable").size() > 0
	clearSelectionMarkers()
	
	#surroundRange('span', 'cursorSelection rangySelectionBoundary', range);
	false  if cursorActive


# Func: clearCursorMarker
# Desc: Remove all cursor markers
# Args: none

clearCursorMarker = ->
	$(".cursorSelection").remove()
	return


# Func: clearSelectionMarkers
# Desc: Remove all selection markers, including cursor marker, from the text
# Args: none

clearSelectionMarkers = ->
	clearCursorMarker()
	if savedSelection
		rangy.removeMarkers savedSelection
		savedSelection = null
		normalizeText()
	return


# Func: setSelectionMarker
# Desc: Mark the beginning and end of the current selection with empty elements.
# Args: none

setSelectionMarker = ->
	clearSelectionMarkers()
	savedSelection = rangy.saveSelection()
	return


# Func: getFirstRange
# Desc: Get the selection object from the rangy object.
# Args: none

getFirstRange = ->
	sel = rangy.getSelection()
	(if sel.rangeCount then sel.getRangeAt(0) else null)


# Func: normalizeText
# Desc: When HTML nodes are added and removed, it leaves split text nodes within an element.
# 		This combines the text nodes together again.
# Args: none

normalizeText = ->
	range = getFirstRange()
	sCon = range.startContainer
	eCon = range.endContainer
	try
		sCon.parentNode.normalize()
		eCon.parentNode.normalize()
	return


# Func: surroundRange
# Desc: Wrap the range in the specified HTML element, with optional class
# Args: @newElement - A string representing the HTML element to wrap the selection in (i.e. "div")
# 		@elClass - OPTIONAL - A class to give to the wrapper element
# 		@inputRange - OPTIONAL - A rangy range object (will use the getFirstRange function if this is omitted)

surroundRange = (newElement, elClass, inputRange) ->
	range = (if inputRange then inputRange else getFirstRange())
	elementClass = (if elClass then elClass else "")
	if range
		el = document.createElement(newElement)
		el.className = elementClass
		try
			range.surroundContents el
		catch ex
			if (ex instanceof rangy.RangeException or Object::toString.call(ex) is "[object RangeException]") and ex.code is 1
				console.log "Unable to surround range because range partially selects a non-text node. See DOM Level 2 Range spec for more information.\n\n" + ex
			else
				console.log "Unexpected errror: " + ex
	rangy.getSelection().setSingleRange range
	range.refresh()
	return


# Func: makeSelectionWrappable
# Desc: Expand the selection so it can legitimately be wrapped in enclosing tags, based on HTML syntax.
# 		Returns the smallest wrappable range based on the input range.
# Args: @inputRange - OPTIONAL - A rangy range object (will use the getFirstRange function if this is omitted)

makeSelectionWrappable = (inputRange) ->
	range = (if inputRange then inputRange else getFirstRange())
	
	# Make sure the range really isn't valid. If it is, we're done :)
	return range  if range.canSurroundContents()
	console.log "Can't surround contents"
	console.log range.startOffset
	console.log range.endOffset
	range.setStartBefore range.startContainer
	range.setEndAfter range.endContainer
	console.log range.startOffset
	console.log range.endOffset
	console.log range
	range


