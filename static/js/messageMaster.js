/*
 * A number of utilities to decode messages and do all of the proper callbacks.
 */

// TODO(vasua): Figure out how to asynchronously load the proto.
// TODO(vasua): Generalize this.

function MessageMasterServer() {
    this.builder = dcodeIO.ProtoBuf.loadProtoFile(location.origin + 
            "/protos/message.proto");
    this.dataMessage = this.builder.build("DataMessage");
    this.dataType = this.builder.lookup("DataMessage.DataType");
    this.callbacks = {};
}

MessageMasterServer.prototype.clearCallbacks = function() {
    for (var value of this.dataType.children) {
        this.callbacks[value.id] = [];
    }
}

MessageMasterServer.prototype.registerCallback = function(callbackType, callback) {
    this.callbacks[this.dataType.getChild(callbackType).id].push(callback);
}

MessageMasterServer.prototype.handleMessage = function(event) {
    var dataMessage = this.dataMessage.decode(event.data);
    var message = dataMessage.get(dataMessage.data);
    var dataType = dataMessage.data_type;
    var robotName = dataMessage.robot_name;
    if(RobotManager.addRobot(robotName)) {
        for (var fn of this.callbacks[dataType]) {
            fn(message);
        }
    }
}

var MessageMaster = new MessageMasterServer();
MessageMaster.clearCallbacks();
