/*
 * A number of utilities to decode messages and do all of the proper callbacks.
 */

// TODO(vasua): Figure out how to asynchronously load the proto.
// TODO(vasua): Generalize this.
var MessageMaster = {};
// Everything is a public variable!
MessageMaster.builder = dcodeIO.ProtoBuf.loadProtoFile(location.origin + 
        "/protos/message.proto");
MessageMaster.dataMessage = MessageMaster.builder.build("DataMessage");
MessageMaster.dataType = MessageMaster.builder.lookup("DataMessage.DataType");
MessageMaster.callbacks = {};

MessageMaster.clearCallbacks = function() {
    for (var value of MessageMaster.dataType.children) {
        MessageMaster.callbacks[value.id] = [];
    }
}
MessageMaster.clearCallbacks();

MessageMaster.registerCallback = function(callbackType, callback) {
    MessageMaster.callbacks[MessageMaster.dataType.getChild(callbackType).id].push(callback);
}

MessageMaster.handleMessage = function(event) {
    var dataMessage = MessageMaster.dataMessage.decode(event.data);
    var message = dataMessage.get(dataMessage.data);
    var dataType = dataMessage.data_type;

    console.log(MessageMaster.callbacks);
    //debugger;

    for (var fn of MessageMaster.callbacks[dataType]) {
        fn(message);
    }
}

