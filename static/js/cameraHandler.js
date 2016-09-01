"use strict";

function bytesToBase64String(arr) {
    var col = [];
    const step = 0x8000;
    for (var sliceStart = 0; sliceStart < arr.length; sliceStart += step) {
        col.push(String.fromCharCode.apply(null, arr.subarray(sliceStart, sliceStart + step)));
    }
    return "data:image/png;base64," + btoa(col.join(""));
}

function CameraStreamNew(divId) {
    this.canvas = makeCardCanvas(divId, 6, 400);
    this.resizeCanvas()
    window.addEventListener("resize", (function() {
        this.resizeCanvas();
    }).bind(this));

    this.imageWidth = this.canvas.width;
    this.imageHeight = this.canvas.height;
    this.ctx = this.canvas.getContext("2d");
    this.image = new Image();
    this.image.onload = this.onImageParse.bind(this);
    this.previousFrame = undefined;
    this.hasKeyframe = false;

    // In memory canvas for stuff
    this.bufferCanvas = document.createElement("canvas");
    this.bufferCtx = this.bufferCanvas.getContext("2d");
    this.messageType = -1;
    this.prevFrameData = undefined;
}

CameraStreamNew.prototype.resizeCanvas = function() {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
}

// What to do when the source image gets parsed.
CameraStreamNew.prototype.onImageParse = function() {
    // First, the image gets drawn on the buffer canvas to decode it into its
    // full size form.
    this.bufferCanvas.width = this.imageWidth;
    this.bufferCanvas.height = this.imageHeight;
    this.bufferCtx.drawImage(this.image, 0, 0);
    var data = this.bufferCtx.getImageData(0, 0, this.imageWidth, this.imageHeight);

    if (this.messageType == 0) { // KEYFRAME
        this.hasKeyframe = true;
        this.prevFrameData = data;
    } else if (this.hasKeyframe && this.messageType == 1) { // DELTA
        for (var i = 0; i < this.prevFrameData.data.length; i+=4) {
            this.prevFrameData.data[i] = (this.prevFrameData.data[i] + data.data[i]) % 256; //       R
            this.prevFrameData.data[i+1] = (this.prevFrameData.data[i+1] + data.data[i+1]) % 256; // G
            this.prevFrameData.data[i+2] = (this.prevFrameData.data[i+2] + data.data[i+2]) % 256; // B
            // Don't add in alpha delta
        }
    }

    if (this.hasKeyframe) {
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // TODO(vasua): putImageData doesn't scale the image, so come up with a
        // custom scaling function or find another way of doing it.
        var x = this.canvas.width / 2 - this.prevFrameData.width / 2;
        var y = this.canvas.height / 2 - this.prevFrameData.height / 2;
        this.ctx.putImageData(this.prevFrameData, x, y, 0, 0, this.canvas.width - x, this.canvas.height - y);
    }
}

CameraStreamNew.prototype.onCameraMessage = function(message) {
    this.imageWidth = message.width;
    this.imageHeight = message.height;

    // We always need to decode the image source
    var src = bytesToBase64String(message.image.view.slice(
                message.image.offset, message.image.limit));
    this.image.src = src;
    this.messageType = message.frame_type;
}

var cameraStream = new CameraStreamNew("camera");
var cameraStream2 = new CameraStreamNew("camera2");
MessageMaster.registerCallback("CAMERA", function(message) {cameraStream.onCameraMessage(message);});
MessageMaster.registerCallback("CAMERA", function(message) {cameraStream2.onCameraMessage(message);});
