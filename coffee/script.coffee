#! 
# script.js 


##########################


# Variables
assetBase = (if window.assets then window.assets else "")
savedSelection = undefined
$editor = $(".editContainer")
addPlaceholder = $('.addPlaceholder')
currentPlaceholderPosition = null
moveTimer = null


# On page load
$(document).ready ->
	
	rangy.init()

	$("#addLink").modal show: false
	
	setInterval(sanitizeIfChanged, 100)

	# Document Bindings
	$(document)
		.on("mouseup", handleSelection)
		.on("keyup", handleSelection)
		.on("keydown", ->
			changed = true
			return
		)
		.on("paste", handlePaste)
		.on("drop", handleDrop)
	

	$('.editable')
		.on('mouseover', '> *', ( (e) -> handleHover e) )
		.on('mousemove', '> *', throttle ( (e) ->
			handleHover e
			return), 100 )

	# Button bindings
	$(".add-bold").on "click", (e) -> toggleTag "strong"
	$(".add-italic").on "click", (e) -> toggleTag "em"

	$(".add-link").on "click", (e) -> addLink "temporaryLink"
	$("#addLink .save").on "click", (e) -> addURL "temporaryLink", $('#linkInput').val()
	$("#addLink .cancel").on "click", (e) -> removeLink "temporaryLink"
	$("#addLink #linkInput").on "keyup", (e) -> 
		if e.keyCode is 13
			addURL "temporaryLink", $('#linkInput').val()

	$('.addPlaceholder .add-item' ).on "click", toggleAddBar
	$('.addPlaceholder .add-image').on "click", addImage
	$('.addPlaceholder .add-video').on "click", addVideo
	$('.addPlaceholder .add-audio').on "click", addAudio
	$('.addPlaceholder .add-h1'   ).on "click", addH1  
	$('.addPlaceholder .add-h2'   ).on "click", addH2  
	$('.addPlaceholder .add-quote').on "click", addQuote
	$('.addPlaceholder .add-olist').on "click", addOlist
	$('.addPlaceholder .add-ulist').on "click", addUlist
	
	return







##########################

# Functions


###
 * Func: handleSelection
 * Desc: Check to see if any text is selected. If so, activate the text edit box.
 * Args: none
###
handleSelection = ->
	if getSelectedText()
		showTextEditBox()
	return


###
 * Func: handleHover
 * Desc: Actions to perform when an editable element is hovered
 * Args: @e - jQuery Event Object - Passed from the jQuery .on() function
         @out - Boolean - Whether the hover is inside the object (mouseout = false)
###
handleHover = (e, out) ->
	t = $(e.currentTarget)
	parent = t.hasClass('editable')
	addBar = t.hasClass("addPlaceholder")

	# If this is not the container (".editable") and not the Placehoder div, see if you need to move the Placeholder
	if !parent and !addBar 
		height = t.height()
		pos = t.offset()
		top = pos.top
		bot = pos.top + height
		margin = parseInt( t.css('margin-bottom') )
		my = e.pageY

		# If the mouse position is within a specified range of the top or bottom of the element, set a flag
		nearTop = my > top and my < top + (height / 2) and my < top + 100 
		nearBot = my < (bot + margin) and my > bot - (height / 2) and my > bot - 125

		# Handle the mouse location
		if nearTop
			checkPlaceholderPosition t, "top"
		else if nearBot
			checkPlaceholderPosition t, "bottom"
		else
			hideAddButton()

	# Otherwise, just show the add button (so it doesn't flicker)
	else
		showAddButton()

	return

###
 * Func: handlePaste
 * Desc: handles the user pasting to the page.  Calls the sanitize method
 * Args: none
###	
handlePaste = ->	   
	setTimeout sanitize, 0
	return true

###
 * Func: handleDrop
 * Desc: handles the user dropping content onto the page.  Calls the sanitize method
 * Args: none
###	
handleDrop = ->
	setTimeout sanitize, 0
	return true

###
 * Func: sanitize
 * Desc: Does some basic sanitization on the data.  This is used when 
 * Args: none
###	
sanitize = ->

	# remove meta tags
	$editor.find('meta').detach();

	# for now, remove all span and font tags, keeping children
	$editor.find('span,font').contents().unwrap()
	
	# convert all b tags to strong, and i tags to em, and div to p
	$editor.find('b').contents().unwrap().wrap('<strong />')
	$editor.find('i').contents().unwrap().wrap('<em />')
	
	# remove any duplicate placeholders
	$editor.find('.addPlaceholder').each( ->
		if($(this).attr('contenteditable') != "true")
			$(this).detach()
	)
	
	# combine adjacent strong tags; and em tags:
	$editor.find('strong + strong, em + em').each( ->
		$prev = $(this).prev()
		prevContents = $prev.html()
		$prev.detach()
		$(this).html(prevContents + $(this).html())
	)
	
	# remove empty tags: (this needs tweaking)
	# $editor.find('*:not(img):empty').detach()
	
	# remove the style attributes from elements.  If we allow highlighting or coloring,
	# this may need to be reworked
	$editor.find("[style]").removeAttr("style")
	
	return
	
###
 * Func: sanitizeIfChanged
 * Desc: Checks the global changed variable and calls sanitize if needed.
 * Args: none
###
changed = false
sanitizeIfChanged = () ->
	if changed
		sanitize $editor
		changed = false
	return
	
###
 * Func: checkPlaceholderPosition
 * Desc: Check to see if the placeholder is in the proper position and show the add button if applicable
 * Args: @el - jQuery object - The element before or after where the add placeholder should appear
         @location - String - The location relative to @el where the placeholder should appear ("top" or "bot")
###
checkPlaceholderPosition = (el, location) ->
	moveTop = location is "top" and (el.index() - 1) != currentPlaceholderPosition
	moveBottom = location is "bottom" and (el.index() + 1) != currentPlaceholderPosition

	if (moveTop or moveBottom) and moveTimer == null
		if addPlaceholder.hasClass('showButton')
			hideAddButton()
			moveTimer = setTimeout ( -> 
				movePlaceholder el, location
				moveTimer = null
				return ), 200
		else
			movePlaceholder el, location
	else if moveTimer == null
		showAddButton()

	return


###
 * Func: movePlaceholder
 * Desc: Move the placeholder div to the correct location, above or below the relevant element
 * Args: @el - jQuery Object - The element that should be adjacent to the placeholder div
         @location - String - The location relative to @el where the placeholder should appear ("top" or "bot")
###
movePlaceholder = (el, location) ->
	if location is "top"
		addPlaceholder.detach().insertBefore(el)
	else if location is "bottom"
		addPlaceholder.detach().insertAfter(el)
	currentPlaceholderPosition = addPlaceholder.index()
	# setTimeout showAddButton 25
	return


###
 * Func: showAddButton
 * Desc: Make the "add" button appear. This is the button that reveals the Add Bar when clicked
 * Args: none
###
showAddButton = () ->
	if !addPlaceholder.hasClass('showButton')
		addPlaceholder.addClass('showButton')
	return


###
 * Func: hideAddButton
 * Desc: Make the "add" button disappear. This is the button that reveals the Add Bar when clicked 
 * Args: none
###
hideAddButton = () ->
	addPlaceholder.removeClass('showButton')
	addPlaceholder.removeClass('showBar')
	return


###
 * Func: toggleAddBar
 * Desc: Toggle visibility of the Add Bar. This bar allows the user to add elements to the DOM
 * Args: none
###
toggleAddBar = () ->
	if !addPlaceholder.hasClass('showBar')
		addPlaceholder.addClass('showBar')
	else
		hideAddBar()

###
 * Func: hideAddBar
 * Desc: Remove visibility of the Add Bar. This bar allows the user to add elements to the DOM
 * Args: none
###
hideAddBar = () ->
	addPlaceholder.removeClass('showBar')


###
 * Func: Add Functions
 * Desc: Toggle visibility of the Add Bar. This bar allows the user to add elements to the DOM
 * Args: none
###
addImage = () ->
	addElement '<img />'
addVideo = () ->
	addElement '<div class="video"></div>'
addAudio = () ->
	addElement '<div class="audio"></div>'
addH1    = () ->
	addElement '<h1>[title]</h1>'
addH2    = () ->
	addElement '<h2>[title]</h2>'
addQuote = () ->
	addElement '<blockquote>[quote]</blockquote>'
addOlist = () ->
	addElement '<ol><li></li></ol>'
addUlist = () ->
	addElement '<ul><li></li></ul>'


addElement = (newEl) ->
	hideAddBar()
	el = $(newEl)
	newClass = 'newEl'

	el.addClass newClass
	$('.addPlaceholder').after el
	selectNewObject newClass
	return

selectNewObject = (className) ->
	newRange = rangy.createRange()
	node = $('.' + className).get 0

	newRange.selectNodeContents node
	rangy.getSelection().setSingleRange newRange
	$('.' + className).removeClass className
	return


###
 * Func: toggleTag
 * Desc: Toggle wrapping the current selection in a tag
 * Args: @tag - String - The tag that should be added or removed (i.e. "strong")
         @newClass - String - A class to add to the tag
###
toggleTag = (tag, newClass) ->
	range = addWrapper()
	thisClass = (if newClass then "." + newClass else "")
	tagSelector = tag + thisClass
	curr = $(".currentSelection")

	# If the current selection is wrapped in or contains the selected tag, remove it
	addTag = !hasElement curr, tagSelector, true
	
	### If the current selection is not wrapped in the tag and does not contain the tag
		then wrap the current selection in the specified tag ###
	if addTag
		surroundRange tag, newClass, range

	# Remove the temporary wrapper, and restore the selection
	removeWrapper()
	rangy.restoreSelection savedSelection
	return addTag


###
 * Func: hasTag
 * Desc: Checks to see whether the specified element is wrapped by or contains the specified element AT ANY LEVEL
 		 This means
 * Args: @el - String - A jQuery-style identifier for base element (i.e. ".currentSelection")
         @testEl - String - A jQuery-style identifier for test element (i.e. "strong")
###
hasElement = (el, testEl, remove) ->
	wrapped = el.closest( testEl ).size() > 0 
	contains = el.find( testEl ).size() > 0
	hasTestElement = wrapped or contains

	if hasTestElement and remove
		if wrapped
			el.closest( testEl ).contents().unwrap()
		if contains
			el.find( testEl ).contents().unwrap()

	return hasTestElement


###
 * Func: addURL
 * Desc: Add the URL from the Add URL modal to the specified link
 * Args: @identifier - String - A jQuery-style identifier for the link (i.e. "a.newLink")
###
addURL = (identifier, href) ->
	classString = (if identifier then "." + identifier else "")
	$("#addLink").modal "hide"
	$('a' + classString).attr("href", href).removeClass(identifier)
	# rangy.restoreSelection savedSelection
	$('#linkInput').val('')
	removeWrapper()
	return



###
 * Func: removeLink
 * Desc: Remove the specified link tag (unwrap their contents)
 * Args: @identifier - String - A jQuery-style identifier for the link (i.e. "a.newLink")
###
removeLink = (identifier) ->
	$("#addLink").modal "hide"
	$('a.temporaryLink').contents().unwrap()
	rangy.restoreSelection savedSelection
	removeWrapper()
	return


###
 * Func: addLink
 * Desc: Wrap the current selection in a link tag and open the Add Link modal to get the URL
 * Args: @identifier - String - A jQuery-style identifier for the class of the link (i.e. ".newLink")
###
addLink = (newClass) ->
	addWrapper()
	add = !hasElement $(".currentSelection"), "a", true
	if add
		toggleTag "a", newClass
		$("#addLink").modal "show"
		window.setTimeout (-> 
			$('#addLink #linkInput').focus()
			console.log "Focus, please"
			), 250
	removeWrapper()

	return add


###
 * Func: addWrapper
 * Desc: Add a wrapper element around the current selection
 * Args: none
###
addWrapper = ->
	range = getFirstRange()
	surroundRange "span", "currentSelection", range
	range


###
 * Func: removeWrapper
 * Desc: Remove the Current Selection wrapper (unwrap its contents)
 * Args: none
###
removeWrapper = ->
	$(".currentSelection").contents().unwrap()
	return


###
 * Func: hideTextEditBox
 * Desc: Hide the text editing button bar
 * Args: none
###
hideTextEditBox = ->
	$(".textEditBar").addClass "hidden"
	return


###
 * Func: showTextEditBox
 * Desc: Position the correct text editing button bar relative to the selection
 * Args: none
###
showTextEditBox = ->
	selectionMarker = $(".rangySelectionBoundary").css("display", "inline").first()
	editBar = $(".textEditBar")
	sPos = 0
	top = 0
	left = 0

	if selectionMarker
		editBar.removeClass "hidden"
		sPos = selectionMarker.position()
		top = sPos.top - editBar.height() - 15
		left = sPos.left - 15
		$(".textEditBar").css("top", top).css "left", left
	else
		$(".textEditBar").hide()
	return


###
 * Func: getSelectedText
 * Desc: Check to see if any text is selected. If so, mark the selection in the DOM using setSelectionMarker.
 * Args: none
###
getSelectedText = ->
	sel = rangy.getSelection()
	selectedText = sel.toString()
	hasSelection = false
	if selectedText
		hasSelection = setSelectionMarker()
	else
		hideTextEditBox()
		hasSelection = setCursorMarker()

	return hasSelection


###
 * Func: setCursorMarker
 * Desc: Set a marker at the position of the cursor
 * Args: none
###
setCursorMarker = ->
	range = getFirstRange()
	cursorActive = true
	if range
		parent = $(range.startContainer)
		cursorActive = parent.closest(".editable").size() > 0
	clearSelectionMarkers()
	
	return false


###
 * Func: clearCursorMarker
 * Desc: Remove all cursor markers
 * Args: none
###
clearCursorMarker = ->
	$(".cursorSelection").remove()
	return


###
 * Func: clearSelectionMarkers
 * Desc: Remove all selection markers, including cursor marker, from the text
 * Args: none
###
clearSelectionMarkers = ->
	clearCursorMarker()
	if savedSelection
		rangy.removeMarkers savedSelection
		savedSelection = null
		normalizeText()
	return


###
 * Func: setSelectionMarker
 * Desc: Mark the beginning and end of the current selection with empty elements.
 * Args: none
###
setSelectionMarker = ->
	clearSelectionMarkers()
	savedSelection = rangy.saveSelection()
	return true


###
 * Func: getFirstRange
 * Desc: Get the selection object from the rangy object.
 * Args: none
###
getFirstRange = ->
	sel = rangy.getSelection()
	return (if sel.rangeCount then sel.getRangeAt(0))
	


###
 * Func: normalizeText
 * Desc: When HTML nodes are added and removed, it leaves split text nodes within an element.
 		This combines the text nodes together again.
 * Args: none
###
normalizeText = ->
	range = getFirstRange()
	sCon = range.startContainer
	eCon = range.endContainer
	try
		sCon.parentNode.normalize()
		eCon.parentNode.normalize()
	return


###
 * Func: surroundRange
 * Desc: Wrap the range in the specified HTML element, with optional class
 * Args: @newElement - String - An identifier representing the HTML element to wrap the selection in (i.e. "div")
         @elClass - OPTIONAL String - A class to give to the wrapper element
         @inputRange - OPTIONAL Rangy Object - A Range object (will use getFirstRange() if omitted)
###
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


###
 * Func: makeSelectionWrappable
 * Desc: Expand the selection so it can legitimately be wrapped in enclosing tags, based on HTML syntax.
		Returns the smallest wrappable range based on the input range.
 * Args: @inputRange - OPTIONAL Rangy Object - A Range object (will use getFirstRange() if omitted)
###
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


###
 * Func: throttle
 * Desc: Throttle the firing of a function to a certain time threshold
 * Args: @fn - Function - The function to fire
 		 @threshold - Number - The minimum time allowed between function firing
 		 @scope - String - A jQuery-style identifier for the scope in which to operate (defaults to this)

 * Credit: Remy Sharp : http://remysharp.com/2010/07/21/throttling-function-calls/
###
throttle = (fn, threshold, scope) -> 
	threshold = (if threshold then threshold else 250)
	last = undefined
	deferTimer = undefined

	return () ->
		context = scope or this
		now = new Date().getTime()
		args = arguments

		if last and (now < last + threshold)
			# hold on to it
			clearTimeout deferTimer
			deferTimer = setTimeout ( () ->
				last = now
				fn.apply context, args
				return
			), threshold
		else
			last = now
			fn.apply context, args
		return
