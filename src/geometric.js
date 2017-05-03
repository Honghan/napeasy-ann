//Jackey
//SmartPresenter robot namespace
var wr = wr || {};

wr.Geometric = function(){
	//margin percentage
	this.mp = 0.2;

	//partition required threshold
	this.pattThreshold = 0.3;

	//container size
	this.cs = {"w":$(document).width(),"h":$(document).height()};
	this.csarea = this.cs.w * this.cs.h;
	this.minPattArea = this.csarea * this.pattThreshold;
	console.log(this.minPattArea);
};

/**
* bottom up analysis: starting from central point
*/
wr.Geometric.prototype.buAnalysis = function(){
	//0. settings
	var stopRatio = 0.1;
	//1. get the central point
	var w = {w: $(window).width(), h: $(window).height()};
	var p = {x: w.w/2, y: w.h/2};
	var elem = document.elementFromPoint(p.x, p.y);
	
	
	
	//keep looking up until meeting the criteria
	var e = $(elem);
	var area = e.width() * e.height();
	while(area < w.w * w.h * stopRatio){
		e = $(e).parent();
		area = e.width() * e.height();
	}

	$(e).css('background-color', 'rgba(255, 0, 255, 0.5)');
	this.parseElement(e);
};

/*
 the goal is to get a group of actionable objects for
 executing purchase work flow.
 Technically, parse meta-data enhanced groups.
 targeted results include text, list, select, input,
 button; Sometimes, it might be reasonable to consider
 domain specific groups: color, price, size; 

 the main idea is to use geometric composition to breakdown
 an element into sub-groups. Two situations:
 1. if parent is geometrically composed of several parallel 
 	children, then it is a list. So visually we found a group.
 	Semantically, it is a list.
 2. if the child is the geometrically the same size, then the
 	parent is more or less just a container. This means the
 	parent is not important visually, therefore, semantically
 	trivial.

 one other important information is microdata. It can be used
 in analyzing the actionable elements.
*/
wr.Geometric.prototype.parseElement = function(elem){
	var p = elem;
	var pdim = $(p).width() * $(p).height();
	var pwh = {w: $(p).width(), h:$(p).height()}
	var children = $(p).children();
	var gcounter = 0;
	var groups = [];
	for(var i=0;i<children.length;i++){
		var child = children.get(i);
		var s = this.dimCoutable(child)
		if (s){
			groups.push(s);
		}
	}
	console.log($.toJSON(groups));
	chrome.runtime.sendMessage({groups: groups}, function(response) {
	    
	});
};

/**
* top down analysis: starting from body element
*/
wr.Geometric.prototype.tdAnalysis = function(){
	var b = $("body");
	var partElem = {e: b, area: b.width() * b.height()};
	var results = [];
	var red = 255;
	var counter  = 0;
	while(partElem != null){		
		var p = partElem.e;
		var pattResults = [];
		var partElem = null;
		for(var i=0;i<p.children().length;i++){
			var c = p.children()[i];
			if (this.tdIsSig(c)){
				pattResults.push(c);
				var area = this.pattArea(c);
				if (area > 0){
					if (partElem == null || partElem.area < area){
						partElem = {e: $(c), area: area};
					}
				}
			}
		}
		results.push({p: p, c: pattResults});
	}
	if (results.length > 1)
		$(results[results.length - 1].p).css('background-color', 'red');s
};

// check whether a further partition is needed
wr.Geometric.prototype.pattArea = function(elem){
	var area = $(elem).width() * $(elem).height();
	console.log();
	if (area >= this.minPattArea){
		return area;
	}
	return 0;
};

wr.Geometric.prototype.dimCoutable = function(elem){
	if ($(elem).attr('tagName').toUpperCase() == "SCRIPT") return null;
	if (!$(elem).is(":visible") 
		|| ($(elem).css('visibility') && $(elem).css('visibility').toLowerCase() == "hidden") 
		)
		return null;
	var size = {w:$(elem).width(), h:$(elem).height(), x: $(elem).offset().left, y:$(elem).offset().top, tag:$(elem).attr('tagName'), children:[], text:""};
	if ($(elem).attr("id"))
		size["id"] = $(elem).attr("id");
	if ($(elem).attr("class"))
		size["class"] = $(elem).attr("class");
	if ($(elem).contents().length > 0){
		var aggSize = {w:0, h:0};
		for (var i = 0; i < $(elem).contents().length; i++) {
		    var child = $(elem).contents().get(i);
		    if (child.nodeType == 1) {
		        var s = this.dimCoutable(child);
		        if (s != null) {
		            aggSize.w = Math.max(s.w + $(child).offset().left - $(elem).offset().left, size.w);
		            aggSize.h += Math.max(s.h + $(child).offset().top - $(elem).offset().top, size.h);
		            size.children.push(s);
		        }
		    } else if (child.nodeType == 3) {
		    	var text = $.trim(child.textContent);
		        if (text.length > 0) {
		            size.children.push({ "text": text });
		        }
		    }
			
		}
		size.w = (aggSize.w > size.w) ? aggSize.w : size.w;
		size.h = (aggSize.h > size.h) ? aggSize.h : size.h;
		/*if (size.children.length == 1){
			if (size.children[0].text) size.text = size.children[0].text;
			size = size.children[0];
		}*/
	}
	
	if (size.w == 0
		|| size.h ==0){
		return null;
	}
	return size;
};

// check whether an element is geometic significant
wr.Geometric.prototype.tdIsSig = function(elem, p){
	if (!p) p = this.cs;
	this.sigThreshold = 0.1;
	if ($(elem).attr('tagName').toUpperCase() == "SCRIPT") return false;
	if (!$(elem).is(":visible")) return false;
	if ($(elem).width() / p.w <= this.sigThreshold
		&& $(elem).height() / p.h <= this.sigThreshold){
		return false;
	}
	return true;
};

//identify actionable components
wr.Geometric.prototype.actionables = function(elem){
	this.sigThreshold = 0.1
	if ($(elem).attr('tagName').toUpperCase() == "SCRIPT") return false;
	if ($(elem).width() / this.cs.w <= this.sigThreshold
		&& $(elem).height() / this.cs.h <= this.sigThreshold){
		return false;
	}
	return true;
};

wr.Geometric.prototype.getAreaDesc = function(elem){
	var desc = "";
	var pos = $(elem).offset();
	if (pos.left <= this.cs.w * this.mp)
		desc += "left";
	else if (pos.left >= this.cs.w * (1-this.mp))
		desc += "right";
	else
		desc += "middle";

	desc += " , ";

	if (pos.top <= this.cs.h * this.mp)
		desc += "top";
	else if (pos.top >= this.cs.h * (1-this.mp))
		desc += "bottom";
	else
		desc += "central";
	return desc;
};