//SmartPresenter robot namespace
var wr = wr || {};

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
     console.log(request);
     _service.doRequest(request);
});

wr.AnnService = function(){
};

wr.AnnService.prototype.doRequest = function(request){
	if (request.action == "save"){
		var thisObj = this;
		this.saveAnn(request.data.url, request.data.anns, function(s){
			thisObj.sendMessage({action: "message", message: "save result: " + s});
		});
	}

	if (request.action == "load"){
		var thisObj = this;
		this.loadAnn(request.data.url, function(s){
			thisObj.sendMessage({action: "annData", message: s});
		});
	}
}

wr.AnnService.prototype.saveAnn = function(url, anns, cb){
	qbb.inf.saveAnn(url, anns, cb);
}

wr.AnnService.prototype.loadAnn = function(url, cb){
	qbb.inf.loadAnn(url, cb);
}

wr.AnnService.prototype.sendMessage = function(message){
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	  chrome.tabs.sendMessage(tabs[0].id, message, function(response) {
	    console.log(response);
	  });
	});
}

var _service = null;
$(document).ready(function(){
	_service = new wr.AnnService();
});
