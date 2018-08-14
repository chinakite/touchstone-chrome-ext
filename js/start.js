var port = chrome.runtime.connect(null, { name: "touchstone-start"});
port.postMessage({ action: "init" });

port.onMessage.addListener(function(message, sender) {
    console.log("start: onMessage", message, sender);

    switch (message.action) {
        case "input":
            var html = '<li class="list-group-item">input "' + message.op.value + '" into "' + message.op.location + '";</li>';
            $('#testScripts').append(html);
            break;
        case "click":
            var html = '<li class="list-group-item">click "' + message.op.location + '";</li>';
            $('#testScripts').append(html);
            break;
    }
});

$(document).ready(function(){
    $('#goBtn').click(gostart);
});

var observeTabs = [];

function gostart(e) {
    var url = $('#gostartUrl').val();
    if(url) {
        chrome.tabs.create({ url: url }, function(tab){
            var html = '<li class="list-group-item">get "' + url + '";</li>';
            $('#testScripts').empty().append(html);
        });
    }else{
        $('#gostartErr').html('地址不能为空.');
    }
}
