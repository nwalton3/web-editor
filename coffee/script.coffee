#! 
# script.js 


##########################

###GLOBALS###
assetBase = (if window.assets then window.assets else "")

###GLOBAL INITIALIZATION####
rangy.init()

###
 * Func: Editor constructor
 * Desc: Creates an Editor instance.  Sets sanitizing intervals on change, paste,
				 and drop.  Creates the editing tools.
 * Args: a DOMElement with a child with class '.editable' which will become
				 the editor.  It can already contain content.
###
Editor = (node) ->
	# Variables
	this.$editor = $(node).find('.editable')
	this.$ = $.proxy(this.$editor.find, this.$editor)
	this.currentPlaceholderPosition = null
	this.moveTimer = null
	this.changed = false
	this.savedSelection = undefined
		
	editor = this

	$("#addLink").modal show: false

	setInterval((() -> editor.sanitizeIfChanged()) , 100)
	
	this.setupEditingTools()
	this.hideTextEditBox()
	
	# Keys to not sanitize after.  These are keys which shouldn't have any effect on the contents of the editor
	dontSanitizeKeys = [37, 38, 39, 40, 16, 17, 18, 91, 92, 144, 35, 36, 45, 33, 34, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 27, 20, 145, 19]

	# Document Bindings
	$(document)
		.on("mouseup", () -> editor.handleSelection())
		.on("keyup", () -> editor.handleSelection())
		.on("keydown", (e) ->
			if dontSanitizeKeys.indexOf(e.keyCode) == -1
				editor.changed = true
			return
		)
		.on("paste", () -> editor.handlePaste())
		.on("drop", () -> editor.handleDrop())
		
	this.$editor
		.on('mouseover', '> *', (e) -> editor.handleHover(e) )
		.on('mousemove', '> *', throttle ( (e) ->
			editor.handleHover e
			return), 100 )
		
	this.$editor.attr('contenteditable', "true")

	# Button bindings
	this.textEditBox.find(".add-bold").on "click", (e) -> editor.toggleTag "strong"
	this.textEditBox.find(".add-italic").on "click", (e) -> editor.toggleTag "em"

	this.textEditBox.find(".add-link").on "click", () -> editor.addLink "temporaryLink"
	$("#addLink .save").on "click", () -> editor.addURL "temporaryLink", $('#linkInput').val()
	$("#addLink .cancel").on "click", () -> editor.removeLink "temporaryLink"
	$("#addLink #linkInput").on "keyup", (e) -> 
		if e.keyCode is 13
			editor.addURL "temporaryLink", $('#linkInput').val()

	return

##########################

# Functions

###
 * Func: setupEditingTools
 * Desc: Sets up the editing tools (the add placeholder and the text edit bar) on the editor
 *			 Need to look into templating this
 * Args: none
###
Editor.prototype.setupEditingTools = ->
	this.ensureAddPlaceholder()
	$textEditBar = $('<div class="textEditBar">
											<div class="btn-group">
												<button type="button" class="btn btn-primary add-bold fa fa-bold">Bold</button>
												<button type="button" class="btn btn-primary add-italic fa fa-italic">Italic</button>
												<button type="button" data-toggle="modal" data-target="addLink" class="btn btn-primary add-link fa fa-link">Link</button>
											</div>
										</div>')
	this.$editor.after($textEditBar)
	this.textEditBox = $textEditBar
	return


Editor.prototype.ensureAddPlaceholder = ->
	if !this.$('.addPlaceholder').length
		# the placeholder is gone!
		# replace it:
			$placeholder = $('<div contenteditable="false" class="addPlaceholder">
													<div class="addButton">
														<button type="button" class="btn btn-default add-item fa fa-plus">Add</button>
													</div>
													<div class="addBar">
														<div class="btn-group">
															<!--button.btn.btn-lg.btn-primary.add-image.fa.fa-picture-o(type="button") Image-->
															<!--button.btn.btn-lg.btn-primary.add-video.fa.fa-film(type="button") Video-->
															<!--button.btn.btn-lg.btn-primary.add-video.fa.fa-headphones(type="button") Audio-->
															<button type="button" class="btn btn-lg btn-primary add-h1 fa">h1</button>
															<button type="button" class="btn btn-lg btn-primary add-h2 fa">h2</button>
															<!--button.btn.btn-lg.btn-primary.add-ulist.fa.fa-quote-right(type="button") Blockquote-->
															<button type="button" class="btn btn-lg btn-primary add-olist fa fa-list-ul">Ordered List</button>
															<button type="button" class="btn btn-lg btn-primary add-ulist fa fa-list-ol">Unordered List</button>
														</div>
													</div>
												</div>')
			this.$editor.append($placeholder)
			this.addPlaceholder = $placeholder
			editor = this
			this.addPlaceholder.find('.add-item' ).on "click", () -> editor.toggleAddBar()
			this.addPlaceholder.find('.add-image').on "click", () -> editor.addImage()
			this.addPlaceholder.find('.add-video').on "click", () -> editor.addVideo()
			this.addPlaceholder.find('.add-audio').on "click", () -> editor.addAudio()
			this.addPlaceholder.find('.add-h1'   ).on "click", () -> editor.addH1()
			this.addPlaceholder.find('.add-h2'   ).on "click", () -> editor.addH2()
			this.addPlaceholder.find('.add-quote').on "click", () -> editor.addQuote()
			this.addPlaceholder.find('.add-olist').on "click", () -> editor.addOlist()
			this.addPlaceholder.find('.add-ulist').on "click", () -> editor.addUlist()
	return


###
 * Func: handleSelection
 * Desc: Check to see if any text is selected. If so, activate the text edit box.
 * Args: none
###
Editor.prototype.handleSelection = ->
	if this.getSelectedText()
		this.showTextEditBox()
	return


###
 * Func: handleHover
 * Desc: Actions to perform when an editable element is hovered
 * Args: @e - jQuery Event Object - Passed from the jQuery .on() function
				 @out - Boolean - Whether the hover is inside the object (mouseout = false)
###
Editor.prototype.handleHover = (e, out) ->
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
			this.checkPlaceholderPosition t, "top"
		else if nearBot
			this.checkPlaceholderPosition t, "bottom"
		else
			this.hideAddButton()

	# Otherwise, just show the add button (so it doesn't flicker)
	else
		this.showAddButton()

	return

###
 * Func: handlePaste
 * Desc: handles the user pasting to the page.  Calls the sanitize method
 * Args: none
###	
Editor.prototype.handlePaste = ->
	editor = this
	setTimeout (() -> editor.sanitize()), 0
	return true

###
 * Func: handleDrop
 * Desc: handles the user dropping content onto the page.  Calls the sanitize method
 * Args: none
###	
Editor.prototype.handleDrop = ->
	editor = this
	setTimeout (() -> editor.sanitize()), 0
	return true
	
###
 * Func: getContents
 * Desc: gets the HTML string for the contents of this editor
 * Args: none
###	
Editor.prototype.getContents = ->
	html = ""
	this.addPlaceholder.detach()
	html = this.$editor.html().trim()
	this.$editor.children().eq(this.currentPlaceholderPosition-1).after(this.addPlaceholder)
	return html
	
###
 * Func: getContents
 * Desc: sets the HTML for the contents of this editor
 * Args: none
###
Editor.prototype.setContents = (html) ->
	this.$editor.html(html)
	this.ensureAddPlaceholder()
	
###
 * Func: clearContents
 * Desc: clears the contents of the editor entirely, replacing with an empty p tag
 * Args: none
###
Editor.prototype.clearContents = () ->
	this.$editor.html("<p>&nbsp;</p>")
	this.ensureAddPlaceholder()
	
###
 * Func: sanitize
 * Desc: Does some basic sanitization on the data.  This is used when pasted or
					dragged into.
 * Args: none
###	
Editor.prototype.sanitize = ->

	console.log "sanitize"

	# ensure there is at least one p tag
	if !this.$('p').length
		this.$editor.append('<p>&nbsp;</p>')
	
	this.ensureAddPlaceholder()
	
	# find any orphaned, nonempty text nodes and wrap them in p tags:
	node = this.$editor[0].firstChild
	while(node)
		if node.nodeType == Node.TEXT_NODE
			if(node.wholeText.trim() != "")
				$(node).wrap("<p />")
				node = node.nextSibling
			else
				nextNode = node.nextSibling
				node.parentNode.removeChild(node)
				node = nextNode
		else
			node = node.nextSibling

	# remove meta tags
	this.$editor.find('meta').detach();

	# for now, remove all span and font tags, keeping children
	this.$editor.find('span,font').contents().unwrap()

	# convert all b tags to strong, and i tags to em, and div to p
	this.$editor.find('b').contents().unwrap().wrap('<strong />')
	this.$editor.find('i').contents().unwrap().wrap('<em />')

	# remove any duplicate placeholders
	this.$editor.find('.addPlaceholder').each( ->
		if($(this).attr('contenteditable') != "true")
			$(this).detach()
	)

	# combine adjacent strong tags; and em tags:
	this.$editor.find('strong + strong, em + em').each( ->
		$prev = $(this).prev()
		prevContents = $prev.html()
		$prev.detach()
		$(this).html(prevContents + $(this).html())
	)

	# remove empty tags: (this needs tweaking)
	# this.$editor.find('*:not(img):empty').detach()

	# remove the style attributes from elements.  If we allow highlighting or coloring,
	# this may need to be reworked
	this.$editor.find("[style]").removeAttr("style")

	return

###
 * Func: sanitizeIfChanged
 * Desc: Checks the global changed variable and calls sanitize if needed.
 * Args: none
###
Editor.prototype.sanitizeIfChanged = () ->
	if this.changed
		this.sanitize()
		this.changed = false
	return

###
 * Func: checkPlaceholderPosition
 * Desc: Check to see if the placeholder is in the proper position and show the add button if applicable
 * Args: @el - jQuery object - The element before or after where the add placeholder should appear
				 @location - String - The location relative to @el where the placeholder should appear ("top" or "bot")
###
Editor.prototype.checkPlaceholderPosition = (el, location) ->
	moveTop = location is "top" and (el.index() - 1) != this.currentPlaceholderPosition
	moveBottom = location is "bottom" and (el.index() + 1) != this.currentPlaceholderPosition
	
	editor = this

	if (moveTop or moveBottom) and this.moveTimer == null
		if this.addPlaceholder.hasClass('showButton')
			this.hideAddButton()
			this.moveTimer = setTimeout ( -> 
				editor.movePlaceholder el, location
				editor.moveTimer = null
				return ), 200
		else
			this.movePlaceholder el, location
	else if this.moveTimer == null
		this.showAddButton()

	return


###
 * Func: movePlaceholder
 * Desc: Move the placeholder div to the correct location, above or below the relevant element
 * Args: @el - jQuery Object - The element that should be adjacent to the placeholder div
				 @location - String - The location relative to @el where the placeholder should appear ("top" or "bot")
###
Editor.prototype.movePlaceholder = (el, location) ->
	if location is "top"
		this.addPlaceholder.detach().insertBefore(el)
	else if location is "bottom"
		this.addPlaceholder.detach().insertAfter(el)
	this.currentPlaceholderPosition = this.addPlaceholder.index()
	# setTimeout showAddButton 25
	return


###
 * Func: showAddButton
 * Desc: Make the "add" button appear. This is the button that reveals the Add Bar when clicked
 * Args: none
###
Editor.prototype.showAddButton = () ->
	if !this.addPlaceholder.hasClass('showButton')
		# hide other add buttons
		$('.addPlaceholder').removeClass('showButton').removeClass('showBar')
		this.addPlaceholder.addClass('showButton')
	return


###
 * Func: hideAddButton
 * Desc: Make the "add" button disappear. This is the button that reveals the Add Bar when clicked 
 * Args: none
###
Editor.prototype.hideAddButton = () ->
	this.addPlaceholder.removeClass('showButton')
	this.addPlaceholder.removeClass('showBar')
	return


###
 * Func: toggleAddBar
 * Desc: Toggle visibility of the Add Bar. This bar allows the user to add elements to the DOM
 * Args: none
###
Editor.prototype.toggleAddBar = () ->
	if !this.addPlaceholder.hasClass('showBar')
		# hide other add bars
		$('.addPlaceholder').removeClass('showBar')
		this.addPlaceholder.addClass('showBar')
	else
		this.hideAddBar()

###
 * Func: hideAddBar
 * Desc: Remove visibility of the Add Bar. This bar allows the user to add elements to the DOM
 * Args: none
###
Editor.prototype.hideAddBar = () ->
	this.addPlaceholder.removeClass('showBar')


###
 * Func: Add Functions
 * Desc: Toggle visibility of the Add Bar. This bar allows the user to add elements to the DOM
 * Args: none
###
Editor.prototype.addImage = () ->
	this.addElement '<img />'
Editor.prototype.addVideo = () ->
	this.addElement '<div class="video"></div>'
Editor.prototype.addAudio = () ->
	this.addElement '<div class="audio"></div>'
Editor.prototype.addH1    = () ->
	this.addElement '<h1>[title]</h1>'
Editor.prototype.addH2    = () ->
	this.addElement '<h2>[title]</h2>'
Editor.prototype.addQuote = () ->
	this.addElement '<blockquote>[quote]</blockquote>'
Editor.prototype.addOlist = () ->
	this.addElement '<ol><li></li></ol>'
Editor.prototype.addUlist = () ->
	this.addElement '<ul><li></li></ul>'


Editor.prototype.addElement = (newEl) ->
	this.hideAddBar()
	el = $(newEl)
	newClass = 'newEl'

	el.addClass newClass
	this.addPlaceholder.after el
	this.selectNewObject newClass
	return

Editor.prototype.selectNewObject = (className) ->
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
Editor.prototype.toggleTag = (tag, newClass) ->
	range = this.addWrapper()
	thisClass = (if newClass then "." + newClass else "")
	tagSelector = tag + thisClass
	curr = $(".currentSelection")

	# If the current selection is wrapped in or contains the selected tag, remove it
	addTag = !this.hasElement curr, tagSelector, true

	### If the current selection is not wrapped in the tag and does not contain the tag
		then wrap the current selection in the specified tag ###
	if addTag
		this.surroundRange tag, newClass, range

	# Remove the temporary wrapper, and restore the selection
	this.removeWrapper()
	rangy.restoreSelection this.savedSelection
	return addTag


###
 * Func: hasTag
 * Desc: Checks to see whether the specified element is wrapped by or contains the specified element AT ANY LEVEL
		 This means
 * Args: @el - String - A jQuery-style identifier for base element (i.e. ".currentSelection")
				 @testEl - String - A jQuery-style identifier for test element (i.e. "strong")
###
Editor.prototype.hasElement = (el, testEl, remove) ->
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
Editor.prototype.addURL = (identifier, href) ->
	classString = (if identifier then "." + identifier else "")
	$("#addLink").modal "hide"
	$('a' + classString).attr("href", href).removeClass(identifier)
	# rangy.restoreSelection savedSelection
	$('#linkInput').val('')
	this.removeWrapper()
	return



###
 * Func: removeLink
 * Desc: Remove the specified link tag (unwrap their contents)
 * Args: @identifier - String - A jQuery-style identifier for the link (i.e. "a.newLink")
###
Editor.prototype.removeLink = (identifier) ->
	$("#addLink").modal "hide"
	$('a.temporaryLink').contents().unwrap()
	rangy.restoreSelection this.savedSelection
	this.removeWrapper()
	return


###
 * Func: addLink
 * Desc: Wrap the current selection in a link tag and open the Add Link modal to get the URL
 * Args: @identifier - String - A jQuery-style identifier for the class of the link (i.e. ".newLink")
###
Editor.prototype.addLink = (newClass) ->
	this.addWrapper()
	add = !this.hasElement $(".currentSelection"), "a", true
	if add
		this.toggleTag "a", newClass
		$("#addLink").modal "show"
		window.setTimeout (-> 
			$('#addLink #linkInput').focus()
			console.log "Focus, please"
			), 250
	this.removeWrapper()

	return add


###
 * Func: addWrapper
 * Desc: Add a wrapper element around the current selection
 * Args: none
###
Editor.prototype.addWrapper = ->
	range = this.getFirstRange()
	this.surroundRange "span", "currentSelection", range
	range


###
 * Func: removeWrapper
 * Desc: Remove the Current Selection wrapper (unwrap its contents)
 * Args: none
###
Editor.prototype.removeWrapper = ->
	$(".currentSelection").contents().unwrap()
	return


###
 * Func: hideTextEditBox
 * Desc: Hide the text editing button bar
 * Args: none
###
Editor.prototype.hideTextEditBox = ->
	this.textEditBox.addClass "hidden"
	return


###
 * Func: showTextEditBox
 * Desc: Position the correct text editing button bar relative to the selection
 * Args: none
###
Editor.prototype.showTextEditBox = ->
	selectionMarker = $(".rangySelectionBoundary").css("display", "inline").first()
	sPos = 0
	top = 0
	left = 0

	if selectionMarker
		this.textEditBox.removeClass "hidden"
		sPos = selectionMarker.position()
		top = sPos.top - this.textEditBox.height() - 15
		left = sPos.left - 15
		this.textEditBox.css("top", top).css "left", left
	else
		this.textEditBox.hide()
	return
	
	
###
 * Func: getSelectedText
 * Desc: Check to see if any text is selected. If so, mark the selection in the DOM using setSelectionMarker.
 * Args: none
###
Editor.prototype.getSelectedText = ->
	sel = rangy.getSelection()
	selectedText = sel.toString()
	hasSelection = false
	
	# this checks that the selection lies entirely in this editor
	if this.$editor.has(sel.anchorNode).length and this.$editor.has(sel.focusNode).length
		if selectedText
			hasSelection = this.setSelectionMarker()
		else
			this.hideTextEditBox()
			hasSelection = this.setCursorMarker()
	else
		this.hideTextEditBox()
		this.clearCursorMarker()
		this.clearSelectionMarkers()

	return hasSelection


###
 * Func: setCursorMarker
 * Desc: Set a marker at the position of the cursor
 * Args: none
###
Editor.prototype.setCursorMarker = ->
	range = this.getFirstRange()
	cursorActive = true
	if range
		parent = $(range.startContainer)
		cursorActive = parent.closest(".editable").size() > 0
	this.clearSelectionMarkers()
	
	return false


###
 * Func: clearCursorMarker
 * Desc: Remove all cursor markers
 * Args: none
###
Editor.prototype.clearCursorMarker = ->
	$(".cursorSelection").remove()
	return


###
 * Func: clearSelectionMarkers
 * Desc: Remove all selection markers, including cursor marker, from the text
 * Args: none
###
Editor.prototype.clearSelectionMarkers = ->
	this.clearCursorMarker()
	if this.savedSelection
		rangy.removeMarkers this.savedSelection
		this.savedSelection = null
		this.normalizeText()
	return


###
 * Func: setSelectionMarker
 * Desc: Mark the beginning and end of the current selection with empty elements.
 * Args: none
###
Editor.prototype.setSelectionMarker = ->
	this.clearSelectionMarkers()
	this.savedSelection = rangy.saveSelection()
	return true


###
 * Func: getFirstRange
 * Desc: Get the selection object from the rangy object.
 * Args: none
###
Editor.prototype.getFirstRange = ->
	sel = rangy.getSelection()
	return (if sel.rangeCount then sel.getRangeAt(0))
	


###
 * Func: normalizeText
 * Desc: When HTML nodes are added and removed, it leaves split text nodes within an element.
 		This combines the text nodes together again.
 * Args: none
###
Editor.prototype.normalizeText = ->
	range = this.getFirstRange()
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
Editor.prototype.surroundRange = (newElement, elClass, inputRange) ->
	range = (if inputRange then inputRange else this.getFirstRange())
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
Editor.prototype.makeSelectionWrappable = (inputRange) ->
	range = (if inputRange then inputRange else this.getFirstRange())
	
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

window.Editor = Editor
editor1 = new Editor($(".editContainer1")[0])
window.editor1 = editor1
editor2 = new Editor($(".editContainer2")[0])
window.editor2 = editor2

$('.save').on('click', () ->
	console.log editor1.getContents()
	console.log editor2.getContents()
)

$('.btn.cancel').on('click', () ->
	editor1.clearContents();
	editor2.setContents('<p>this is editor 2!</p>');
)
return Editor