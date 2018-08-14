"use strict";

console.log("background: LOAD");

chrome.browserAction.onClicked.addListener(function(activeTab){
    chrome.tabs.create({ url: chrome.extension.getURL('start.html') });
});

var connections = {};

chrome.runtime.onConnect.addListener(function (port) {
    console.log("background-script onConnect", port);

    if (port.name != 'touchstone-start' && port.name != "touchstone-content") {
        return;
    }

    var extensionListener = function (message) {
        console.log("background-script port.onMessage", message, port);
        var tabId = port.sender.tab ? port.sender.tab.id : message.tabId;
        console.log("background-script port.onMessage tabId: ", tabId);

        if (message.action == "init") {
            if(port.name == 'touchstone-start') {
                connections[port.name] = port;
            }else{
                if (!connections[tabId]) {
                    connections[tabId] = {};
                }
                connections[tabId][port.name] = port;
            }
            return;
        }

        console.log("background-script connections: ", connections);

        if (message.target) {
            console.log("background-script message.target: ", message.target);
            var conn;
            if(message.target == 'touchstone-start') {
                conn = connections[message.target];
            }else{
                conn = connections[tabId][message.target]
            }
            console.log("background-script conn:", conn);
            if (conn) {
                console.log("background-script send message to " + message.target);
                conn.postMessage(message);
            }
        }
    };

    port.onMessage.addListener(extensionListener);

    port.onDisconnect.addListener(function(port) {
        console.log("background-script onDisconnect", port);

        port.onMessage.removeListener(extensionListener);

        var tabs = Object.keys(connections);
        for (var i=0, len=tabs.length; i < len; i++) {
            if (connections[tabs[i]][port.name] === port) {
                console.log("background-script onDisconnect connections cleanup", {tabId: tabs[i], portName: port.name});
                delete connections[tabs[i]][port.name];

                if (Object.keys(connections[tabs[i]]).length === 0) {
                    console.log("background-script onDisconnect remove connection object", {tabId: tabs[i]});
                    delete connections[tabs[i]];
                }
                break;
            }
        }

        delete connections['touchstone-start'];
    });
});

// var trackedTabs = [];

// chrome.runtime.onMessage.addListener( function( request, sender, sendResponse ) {
//     console.log(request.message);
//   switch ( request.message ) {
//     case 'track-navigation':
//       trackedTabs.push( request.of );
//       trackNavigation();
//       break;
//   }
// } );
//
// function trackNavigation() {
//   chrome.webNavigation.onDOMContentLoaded.addListener(function(detail){
//       console.log(detail);
//   });
// }
