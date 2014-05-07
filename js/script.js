
/*GLOBALS */

(function() {
  var Editor, assetBase, editor1, editor2, throttle;

  assetBase = (window.assets ? window.assets : "");


  /*GLOBAL INITIALIZATION */

  rangy.init();


  /*
   * Func: Editor constructor
   * Desc: Creates an Editor instance.  Sets sanitizing intervals on change, paste,
  				 and drop.  Creates the editing tools.
   * Args: a DOMElement with a child with class '.editable' which will become
  				 the editor.  It can already contain content.
   */

  Editor = function(node) {
    var dontSanitizeKeys, editor;
    this.$editor = $(node).find('.editable');
    this.$ = $.proxy(this.$editor.find, this.$editor);
    this.currentPlaceholderPosition = null;
    this.moveTimer = null;
    this.changed = false;
    this.savedSelection = void 0;
    editor = this;
    $("#addLink").modal({
      show: false
    });
    setInterval((function() {
      return editor.sanitizeIfChanged();
    }), 100);
    this.setupEditingTools();
    this.hideTextEditBox();
    dontSanitizeKeys = [37, 38, 39, 40, 16, 17, 18, 91, 92, 144, 35, 36, 45, 33, 34, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 27, 20, 145, 19];
    $(document).on("mouseup", function() {
      return editor.handleSelection();
    }).on("keyup", function() {
      return editor.handleSelection();
    }).on("keydown", function(e) {
      if (dontSanitizeKeys.indexOf(e.keyCode) === -1) {
        editor.changed = true;
      }
    }).on("paste", function() {
      return editor.handlePaste();
    }).on("drop", function() {
      return editor.handleDrop();
    });
    this.$editor.on('mouseover', '> *', function(e) {
      return editor.handleHover(e);
    }).on('mousemove', '> *', throttle((function(e) {
      editor.handleHover(e);
    }), 100));
    this.$editor.attr('contenteditable', "true");
    this.textEditBox.find(".add-bold").on("click", function(e) {
      return editor.toggleTag("strong");
    });
    this.textEditBox.find(".add-italic").on("click", function(e) {
      return editor.toggleTag("em");
    });
    this.textEditBox.find(".add-link").on("click", function() {
      return editor.addLink("temporaryLink");
    });
    $("#addLink .save").on("click", function() {
      return editor.addURL("temporaryLink", $('#linkInput').val());
    });
    $("#addLink .cancel").on("click", function() {
      return editor.removeLink("temporaryLink");
    });
    $("#addLink #linkInput").on("keyup", function(e) {
      if (e.keyCode === 13) {
        return editor.addURL("temporaryLink", $('#linkInput').val());
      }
    });
  };


  /*
   * Func: setupEditingTools
   * Desc: Sets up the editing tools (the add placeholder and the text edit bar) on the editor
   *			 Need to look into templating this
   * Args: none
   */

  Editor.prototype.setupEditingTools = function() {
    var $textEditBar;
    this.ensureAddPlaceholder();
    $textEditBar = $('<div class="textEditBar"> <div class="btn-group"> <button type="button" class="btn btn-primary add-bold fa fa-bold">Bold</button> <button type="button" class="btn btn-primary add-italic fa fa-italic">Italic</button> <button type="button" data-toggle="modal" data-target="addLink" class="btn btn-primary add-link fa fa-link">Link</button> </div> </div>');
    this.$editor.after($textEditBar);
    this.textEditBox = $textEditBar;
  };

  Editor.prototype.ensureAddPlaceholder = function() {
    var $placeholder, editor;
    if (!this.$('.addPlaceholder').length) {
      $placeholder = $('<div contenteditable="false" class="addPlaceholder"> <div class="addButton"> <button type="button" class="btn btn-default add-item fa fa-plus">Add</button> </div> <div class="addBar"> <div class="btn-group"> <!--button.btn.btn-lg.btn-primary.add-image.fa.fa-picture-o(type="button") Image--> <!--button.btn.btn-lg.btn-primary.add-video.fa.fa-film(type="button") Video--> <!--button.btn.btn-lg.btn-primary.add-video.fa.fa-headphones(type="button") Audio--> <button type="button" class="btn btn-lg btn-primary add-h1 fa">h1</button> <button type="button" class="btn btn-lg btn-primary add-h2 fa">h2</button> <!--button.btn.btn-lg.btn-primary.add-ulist.fa.fa-quote-right(type="button") Blockquote--> <button type="button" class="btn btn-lg btn-primary add-olist fa fa-list-ul">Ordered List</button> <button type="button" class="btn btn-lg btn-primary add-ulist fa fa-list-ol">Unordered List</button> </div> </div> </div>');
      this.$editor.append($placeholder);
      this.addPlaceholder = $placeholder;
      editor = this;
      this.addPlaceholder.find('.add-item').on("click", function() {
        return editor.toggleAddBar();
      });
      this.addPlaceholder.find('.add-image').on("click", function() {
        return editor.addImage();
      });
      this.addPlaceholder.find('.add-video').on("click", function() {
        return editor.addVideo();
      });
      this.addPlaceholder.find('.add-audio').on("click", function() {
        return editor.addAudio();
      });
      this.addPlaceholder.find('.add-h1').on("click", function() {
        return editor.addH1();
      });
      this.addPlaceholder.find('.add-h2').on("click", function() {
        return editor.addH2();
      });
      this.addPlaceholder.find('.add-quote').on("click", function() {
        return editor.addQuote();
      });
      this.addPlaceholder.find('.add-olist').on("click", function() {
        return editor.addOlist();
      });
      this.addPlaceholder.find('.add-ulist').on("click", function() {
        return editor.addUlist();
      });
    }
  };


  /*
   * Func: handleSelection
   * Desc: Check to see if any text is selected. If so, activate the text edit box.
   * Args: none
   */

  Editor.prototype.handleSelection = function() {
    if (this.getSelectedText()) {
      this.showTextEditBox();
    }
  };


  /*
   * Func: handleHover
   * Desc: Actions to perform when an editable element is hovered
   * Args: @e - jQuery Event Object - Passed from the jQuery .on() function
  				 @out - Boolean - Whether the hover is inside the object (mouseout = false)
   */

  Editor.prototype.handleHover = function(e, out) {
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
        this.checkPlaceholderPosition(t, "top");
      } else if (nearBot) {
        this.checkPlaceholderPosition(t, "bottom");
      } else {
        this.hideAddButton();
      }
    } else {
      this.showAddButton();
    }
  };


  /*
   * Func: handlePaste
   * Desc: handles the user pasting to the page.  Calls the sanitize method
   * Args: none
   */

  Editor.prototype.handlePaste = function() {
    var editor;
    editor = this;
    setTimeout((function() {
      return editor.sanitize();
    }), 0);
    return true;
  };


  /*
   * Func: handleDrop
   * Desc: handles the user dropping content onto the page.  Calls the sanitize method
   * Args: none
   */

  Editor.prototype.handleDrop = function() {
    var editor;
    editor = this;
    setTimeout((function() {
      return editor.sanitize();
    }), 0);
    return true;
  };


  /*
   * Func: getContents
   * Desc: gets the HTML string for the contents of this editor
   * Args: none
   */

  Editor.prototype.getContents = function() {
    var html;
    html = "";
    this.addPlaceholder.detach();
    html = this.$editor.html().trim();
    this.$editor.children().eq(this.currentPlaceholderPosition - 1).after(this.addPlaceholder);
    return html;
  };


  /*
   * Func: getContents
   * Desc: sets the HTML for the contents of this editor
   * Args: none
   */

  Editor.prototype.setContents = function(html) {
    this.$editor.html(html);
    return this.ensureAddPlaceholder();
  };


  /*
   * Func: clearContents
   * Desc: clears the contents of the editor entirely, replacing with an empty p tag
   * Args: none
   */

  Editor.prototype.clearContents = function() {
    this.$editor.html("<p>&nbsp;</p>");
    return this.ensureAddPlaceholder();
  };


  /*
   * Func: sanitize
   * Desc: Does some basic sanitization on the data.  This is used when pasted or
  					dragged into.
   * Args: none
   */

  Editor.prototype.sanitize = function() {
    var nextNode, node;
    console.log("sanitize");
    if (!this.$('p').length) {
      this.$editor.append('<p>&nbsp;</p>');
    }
    this.ensureAddPlaceholder();
    node = this.$editor[0].firstChild;
    while (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.wholeText.trim() !== "") {
          $(node).wrap("<p />");
          node = node.nextSibling;
        } else {
          nextNode = node.nextSibling;
          node.parentNode.removeChild(node);
          node = nextNode;
        }
      } else {
        node = node.nextSibling;
      }
    }
    this.$editor.find('meta').detach();
    this.$editor.find('span,font').contents().unwrap();
    this.$editor.find('b').contents().unwrap().wrap('<strong />');
    this.$editor.find('i').contents().unwrap().wrap('<em />');
    this.$editor.find('.addPlaceholder').each(function() {
      if ($(this).attr('contenteditable') !== "true") {
        return $(this).detach();
      }
    });
    this.$editor.find('strong + strong, em + em').each(function() {
      var $prev, prevContents;
      $prev = $(this).prev();
      prevContents = $prev.html();
      $prev.detach();
      return $(this).html(prevContents + $(this).html());
    });
    this.$editor.find("[style]").removeAttr("style");
  };


  /*
   * Func: sanitizeIfChanged
   * Desc: Checks the global changed variable and calls sanitize if needed.
   * Args: none
   */

  Editor.prototype.sanitizeIfChanged = function() {
    if (this.changed) {
      this.sanitize();
      this.changed = false;
    }
  };


  /*
   * Func: checkPlaceholderPosition
   * Desc: Check to see if the placeholder is in the proper position and show the add button if applicable
   * Args: @el - jQuery object - The element before or after where the add placeholder should appear
  				 @location - String - The location relative to @el where the placeholder should appear ("top" or "bot")
   */

  Editor.prototype.checkPlaceholderPosition = function(el, location) {
    var editor, moveBottom, moveTop;
    moveTop = location === "top" && (el.index() - 1) !== this.currentPlaceholderPosition;
    moveBottom = location === "bottom" && (el.index() + 1) !== this.currentPlaceholderPosition;
    editor = this;
    if ((moveTop || moveBottom) && this.moveTimer === null) {
      if (this.addPlaceholder.hasClass('showButton')) {
        this.hideAddButton();
        this.moveTimer = setTimeout((function() {
          editor.movePlaceholder(el, location);
          editor.moveTimer = null;
        }), 200);
      } else {
        this.movePlaceholder(el, location);
      }
    } else if (this.moveTimer === null) {
      this.showAddButton();
    }
  };


  /*
   * Func: movePlaceholder
   * Desc: Move the placeholder div to the correct location, above or below the relevant element
   * Args: @el - jQuery Object - The element that should be adjacent to the placeholder div
  				 @location - String - The location relative to @el where the placeholder should appear ("top" or "bot")
   */

  Editor.prototype.movePlaceholder = function(el, location) {
    if (location === "top") {
      this.addPlaceholder.detach().insertBefore(el);
    } else if (location === "bottom") {
      this.addPlaceholder.detach().insertAfter(el);
    }
    this.currentPlaceholderPosition = this.addPlaceholder.index();
  };


  /*
   * Func: showAddButton
   * Desc: Make the "add" button appear. This is the button that reveals the Add Bar when clicked
   * Args: none
   */

  Editor.prototype.showAddButton = function() {
    if (!this.addPlaceholder.hasClass('showButton')) {
      $('.addPlaceholder').removeClass('showButton').removeClass('showBar');
      this.addPlaceholder.addClass('showButton');
    }
  };


  /*
   * Func: hideAddButton
   * Desc: Make the "add" button disappear. This is the button that reveals the Add Bar when clicked 
   * Args: none
   */

  Editor.prototype.hideAddButton = function() {
    this.addPlaceholder.removeClass('showButton');
    this.addPlaceholder.removeClass('showBar');
  };


  /*
   * Func: toggleAddBar
   * Desc: Toggle visibility of the Add Bar. This bar allows the user to add elements to the DOM
   * Args: none
   */

  Editor.prototype.toggleAddBar = function() {
    if (!this.addPlaceholder.hasClass('showBar')) {
      $('.addPlaceholder').removeClass('showBar');
      return this.addPlaceholder.addClass('showBar');
    } else {
      return this.hideAddBar();
    }
  };


  /*
   * Func: hideAddBar
   * Desc: Remove visibility of the Add Bar. This bar allows the user to add elements to the DOM
   * Args: none
   */

  Editor.prototype.hideAddBar = function() {
    return this.addPlaceholder.removeClass('showBar');
  };


  /*
   * Func: Add Functions
   * Desc: Toggle visibility of the Add Bar. This bar allows the user to add elements to the DOM
   * Args: none
   */

  Editor.prototype.addImage = function() {
    return this.addElement('<img />');
  };

  Editor.prototype.addVideo = function() {
    return this.addElement('<div class="video"></div>');
  };

  Editor.prototype.addAudio = function() {
    return this.addElement('<div class="audio"></div>');
  };

  Editor.prototype.addH1 = function() {
    return this.addElement('<h1>[title]</h1>');
  };

  Editor.prototype.addH2 = function() {
    return this.addElement('<h2>[title]</h2>');
  };

  Editor.prototype.addQuote = function() {
    return this.addElement('<blockquote>[quote]</blockquote>');
  };

  Editor.prototype.addOlist = function() {
    return this.addElement('<ol><li></li></ol>');
  };

  Editor.prototype.addUlist = function() {
    return this.addElement('<ul><li></li></ul>');
  };

  Editor.prototype.addElement = function(newEl) {
    var el, newClass;
    this.hideAddBar();
    el = $(newEl);
    newClass = 'newEl';
    el.addClass(newClass);
    this.addPlaceholder.after(el);
    this.selectNewObject(newClass);
  };

  Editor.prototype.selectNewObject = function(className) {
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

  Editor.prototype.toggleTag = function(tag, newClass) {
    var addTag, curr, range, tagSelector, thisClass;
    range = this.addWrapper();
    thisClass = (newClass ? "." + newClass : "");
    tagSelector = tag + thisClass;
    curr = $(".currentSelection");
    addTag = !this.hasElement(curr, tagSelector, true);

    /* If the current selection is not wrapped in the tag and does not contain the tag
    		then wrap the current selection in the specified tag
     */
    if (addTag) {
      this.surroundRange(tag, newClass, range);
    }
    this.removeWrapper();
    rangy.restoreSelection(this.savedSelection);
    return addTag;
  };


  /*
   * Func: hasTag
   * Desc: Checks to see whether the specified element is wrapped by or contains the specified element AT ANY LEVEL
  		 This means
   * Args: @el - String - A jQuery-style identifier for base element (i.e. ".currentSelection")
  				 @testEl - String - A jQuery-style identifier for test element (i.e. "strong")
   */

  Editor.prototype.hasElement = function(el, testEl, remove) {
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

  Editor.prototype.addURL = function(identifier, href) {
    var classString;
    classString = (identifier ? "." + identifier : "");
    $("#addLink").modal("hide");
    $('a' + classString).attr("href", href).removeClass(identifier);
    $('#linkInput').val('');
    this.removeWrapper();
  };


  /*
   * Func: removeLink
   * Desc: Remove the specified link tag (unwrap their contents)
   * Args: @identifier - String - A jQuery-style identifier for the link (i.e. "a.newLink")
   */

  Editor.prototype.removeLink = function(identifier) {
    $("#addLink").modal("hide");
    $('a.temporaryLink').contents().unwrap();
    rangy.restoreSelection(this.savedSelection);
    this.removeWrapper();
  };


  /*
   * Func: addLink
   * Desc: Wrap the current selection in a link tag and open the Add Link modal to get the URL
   * Args: @identifier - String - A jQuery-style identifier for the class of the link (i.e. ".newLink")
   */

  Editor.prototype.addLink = function(newClass) {
    var add;
    this.addWrapper();
    add = !this.hasElement($(".currentSelection"), "a", true);
    if (add) {
      this.toggleTag("a", newClass);
      $("#addLink").modal("show");
      window.setTimeout((function() {
        $('#addLink #linkInput').focus();
        return console.log("Focus, please");
      }), 250);
    }
    this.removeWrapper();
    return add;
  };


  /*
   * Func: addWrapper
   * Desc: Add a wrapper element around the current selection
   * Args: none
   */

  Editor.prototype.addWrapper = function() {
    var range;
    range = this.getFirstRange();
    this.surroundRange("span", "currentSelection", range);
    return range;
  };


  /*
   * Func: removeWrapper
   * Desc: Remove the Current Selection wrapper (unwrap its contents)
   * Args: none
   */

  Editor.prototype.removeWrapper = function() {
    $(".currentSelection").contents().unwrap();
  };


  /*
   * Func: hideTextEditBox
   * Desc: Hide the text editing button bar
   * Args: none
   */

  Editor.prototype.hideTextEditBox = function() {
    this.textEditBox.addClass("hidden");
  };


  /*
   * Func: showTextEditBox
   * Desc: Position the correct text editing button bar relative to the selection
   * Args: none
   */

  Editor.prototype.showTextEditBox = function() {
    var left, sPos, selectionMarker, top;
    selectionMarker = $(".rangySelectionBoundary").css("display", "inline").first();
    sPos = 0;
    top = 0;
    left = 0;
    if (selectionMarker) {
      this.textEditBox.removeClass("hidden");
      sPos = selectionMarker.position();
      top = sPos.top - this.textEditBox.height() - 15;
      left = sPos.left - 15;
      this.textEditBox.css("top", top).css("left", left);
    } else {
      this.textEditBox.hide();
    }
  };


  /*
   * Func: getSelectedText
   * Desc: Check to see if any text is selected. If so, mark the selection in the DOM using setSelectionMarker.
   * Args: none
   */

  Editor.prototype.getSelectedText = function() {
    var hasSelection, sel, selectedText;
    sel = rangy.getSelection();
    selectedText = sel.toString();
    hasSelection = false;
    if (this.$editor.has(sel.anchorNode).length && this.$editor.has(sel.focusNode).length) {
      if (selectedText) {
        hasSelection = this.setSelectionMarker();
      } else {
        this.hideTextEditBox();
        hasSelection = this.setCursorMarker();
      }
    } else {
      this.hideTextEditBox();
      this.clearCursorMarker();
      this.clearSelectionMarkers();
    }
    return hasSelection;
  };


  /*
   * Func: setCursorMarker
   * Desc: Set a marker at the position of the cursor
   * Args: none
   */

  Editor.prototype.setCursorMarker = function() {
    var cursorActive, parent, range;
    range = this.getFirstRange();
    cursorActive = true;
    if (range) {
      parent = $(range.startContainer);
      cursorActive = parent.closest(".editable").size() > 0;
    }
    this.clearSelectionMarkers();
    return false;
  };


  /*
   * Func: clearCursorMarker
   * Desc: Remove all cursor markers
   * Args: none
   */

  Editor.prototype.clearCursorMarker = function() {
    $(".cursorSelection").remove();
  };


  /*
   * Func: clearSelectionMarkers
   * Desc: Remove all selection markers, including cursor marker, from the text
   * Args: none
   */

  Editor.prototype.clearSelectionMarkers = function() {
    this.clearCursorMarker();
    if (this.savedSelection) {
      rangy.removeMarkers(this.savedSelection);
      this.savedSelection = null;
      this.normalizeText();
    }
  };


  /*
   * Func: setSelectionMarker
   * Desc: Mark the beginning and end of the current selection with empty elements.
   * Args: none
   */

  Editor.prototype.setSelectionMarker = function() {
    this.clearSelectionMarkers();
    this.savedSelection = rangy.saveSelection();
    return true;
  };


  /*
   * Func: getFirstRange
   * Desc: Get the selection object from the rangy object.
   * Args: none
   */

  Editor.prototype.getFirstRange = function() {
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

  Editor.prototype.normalizeText = function() {
    var eCon, range, sCon;
    range = this.getFirstRange();
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

  Editor.prototype.surroundRange = function(newElement, elClass, inputRange) {
    var el, elementClass, ex, range;
    range = (inputRange ? inputRange : this.getFirstRange());
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

  Editor.prototype.makeSelectionWrappable = function(inputRange) {
    var range;
    range = (inputRange ? inputRange : this.getFirstRange());
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

  window.Editor = Editor;

  editor1 = new Editor($(".editContainer1")[0]);

  window.editor1 = editor1;

  editor2 = new Editor($(".editContainer2")[0]);

  window.editor2 = editor2;

  $('.save').on('click', function() {
    console.log(editor1.getContents());
    return console.log(editor2.getContents());
  });

  $('.btn.cancel').on('click', function() {
    editor1.clearContents();
    return editor2.setContents('<p>this is editor 2!</p>');
  });

  return Editor;

}).call(this);
