function bytesToBase64String(arr) {
    var col = [];
    const step = 0x8000;
    for (var sliceStart = 0; sliceStart < arr.length; sliceStart += step) {
        col.push(String.fromCharCode.apply(null, arr.subarray(sliceStart, sliceStart + step)));
    }
    return "data:image/jpg;base64," + btoa(col.join(""));
}

function CameraStream(divId) {
    this.canvas = makeCardCanvas(divId, 6, 400);
    this.imageWidth = this.canvas.offsetWidth;
    this.imageHeight = this.canvas.offsetHeight;
    this.ctx = this.canvas.getContext("2d");
    this.image = new Image();
    this.image.onload = (function() {
        // There has to be a better way, but for some reason the drawing is
        // relative to the canvas.height / canvas.width, not the actual height /
        // width of the canvas on the page, which is dumb.
        var scaleFactor = Math.min(this.canvas.offsetWidth / this.imageWidth,
                this.canvas.offsetHeight / this.imageHeight);
        var scaledHeight = this.imageHeight * scaleFactor;
        var scaledWidth = this.imageWidth * scaleFactor;
        var x = this.canvas.offsetWidth / 2 - scaledWidth / 2;
        var y = this.canvas.offsetHeight / 2 - scaledHeight / 2;

        var xScale = this.canvas.width / this.canvas.offsetWidth;
        var yScale = this.canvas.height / this.canvas.offsetHeight;
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.image, x * xScale, y * yScale, scaledWidth * xScale, scaledHeight * yScale);
    }).bind(this);
}

CameraStream.prototype.onCameraMessage = function(message) {
    var src = bytesToBase64String(message.image.view.slice(message.image.offset));
    this.imageWidth = message.width;
    this.imageHeight = message.height;
    this.image.src = src;
}

var cameraStream = new CameraStream("camera");
var cameraStream2 = new CameraStream("camera2");
MessageMaster.registerCallback("CAMERA", function(message) {cameraStream.onCameraMessage(message);});
MessageMaster.registerCallback("CAMERA", function(message) {cameraStream2.onCameraMessage(message);});
