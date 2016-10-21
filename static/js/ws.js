window.onload = fetchDataFromServer();

function fetchDataFromServer() {
    var dataSocket = new ReconnectingWebSocket("ws://" + location.host + "/ws",
            null, {binaryType: "arraybuffer"});
    dataSocket.onopen = function() { console.log("Yay, I opened a socket!"); }
    dataSocket.onclose = function() { console.log("Oh no the socket closed."); }
    dataSocket.onmessage = function(event) { MessageMaster.handleMessage(event); }
}
