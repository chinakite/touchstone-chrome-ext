"use strict";

console.log("content-script: LOAD");

var port;

var listElem = [];
var attributiPrioritari = ["id"];
var ordineAttributi = ["id", "name", "class", "title", "alt", "value"];
var attributiBlackList  = ["href", "src", "onclick", "onload", "tabindex", "width", "height", "style", "size", "maxlength", "data-click"];

function setupPortIfNeeded() {
    if (!port) {
        port = chrome.runtime.connect(null, { name: "touchstone-content" });
        port.postMessage({ action: "init" });
        port.onDisconnect.addListener(function () {
            port = null;
        });
    }
};

function sendEventMsg(event, msg) {
    setupPortIfNeeded();
    port.postMessage(msg);
};

$(document).on("change", ":text", function(event){
    getInfo(this);
    var t = $(this);
    var tValue = t.val();
    var tType = t.attr('type');
    sendEventMsg(event, {
        action: "input",
        target: "touchstone-start",
        op: {
            location: Robula(this),
            value: tValue,
            targetType: tType
        }
    });
});

$(document).on("click", ":button", function(event){
    getInfo(this);
    var t = $(this);
    var tType = t.attr('type');
    sendEventMsg(event, {
        action: "click",
        target: "touchstone-start",
        op: {
            location: Robula(this),
            targetType: tType
        }
    });
});

$(document).on("click", "a", function(event){
    console.log("click a!!!!!!");
    getInfo(this);
    sendEventMsg(event, {
        action: "click",
        target: "touchstone-start",
        op: {
            location: Robula(this),
            targetType: "link"
        }
    });
});

// ROBULA
function Robula(e) {
    var res = []; //XPath res = new XPath();
	var p = ["//*"]; //List<XPath> p = ["//*"];
	var temp = [];

    while (res.length == 0){ //res.isEmpty()
        var aux;
		var w = p.shift();	//XPath w = p.removeFirst()

		temp = [];

        if (w.substr(0, 3) == "//*" && w[3] != "["){ //w.startsWith("//*")
			temp.push(transfConvertStar(w)); 	//temp.addAll(transfConvertStar(w));
		}

        if (w.substr(0, 3) != "//*"){
            var i=0;
            aux = transfAddAttribute(w, true);

			if(aux!=null){
				for(;i<aux.length;i++){
					temp.push(aux[i]);	//temp.addAll(transfAddAttribute(w, true));
				}
			}

            aux = transfAddText(w);

			if(aux!=null){
				temp.push(aux);	//temp.addAll(transfAddText(w));
			}

            aux = transfAddAttribute(w, false);

			if(aux!=null){
				for(;i<aux.length;i++){
					temp.push(aux[i]);	//temp.addAll(transfAddAttribute(w, false));
				}
			}
			aux = transfAddPosition(w);

			if(aux!=null){
				temp.push(aux);	//temp.addAll(transfAddPosition3(w));
			}
        }

        aux = transfAddLevel(w);

		if(aux!=null){
			temp.push(aux);	//temp.addAll(transfAddLevel(w));
		}

		for (var i=0; i<temp.length;i++){	//for (XPath x : temp)

			if (uniquelyLocate(temp[i], e)) {
				res = temp[i]; break;
			}
			else if (locate(temp[i], e)) {
				 p.push(temp[i]);	//add(x, p);

			}
		}
    }
    return res;
}

function transfConvertStar(w){
	var aux = w.substr(2).split("/");
	var n = countSlashes(w,aux);

	return w.replace("*", listElem[n].tag);
}

function countSlashes(w, aux) {
	var n = aux.length - 1;
	var arr = w.substr(2).split("[");
	for(var i=0;i<arr.length;i++){
		var a=arr[i].indexOf("]");
		if(a>0){
			var tmp=arr[i].substr(0,a);
			var b=tmp.split("/");
			n= n + 1 - b.length;
		}
	}
	return n;
}

function transfAddAttribute(w, priority){

	var aux = w.substr(2).split("/");
	var n = countSlashes(w,aux);
	var res = [];

	if(!isIn("[", aux[0]) ){
		for(var j=0;j< listElem[n].attr.length;j++){
			if(listElem[n].attr[j].name == "id" || !priority){

				var temp = "//" + aux[0] +"[@" + listElem[n].attr[j].name;

				if(isIn("\'",listElem[n].attr[j].value)) {
					temp = temp + "=\"" + listElem[n].attr[j].value + "\"]";
				} else {
					temp = temp + "=\'" + listElem[n].attr[j].value + "\']";
                }

				for(var i=1;i<n+1;i++){
					temp = temp + "/" +aux[i];
				}
				res.push(temp);
			}
		}

		 return res;
	}
	return null;
}

function transfAddText(w){

	var aux = w.substr(2).split("/");
	var n = countSlashes(w,aux);

	var temp;
	var ind = aux[0].indexOf("[");

	if(ind != -1){
		if( aux[0][ind+1]!="@") {
			return null;
        }

		var ind2 = aux[0].indexOf("[", ind+1);
		if(ind2 != -1){
			if( aux[0][ind2+1]!="@") {
				return null;
            }
		}
	}


	if(isIn("\'",listElem[n].text) && isIn("\"",listElem[n].text)){

		indA = listElem[n].text.indexOf("\'");
		indV = listElem[n].text.indexOf("\"");
		if(indA>indV){
			temp = "//" + aux[0] +"[contains(text(),\'"+ listElem[n].text.substr(0, indA) + "\')]";
		}else {
			temp = "//" + aux[0] +"[contains(text(),\""+ listElem[n].text.substr(0, indV) + "\")]";
		}
	}
	else{
		if(isIn("\'",listElem[n].text))	{
			temp = "//" + aux[0] +"[contains(text(),\""+ listElem[n].text + "\")]";
        } else {
			temp = "//" + aux[0] +"[contains(text(),\'"+ listElem[n].text + "\')]";
        }
	}
	for(var i=1; i<n+1; i++){
		temp = temp + "/" +aux[i];
	}

	return temp;
}

function transfAddPosition(w){

	var aux = w.substr(2).split("/");
	var n = countSlashes(w,aux);

	var ind = aux[0].indexOf("[");

	if(ind != -1){
		if( aux[0][ind+1]!="@" || aux[0][ind+1]!="c"){
			return null;
        }
		var ind2 = aux[0].indexOf("[", ind+1);
		if(ind2 != -1){
			if( aux[0][ind2+1]!="@" || aux[0][ind2+1]!="@") {
				return null;
            }
		}

		if(aux[0].indexOf("[", ind2+1)!=-1) {
			return null;
        }
	}


	if(aux[0]=="*"){
		var temp = "//" + aux[0] +"["+ listElem[n].posStar + "]";
	} else {
		var temp = "//" + aux[0] +"["+ listElem[n].pos + "]";
	}

	for(var i=1; i<n+1; i++){
		temp = temp + "/" +aux[i];
	}

	return temp;


}

function transfAddLevel(w){

	var aux = w.substr(2).split("/");
	var n = countSlashes(w,aux);

	if(n < listElem.length -1) {
		return "//*" + w.substr(1);
    }
	return null;
}

function uniquelyLocate(x,e){
    var result = xpath(x);
    if( result.length == 1 &&  result[0]==e) return true;
	return false;
}

function locate(x,e){
    var result = xpath(x);
    if(isIn(e, result)) return true;
	return false;
}

function isIn(elem, array){
	if(array.indexOf(elem)==-1) return false;
	return true;
}

function xpath(xpath, parent){
    var results = [];
    var query = document.evaluate(xpath, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i=0, length=query.snapshotLength; i<length; ++i) {
        results.push(query.snapshotItem(i));
    }
    return results;
}




function getInfo(inspectingNode) {
	listElem = [];
	for(var node = inspectingNode; node != null && node.nodeName != "#document";node=node.parentNode){
		var Elem = {};

   		Elem.attr = Array.prototype.slice.call(node.attributes).reverse();

		Elem.attr=ignoreAttribute(Elem.attr);
		Elem.attr=orderAttribute(Elem.attr);
        Elem.pos = getPositionNode(node);
        Elem.posStar = getPositionStar(node);
		Elem.tag = node.nodeName.toLowerCase();
		Elem.text = node.textContent;

		listElem.push(Elem);
	}
}

function priorityAttribute(attr) {

	var aux = [];
	var priority = [];
	for(var i=0;i<attributiPrioritari.length;i++){
		priority.push(null);
	}

	for(var i=0;i<attr.length;i++){
		if(isIn(attr[i].name, attributiPrioritari)){
			var ind = attributiPrioritari.indexOf(attr[i].name);
			priority[ind]=attr[i];
		}
		else aux.push(attr[i]);
	}

	for(var i=priority.length-1;i>-1;i--){
	  	if(priority[i]!=null)
			aux.unshift(priority[i]);
	}

	return aux;
}

function orderAttribute(attr) {

	var aux = [];
	var order = [];
	for(var i=0;i<ordineAttributi.length;i++){
		order.push(null);
	}

	for(var i=0;i<attr.length;i++){
		if(isIn(attr[i].name, ordineAttributi)){
			var ind = ordineAttributi.indexOf(attr[i].name);
			order[ind]=attr[i];
		}
		else aux.push(attr[i]);
	}

	for(var i=order.length-1;i>-1;i--){
	  	if(order[i]!=null)
			aux.unshift(order[i]);
	}

	return aux;
}

function ignoreAttribute(attr) {

	for(var i=0; i<attr.length; i++){
		if(isIn(attr[i].name, attributiBlackList)){
			attr.splice(i, 1);
		}
	}
	return attr;
}

function getPositionNode(node) {
	if (!node.parentNode) // se sono HTML
		return 1;

	var siblings = node.parentNode.childNodes;
	var count = 0;
	var position;

	for (var i = 0; i < siblings.length; i++) {
		var object = siblings[i];
		if(object.nodeType == node.nodeType && object.nodeName == node.nodeName) {
			count++;
			if(object == node) position = count;
		}
	}

	return position;
}

function getPositionStar(node) {
	if (!node.parentNode) // se sono HTML
		return 1;

	var siblings = node.parentNode.childNodes;
	var count = 0;
	var position;

	for (var i = 0; i < siblings.length; i++) {
		var object = siblings[i];
		if(object.nodeName == node.nodeName) {
			count++;
			if(object == node) position = count;
		}
	}

	return position;
}
