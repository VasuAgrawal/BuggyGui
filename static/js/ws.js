window.onload = fetchDataFromServer();

function initializeScatter(divId) {
    var plot = makeCardDiv(divId, colCount = 6, height = "400px");
    var data = [{x: [], y: [], type: 'scatter'}];
    Plotly.plot(plot, data);
    registerPlot(plot);
}

function initializeStatus(divId) {
    var card = makeCardDiv(divId, colCount = 4);
    card.className = "mdl-card";

    title = document.createElement("div");
    title.className = "mdl-card__title";
    titleText = document.createElement("h2");
    titleText.className = "mdl-card__title-text";
    titleText.innerHTML = "Robobuggy Statuses";
    title.appendChild(titleText);
    card.appendChild(title);

}

function initializeWidgets() {
    initializeScatter("graph1");
    initializeScatter("graph2");
    initializeScatter("graph3");
    initializeScatter("graph4");
    initializeStatus("statuses");
}

function onImuMessage(message) {
    //console.log("Received imu message!");
    //console.log(message);
    var plot = document.getElementById("graph1").childNodes[0];
    var time = message.time.seconds.low + (message.time.nanos / 10e9);
    Plotly.extendTraces(plot, {x: [[time]], y: [[message.roll]]}, [0], 100);
    
    var plot = document.getElementById("graph2").childNodes[0];
    Plotly.extendTraces(plot, {x: [[time]], y: [[message.pitch]]}, [0], 100);
    
    var plot = document.getElementById("graph3").childNodes[0];
    Plotly.extendTraces(plot, {x: [[time]], y: [[message.yaw]]}, [0], 100);
}

// At some point this will need to call the Google maps api and deploy points
// that way.
function onGpsMessage(message) {
    //console.log("Received GPS message!");
    //console.log(message);
    var plot = document.getElementById("graph4").childNodes[0];
    var time = message.time.seconds.low + (message.time.nanos / 10e9);
    Plotly.extendTraces(plot, {x: [[time]], y: [[message.lat]]}, [0], 10);
}

function onStatusMessage(message) {
    // This is probably a bad idea?
    if (!this.messages) {
        this.messages = [];
    }

    while(this.messages.length > 10) {
        this.messages.shift();
    }

    this.messages.push(message.text);
    //console.log(this.messages); 
    var statusBox= document.getElementById("textbox");
    statusBox.innerHTML = this.messages.join("\n\n");
    statusBox.scrollTop = statusBox.scrollHeight;
}

function fetchDataFromServer() {
    initializeWidgets();
    // Make it a binary websocket since we're getting all protobufs. This should
    // be fairly efficient.
    var testSocket = new ReconnectingWebSocket("ws://" + location.host + "/ws",
            null, {binaryType: "arraybuffer"});

    // Figure out how to asynchronously load the proto.
    var builder = dcodeIO.ProtoBuf.loadProtoFile(location.origin + 
            "/protos/message.proto");
    var DataMessage = builder.build("DataMessage");

    testSocket.onopen = function() {
        console.log("Yay, I opened a socket!");
    }

    testSocket.onclose = function() {
        console.log("Oh no, the socket closed.")
    }

    testSocket.onmessage = function(event) {
        // DataMessage protobuf object
        var data_message = DataMessage.decode(event.data);
        var message = data_message.get(data_message.data);

        // Handle the different types of data. Maybe make this an enum?
        switch (data_message.data) {
        case "imu":
            onImuMessage(message);
            break;
        case "gps":
            onGpsMessage(message);
            break;
        case "status":
            onStatusMessage(message);
            break;
        default:
            console.log(message);
            break;
        }
    }
}
