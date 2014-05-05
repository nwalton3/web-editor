(function() {
  var $editor, addAudio, addElement, addH1, addH2, addImage, addLink, addOlist, addPlaceholder, addQuote, addURL, addUlist, addVideo, addWrapper, assetBase, changed, checkPlaceholderPosition, clearCursorMarker, clearSelectionMarkers, currentPlaceholderPosition, getFirstRange, getSelectedText, handleDrop, handleHover, handlePaste, handleSelection, hasElement, hideAddBar, hideAddButton, hideTextEditBox, makeSelectionWrappable, movePlaceholder, moveTimer, normalizeText, removeLink, removeWrapper, sanitize, sanitizeIfChanged, savedSelection, selectNewObject, setCursorMarker, setSelectionMarker, showAddButton, showTextEditBox, surroundRange, throttle, toggleAddBar, toggleTag;

  assetBase = (window.assets ? window.assets : "");

  savedSelection = void 0;

  $editor = $(".editContainer");

  addPlaceholder = $('.addPlaceholder');

  currentPlaceholderPosition = null;

  moveTimer = null;

  $(document).ready(function() {
    rangy.init();
    $("#addLink").modal({
      show: false
    });
    setInterval(sanitizeIfChanged, 100);
    $(document).on("mouseup", handleSelection).on("keyup", handleSelection).on("keydown", function() {
      var changed;
      changed = true;
    }).on("paste", handlePaste).on("drop", handleDrop);
    $('.editable').on('mouseover', '> *', (function(e) {
      return handleHover(e);
    })).on('mousemove', '> *', throttle((function(e) {
      handleHover(e);
    }), 100));
    $(".add-bold").on("click", function(e) {
      return toggleTag("strong");
    });
    $(".add-italic").on("click", function(e) {
      return toggleTag("em");
    });
    $(".add-link").on("click", function(e) {
      return addLink("temporaryLink");
    });
    $("#addLink .save").on("click", function(e) {
      return addURL("temporaryLink", $('#linkInput').val());
    });
    $("#addLink .cancel").on("click", function(e) {
      return removeLink("temporaryLink");
    });
    $("#addLink #linkInput").on("keyup", function(e) {
      if (e.keyCode === 13) {
        return addURL("temporaryLink", $('#linkInput').val());
      }
    });
    $('.addPlaceholder .add-item').on("click", toggleAddBar);
    $('.addPlaceholder .add-image').on("click", addImage);
    $('.addPlaceholder .add-video').on("click", addVideo);
    $('.addPlaceholder .add-audio').on("click", addAudio);
    $('.addPlaceholder .add-h1').on("click", addH1);
    $('.addPlaceholder .add-h2').on("click", addH2);
    $('.addPlaceholder .add-quote').on("click", addQuote);
    $('.addPlaceholder .add-olist').on("click", addOlist);
    $('.addPlaceholder .add-ulist').on("click", addUlist);
  });


  /*
   * Func: handleSelection
   * Desc: Check to see if any text is selected. If so, activate the text edit box.
   * Args: none
   */

  handleSelection = function() {
    if (getSelectedText()) {
      showTextEditBox();
    }
  };


  /*
   * Func: handleHover
   * Desc: Actions to perform when an editable element is hovered
   * Args: @e - jQuery Event Object - Passed from the jQuery .on() function
           @out - Boolean - Whether the hover is inside the object (mouseout = false)
   */

  handleHover = function(e, out) {
    var addBar, bot, height, margin, my, nearBot, nearTop, parent, pos, t, top;
    t = $(e.currentTarget);
    parent = t.hasClass('editable');
    addBar = t.hasClass("addPlaceholder");
    if (!parent && !addBar) {
      height = t.height();
      pos = t.offset();
      top = pos.top;
      bot = pos.top + height;
      margin = parseInt(t.css('margin-bottom'));
      my = e.pageY;
      nearTop = my > top && my < top + (height / 2) && my < top + 100;
      nearBot = my < (bot + margin) && my > bot - (height / 2) && my > bot - 125;
      if (nearTop) {
        checkPlaceholderPosition(t, "top");
      } else if (nearBot) {
        checkPlaceholderPosition(t, "bottom");
      } else {
        hideAddButton();
      }
    } else {
      showAddButton();
    }
  };


  /*
   * Func: handlePaste
   * Desc: handles the user pasting to the page.  Calls the sanitize method
   * Args: none
   */

  handlePaste = function() {
    setTimeout(sanitize, 0);
    return true;
  };


  /*
   * Func: handleDrop
   * Desc: handles the user dropping content onto the page.  Calls the sanitize method
   * Args: none
   */

  handleDrop = function() {
    setTimeout(sanitize, 0);
    return true;
  };


  /*
   * Func: sanitize
   * Desc: Does some basic sanitization on the data.  This is used when 
   * Args: none
   */

  sanitize = function() {
    $editor.find('meta').detach();
    $editor.find('span,font').contents().unwrap();
    $editor.find('b').contents().unwrap().wrap('<strong />');
    $editor.find('i').contents().unwrap().wrap('<em />');
    $editor.find('.addPlaceholder').each(function() {
      if ($(this).attr('contenteditable') !== "true") {
        return $(this).detach();
      }
    });
    $editor.find('strong + strong, em + em').each(function() {
      var $prev, prevContents;
      $prev = $(this).prev();
      prevContents = $prev.html();
      $prev.detach();
      return $(this).html(prevContents + $(this).html());
    });
    $editor.find("[style]").removeAttr("style");
  };


  /*
   * Func: sanitizeIfChanged
   * Desc: Checks the global changed variable and calls sanitize if needed.
   * Args: none
   */

  changed = false;

  sanitizeIfChanged = function() {
    if (changed) {
      sanitize($editor);
      changed = false;
    }
  };


  /*
   * Func: checkPlaceholderPosition
   * Desc: Check to see if the placeholder is in the proper position and show the add button if applicable
   * Args: @el - jQuery object - The element before or after where the add placeholder should appear
           @location - String - The location relative to @el where the placeholder should appear ("top" or "bot")
   */

  checkPlaceholderPosition = function(el, location) {
    var moveBottom, moveTop;
    moveTop = location === "top" && (el.index() - 1) !== currentPlaceholderPosition;
    moveBottom = location === "bottom" && (el.index() + 1) !== currentPlaceholderPosition;
    if ((moveTop || moveBottom) && moveTimer === null) {
      if (addPlaceholder.hasClass('showButton')) {
        hideAddButton();
        moveTimer = setTimeout((function() {
          movePlaceholder(el, location);
          moveTimer = null;
        }), 200);
      } else {
        movePlaceholder(el, location);
      }
    } else if (moveTimer === null) {
      showAddButton();
    }
  };


  /*
   * Func: movePlaceholder
   * Desc: Move the placeholder div to the correct location, above or below the relevant element
   * Args: @el - jQuery Object - The element that should be adjacent to the placeholder div
           @location - String - The location relative to @el where the placeholder should appear ("top" or "bot")
   */

  movePlaceholder = function(el, location) {
    if (location === "top") {
      addPlaceholder.detach().insertBefore(el);
    } else if (location === "bottom") {
      addPlaceholder.detach().insertAfter(el);
    }
    currentPlaceholderPosition = addPlaceholder.index();
  };


  /*
   * Func: showAddButton
   * Desc: Make the "add" button appear. This is the button that reveals the Add Bar when clicked
   * Args: none
   */

  showAddButton = function() {
    if (!addPlaceholder.hasClass('showButton')) {
      addPlaceholder.addClass('showButton');
    }
  };


  /*
   * Func: hideAddButton
   * Desc: Make the "add" button disappear. This is the button that reveals the Add Bar when clicked 
   * Args: none
   */

  hideAddButton = function() {
    addPlaceholder.removeClass('showButton');
    addPlaceholder.removeClass('showBar');
  };


  /*
   * Func: toggleAddBar
   * Desc: Toggle visibility of the Add Bar. This bar allows the user to add elements to the DOM
   * Args: none
   */

  toggleAddBar = function() {
    if (!addPlaceholder.hasClass('showBar')) {
      return addPlaceholder.addClass('showBar');
    } else {
      return hideAddBar();
    }
  };


  /*
   * Func: hideAddBar
   * Desc: Remove visibility of the Add Bar. This bar allows the user to add elements to the DOM
   * Args: none
   */

  hideAddBar = function() {
    return addPlaceholder.removeClass('showBar');
  };


  /*
   * Func: Add Functions
   * Desc: Toggle visibility of the Add Bar. This bar allows the user to add elements to the DOM
   * Args: none
   */

  addImage = function() {
    return addElement('<img />');
  };

  addVideo = function() {
    return addElement('<div class="video"></div>');
  };

  addAudio = function() {
    return addElement('<div class="audio"></div>');
  };

  addH1 = function() {
    return addElement('<h1>[title]</h1>');
  };

  addH2 = function() {
    return addElement('<h2>[title]</h2>');
  };

  addQuote = function() {
    return addElement('<blockquote>[quote]</blockquote>');
  };

  addOlist = function() {
    return addElement('<ol><li></li></ol>');
  };

  addUlist = function() {
    return addElement('<ul><li></li></ul>');
  };

  addElement = function(newEl) {
    var el, newClass;
    hideAddBar();
    el = $(newEl);
    newClass = 'newEl';
    el.addClass(newClass);
    $('.addPlaceholder').after(el);
    selectNewObject(newClass);
  };

  selectNewObject = function(className) {
    var newRange, node;
    newRange = rangy.createRange();
    node = $('.' + className).get(0);
    newRange.selectNodeContents(node);
    rangy.getSelection().setSingleRange(newRange);
    $('.' + className).removeClass(className);
  };


  /*
   * Func: toggleTag
   * Desc: Toggle wrapping the current selection in a tag
   * Args: @tag - String - The tag that should be added or removed (i.e. "strong")
           @newClass - String - A class to add to the tag
   */

  toggleTag = function(tag, newClass) {
    var addTag, curr, range, tagSelector, thisClass;
    range = addWrapper();
    thisClass = (newClass ? "." + newClass : "");
    tagSelector = tag + thisClass;
    curr = $(".currentSelection");
    addTag = !hasElement(curr, tagSelector, true);

    /* If the current selection is not wrapped in the tag and does not contain the tag
    		then wrap the current selection in the specified tag
     */
    if (addTag) {
      surroundRange(tag, newClass, range);
    }
    removeWrapper();
    rangy.restoreSelection(savedSelection);
    return addTag;
  };


  /*
   * Func: hasTag
   * Desc: Checks to see whether the specified element is wrapped by or contains the specified element AT ANY LEVEL
   		 This means
   * Args: @el - String - A jQuery-style identifier for base element (i.e. ".currentSelection")
           @testEl - String - A jQuery-style identifier for test element (i.e. "strong")
   */

  hasElement = function(el, testEl, remove) {
    var contains, hasTestElement, wrapped;
    wrapped = el.closest(testEl).size() > 0;
    contains = el.find(testEl).size() > 0;
    hasTestElement = wrapped || contains;
    if (hasTestElement && remove) {
      if (wrapped) {
        el.closest(testEl).contents().unwrap();
      }
      if (contains) {
        el.find(testEl).contents().unwrap();
      }
    }
    return hasTestElement;
  };


  /*
   * Func: addURL
   * Desc: Add the URL from the Add URL modal to the specified link
   * Args: @identifier - String - A jQuery-style identifier for the link (i.e. "a.newLink")
   */

  addURL = function(identifier, href) {
    var classString;
    classString = (identifier ? "." + identifier : "");
    $("#addLink").modal("hide");
    $('a' + classString).attr("href", href).removeClass(identifier);
    $('#linkInput').val('');
    removeWrapper();
  };


  /*
   * Func: removeLink
   * Desc: Remove the specified link tag (unwrap their contents)
   * Args: @identifier - String - A jQuery-style identifier for the link (i.e. "a.newLink")
   */

  removeLink = function(identifier) {
    $("#addLink").modal("hide");
    $('a.temporaryLink').contents().unwrap();
    rangy.restoreSelection(savedSelection);
    removeWrapper();
  };


  /*
   * Func: addLink
   * Desc: Wrap the current selection in a link tag and open the Add Link modal to get the URL
   * Args: @identifier - String - A jQuery-style identifier for the class of the link (i.e. ".newLink")
   */

  addLink = function(newClass) {
    var add;
    addWrapper();
    add = !hasElement($(".currentSelection"), "a", true);
    if (add) {
      toggleTag("a", newClass);
      $("#addLink").modal("show");
      window.setTimeout((function() {
        $('#addLink #linkInput').focus();
        return console.log("Focus, please");
      }), 250);
    }
    removeWrapper();
    return add;
  };


  /*
   * Func: addWrapper
   * Desc: Add a wrapper element around the current selection
   * Args: none
   */

  addWrapper = function() {
    var range;
    range = getFirstRange();
    surroundRange("span", "currentSelection", range);
    return range;
  };


  /*
   * Func: removeWrapper
   * Desc: Remove the Current Selection wrapper (unwrap its contents)
   * Args: none
   */

  removeWrapper = function() {
    $(".currentSelection").contents().unwrap();
  };


  /*
   * Func: hideTextEditBox
   * Desc: Hide the text editing button bar
   * Args: none
   */

  hideTextEditBox = function() {
    $(".textEditBar").addClass("hidden");
  };


  /*
   * Func: showTextEditBox
   * Desc: Position the correct text editing button bar relative to the selection
   * Args: none
   */

  showTextEditBox = function() {
    var editBar, left, sPos, selectionMarker, top;
    selectionMarker = $(".rangySelectionBoundary").css("display", "inline").first();
    editBar = $(".textEditBar");
    sPos = 0;
    top = 0;
    left = 0;
    if (selectionMarker) {
      editBar.removeClass("hidden");
      sPos = selectionMarker.position();
      top = sPos.top - editBar.height() - 15;
      left = sPos.left - 15;
      $(".textEditBar").css("top", top).css("left", left);
    } else {
      $(".textEditBar").hide();
    }
  };


  /*
   * Func: getSelectedText
   * Desc: Check to see if any text is selected. If so, mark the selection in the DOM using setSelectionMarker.
   * Args: none
   */

  getSelectedText = function() {
    var hasSelection, sel, selectedText;
    sel = rangy.getSelection();
    selectedText = sel.toString();
    hasSelection = false;
    if (selectedText) {
      hasSelection = setSelectionMarker();
    } else {
      hideTextEditBox();
      hasSelection = setCursorMarker();
    }
    return hasSelection;
  };


  /*
   * Func: setCursorMarker
   * Desc: Set a marker at the position of the cursor
   * Args: none
   */

  setCursorMarker = function() {
    var cursorActive, parent, range;
    range = getFirstRange();
    cursorActive = true;
    if (range) {
      parent = $(range.startContainer);
      cursorActive = parent.closest(".editable").size() > 0;
    }
    clearSelectionMarkers();
    return false;
  };


  /*
   * Func: clearCursorMarker
   * Desc: Remove all cursor markers
   * Args: none
   */

  clearCursorMarker = function() {
    $(".cursorSelection").remove();
  };


  /*
   * Func: clearSelectionMarkers
   * Desc: Remove all selection markers, including cursor marker, from the text
   * Args: none
   */

  clearSelectionMarkers = function() {
    clearCursorMarker();
    if (savedSelection) {
      rangy.removeMarkers(savedSelection);
      savedSelection = null;
      normalizeText();
    }
  };


  /*
   * Func: setSelectionMarker
   * Desc: Mark the beginning and end of the current selection with empty elements.
   * Args: none
   */

  setSelectionMarker = function() {
    clearSelectionMarkers();
    savedSelection = rangy.saveSelection();
    return true;
  };


  /*
   * Func: getFirstRange
   * Desc: Get the selection object from the rangy object.
   * Args: none
   */

  getFirstRange = function() {
    var sel;
    sel = rangy.getSelection();
    return (sel.rangeCount ? sel.getRangeAt(0) : void 0);
  };


  /*
   * Func: normalizeText
   * Desc: When HTML nodes are added and removed, it leaves split text nodes within an element.
   		This combines the text nodes together again.
   * Args: none
   */

  normalizeText = function() {
    var eCon, range, sCon;
    range = getFirstRange();
    sCon = range.startContainer;
    eCon = range.endContainer;
    try {
      sCon.parentNode.normalize();
      eCon.parentNode.normalize();
    } catch (_error) {}
  };


  /*
   * Func: surroundRange
   * Desc: Wrap the range in the specified HTML element, with optional class
   * Args: @newElement - String - An identifier representing the HTML element to wrap the selection in (i.e. "div")
           @elClass - OPTIONAL String - A class to give to the wrapper element
           @inputRange - OPTIONAL Rangy Object - A Range object (will use getFirstRange() if omitted)
   */

  surroundRange = function(newElement, elClass, inputRange) {
    var el, elementClass, ex, range;
    range = (inputRange ? inputRange : getFirstRange());
    elementClass = (elClass ? elClass : "");
    if (range) {
      el = document.createElement(newElement);
      el.className = elementClass;
      try {
        range.surroundContents(el);
      } catch (_error) {
        ex = _error;
        if ((ex instanceof rangy.RangeException || Object.prototype.toString.call(ex) === "[object RangeException]") && ex.code === 1) {
          console.log("Unable to surround range because range partially selects a non-text node. See DOM Level 2 Range spec for more information.\n\n" + ex);
        } else {
          console.log("Unexpected errror: " + ex);
        }
      }
    }
    rangy.getSelection().setSingleRange(range);
    range.refresh();
  };


  /*
   * Func: makeSelectionWrappable
   * Desc: Expand the selection so it can legitimately be wrapped in enclosing tags, based on HTML syntax.
  		Returns the smallest wrappable range based on the input range.
   * Args: @inputRange - OPTIONAL Rangy Object - A Range object (will use getFirstRange() if omitted)
   */

  makeSelectionWrappable = function(inputRange) {
    var range;
    range = (inputRange ? inputRange : getFirstRange());
    if (range.canSurroundContents()) {
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
  };


  /*
   * Func: throttle
   * Desc: Throttle the firing of a function to a certain time threshold
   * Args: @fn - Function - The function to fire
   		 @threshold - Number - The minimum time allowed between function firing
   		 @scope - String - A jQuery-style identifier for the scope in which to operate (defaults to this)
  
   * Credit: Remy Sharp : http://remysharp.com/2010/07/21/throttling-function-calls/
   */

  throttle = function(fn, threshold, scope) {
    var deferTimer, last;
    threshold = (threshold ? threshold : 250);
    last = void 0;
    deferTimer = void 0;
    return function() {
      var args, context, now;
      context = scope || this;
      now = new Date().getTime();
      args = arguments;
      if (last && (now < last + threshold)) {
        clearTimeout(deferTimer);
        deferTimer = setTimeout((function() {
          last = now;
          fn.apply(context, args);
        }), threshold);
      } else {
        last = now;
        fn.apply(context, args);
      }
    };
  };

}).call(this);
