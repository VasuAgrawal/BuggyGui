/*
 * A number of utilities to decode messages and do all of the proper callbacks.
 */

// TODO(vasua): Figure out how to asynchronously load the proto.
// TODO(vasua): Generalize this.
// TODO(vasua): Make all of these "private" variables, it's unnecessary for the
// clients to see these things.
// TODO(vasua): Encapsulate all of this in an object.
builder = dcodeIO.ProtoBuf.loadProtoFile(location.origin + 
        "/protos/message.proto");
DataMessage = builder.build("DataMessage");
DataType = builder.lookup("DataMessage.DataType");
Callbacks = {};
var initialized = false;

// This clears the callback list.
function initializeMaster() {
    for (var value of DataType.children) {
        Callbacks[value.id] = [];
    }
    initialized = true;
}

function registerCallback(callbackType, callback) {
    // TODO(vasua): Argument type checking / assertions.
    if (!initialized) { initializeMaster(); }
    Callbacks[DataType.getChild(callbackType).id].push(callback);
}

function handleMessage(event) {
    var data_message = DataMessage.decode(event.data);
    var message = data_message.get(data_message.data);
    var data_type = data_message.data_type;

    for (var fn of Callbacks[data_type]) {
        fn(message);
    }
}
