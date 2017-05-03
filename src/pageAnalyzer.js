//web robot namespace
var wr = wr || {};

//the main class constructor
wr.PageAnalyzer = function(){
	this.features = {};
	this.locAttrs = ["id", "class"];
	this.htOn = false;
	this.init();
	this.highlights = {};
};

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
     console.log(request);
     if (request.action == "message")
     	_pageAnalyzer.showMessage(request.message);
     if (request.action == "annData"){
     	_pageAnalyzer.loadAnns(request.message);
     }
});

//initailisation function
wr.PageAnalyzer.prototype.init = function(){
	$('body').append('<div id="nea_menu"><span id="nea_logo">Napeasy Annotator<br/>PHI Kings College London</span> <div id="nea_message"></div></div>');
	$('body').append('<div id="nea_pop"><input type="text"/><span id="btnOk">ok</span><span id="btnDel">del</span></div>');
	var thisObj = this;

	$('#btnRender').click(function(){
		thisObj.rerender();
	});
	$('#nea_pop input').keyup(function(e){
		if (e.which == 13){
			$('#btnOk').click();
			e.preventDefault();
			e.stopPropagation();
		}
	});
	$('#btnOk').click(function(){
		var htId = $(this).closest('.nea_ht').attr('nea_ht_id');
		thisObj.highlights[htId].meta = $('#nea_pop input').val();
		$('.' + htId).find('.nea_label').html($('#nea_pop input').val());
		$('#nea_pop').hide();
		thisObj.save();
	});
	$('#btnDel').click(function(){
		var htId = $(this).closest('.nea_ht').attr('nea_ht_id');
		thisObj.deleteHt(htId);
	});
}

wr.PageAnalyzer.prototype.requestAnns = function(){
	var thisObj = this;
	chrome.runtime.sendMessage({action: "load", data: {url:window.location.href}}, function(response) {
	    thisObj.showMessage('loading annotations...');
	});
}

wr.PageAnalyzer.prototype.loadAnns = function(annStr){
	if (annStr && annStr.length > 0){
		this.highlights = $.parseJSON(annStr);
		this.rerender();
		this.showMessage('annotations loaded');
	}else{
		this.showMessage('no annotations');
	}
}

wr.PageAnalyzer.prototype.showMessage = function(msg){
	$('#nea_message').html(msg);
}

//toggle the highlighting switch
wr.PageAnalyzer.prototype.toggleHt = function(){
	this.htOn = !this.htOn;
	if (this.htOn){
		$('#nea_menu').show();
		this.showMessage('highlighting activated');
		this.requestAnns();
	}else{
		$('#nea_menu').hide();
		this.clearHighlighting();
	}
}

//check whether current selection is valid
wr.PageAnalyzer.prototype.isValidSelection = function(selection){
	return selection && (selection.anchorNode != selection.focusNode || selection.anchorOffset != selection.focusOffset)
}

//get current user selection and generate selection object 
//including the jquery style selectors and meta data
wr.PageAnalyzer.prototype.getSelection = function(){
	if (!this.htOn) return;
	var selection = window.getSelection();
	var selected = [];
	if (this.isValidSelection(selection)){
		if (selection.anchorNode == selection.focusNode){
			var s = Math.min(selection.anchorOffset, selection.focusOffset);
			var e = Math.max(selection.anchorOffset, selection.focusOffset);
			selected.push(this.getSelectedObject(selection.anchorNode, s, e));
		}
		else{
			//TODO: to support a selection crossing multiple elements
			// selected.push(this.getSelectedObject(selection.anchorNode, selection.anchorOffset, -1));
			// selected.push(this.getSelectedObject(selection.focusNode, 0, selection.focusOffset));
			this.showMessage('sorry: selection across multiple elements or overlapping with existing ones is not supported');
			return;
		}
		var selectObject = {"selected": selected, "meta": ""};
		selectObject.id = this.getMD5HtObject(selectObject);
		console.log(selectObject);
		this.highlighting(selectObject);
		this.highlights[selectObject.id] = selectObject;
		this.showMessage('highlight created');
		this.save();
	}
	return selection;
};

wr.PageAnalyzer.prototype.save = function(){
	var thisObj = this;
	chrome.runtime.sendMessage({action: "save", data: {url:window.location.href, anns: $.toJSON(this.highlights)}}, function(response) {
	    thisObj.showMessage('saving...');
	});
}

wr.PageAnalyzer.prototype.getSelectedObject = function(node, start, end){
	var loc = this.getLocatorByAttrs(node);
	if (loc){
		return this.getHTObject(node, loc, start, end);
	}
	return null;
};

//create highlighting object
wr.PageAnalyzer.prototype.getHTObject = function(elem, loc, start, end){
	var index = -1;
	var o = {"type": "node", "loc": loc, "index": index, "start": start, "end":end};
	if (elem.nodeType == 3){
		$(loc).contents().each(function(idx){
			if (elem == this){
				index = idx;
			}
		});
		o.index = index;
		o.type = "textNode";
	}
	return o;
};

//create a MD5 hash from a highlight
wr.PageAnalyzer.prototype.getMD5HtObject = function(obj){
	var s = "";
	for(var i=0;i<obj.selected.length;i++){
		var o = obj.selected[i];
		s += o.type + " " + o.loc + " " + o.index + " " + o.start + " " + o.end + " ";
	}
	return CryptoJS.MD5(s).toString();
}

wr.PageAnalyzer.prototype.getLocatorByAttrs = function(elem){
	var node = elem;
	while(node.nodeType != 1){
		node = node.parentElement;
	}
	if (!node)
		return null;

	var tagName = node.tagName;
	var attr = null;
	var loc = null;
	for(var i=0;i<this.locAttrs.length;i++){
		attr = this.locAttrs[i];
		if ($(node).attr(attr) && $(node).attr(attr).length > 0){
			loc = tagName + " [" + attr + "='" + $(node).attr(attr) + "']";
			break;
		}
	}
	if (!loc){
		loc = tagName;
	}

	return this.getIndexLocator(node, loc);
};

//a locator/selector might locate multiple elements on a page (e.g., 'p')
//this function get the index of wanted element in the list of
//elements that are located by the given locator - loc
//this is usually useful for locating text nodes
wr.PageAnalyzer.prototype.getIndexLocator = function(node, loc){
	var found = false;
	$(loc).each(function(index){
		if ($(this).get(0) == $(node).get(0)){
			found = true;
			loc = loc + ":eq(" + index + ")";
		}
	});
	return found ? loc : null;
};

//do the highlighting for a given highlight object
wr.PageAnalyzer.prototype.highlighting = function(obj){
	var htObjs = obj.selected;

	//select objects before doing actual highlighting to avoid 
	// potential messed ups of inserted elements.
	for(var i=0;i<htObjs.length;i++){
		if (htObjs[i].type == "node")
			htObjs[i].obj = $(htObjs[i].loc);
		else{
			$(htObjs[i].loc).contents().each(function(index){
				if (index == htObjs[i].index){
					htObjs[i].obj = $(this).get(0);
				}
			});
		}
	}

	for(var i=0;i<htObjs.length;i++){
		if (htObjs[i].type == "node"){
			//htObjs[i].obj.css('background', 'red');
		}else{
			var s = htObjs[i].start;
			var e = htObjs[i].end == -1 ? htObjs[i].obj.nodeValue.length : htObjs[i].end;
			var preText = document.createTextNode(htObjs[i].obj.nodeValue.substring(0, s));
			var htText = document.createElement("em");
			$(htText).addClass('nea_ht');
			$(htText).addClass(obj.id);
			$(htText).attr("nea_ht_id", obj.id);
			htText.innerText = htObjs[i].obj.nodeValue.substring(s, e);
			var sufText = document.createTextNode(htObjs[i].obj.nodeValue.substring(e, htObjs[i].obj.nodeValue.length));
			$(preText).insertAfter(htObjs[i].obj);
			$(htText).insertAfter($(preText));
			$(sufText).insertAfter($(htText));
			var h = $(htText).height();
			$(htText).append('<span class="nea_label"></span>');
			$(htText).find('.nea_label').html(obj.meta);
			$(htText).find('.nea_label').css('bottom', h);
			htObjs[i].obj.parentNode.removeChild(htObjs[i].obj);
		}
	}
	var thisObj = this;
	$('.' + obj.id).mouseover(function(){
		if ($(this).find('#nea_pop').length > 0){
			$('#nea_pop').show();
		}else{
			$('.' + obj.id + ':eq(0)').append($('#nea_pop'));
			$('#nea_pop').css("bottom", $('.' + obj.id + ':eq(0)').height());
			$('#nea_pop').show();
			$('#nea_pop input').val(thisObj.highlights[obj.id].meta);
		}
		$(this).addClass('nea_hover');
		
	});
	$('.' + obj.id).mouseout(function(){
		$(this).removeClass('nea_hover');
		$('#nea_pop').hide();
	});

};

//delete a highlighting
wr.PageAnalyzer.prototype.deleteHt = function(htId, keepObj){
	$('#nea_pop').hide();
	$('body').append($('#nea_pop'));
	$('.' + htId).each(function(){
		$(this).find('.nea_label').remove(); //remove label first
		var text = "";
		$(this).contents().each(function(){
			text += $(this).text();
		});
		var txtNode = document.createTextNode(text);
		$(txtNode).insertAfter($(this));
		var p = $(this).parent().get(0);
		$(this).remove();
		p.normalize(); // it's important to do the normalise to merge separated text nodes
	});
	if (!keepObj){
		delete this.highlights[htId];
		this.save();
	}
}

wr.PageAnalyzer.prototype.clearHighlighting = function(){
	for(var id in this.highlights){
		this.deleteHt(id, true);
	}
}

wr.PageAnalyzer.prototype.rerender = function(){
	this.clearHighlighting();
	for(var id in this.highlights){
		this.highlighting(this.highlights[id]);
	}
}

var _pageAnalyzer = null;
wr.PageAnalyzer.getInstance = function(){
	if (_pageAnalyzer == null){
		_pageAnalyzer = new wr.PageAnalyzer();
	}
	return _pageAnalyzer;
}

$(document).ready(function(){
	_pageAnalyzer = wr.PageAnalyzer.getInstance();
	$('body').mouseup(function(){
		_pageAnalyzer.getSelection();
	});
	// $(document).keyup(function(event){
	// 	if (event.which == 192){
	// 		_pageAnalyzer.toggleHt();
	// 	}
	// });
	$(document).bind('keypress', function(event) {
	    if( event.which == 33 && event.shiftKey ) {
	        _pageAnalyzer.toggleHt();
	    }
	});
});
