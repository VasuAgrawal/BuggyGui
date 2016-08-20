window.onload = read();

function onImuMessage(message) {
    console.log(message.roll);
    console.log(message.pitch);
    console.log(message.yaw);
}

function onGpsMessage(message) {
}

function read() {
    var ProtoBuf = dcodeIO.ProtoBuf;
    // Make it a binary websocket since we're getting all protobufs
    var testSocket = new ReconnectingWebSocket("ws://" + location.host + "/ws",
            null, {binaryType: "arraybuffer"});
    var builder = ProtoBuf.loadProtoFile(location.origin + 
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
        }
    }
}
