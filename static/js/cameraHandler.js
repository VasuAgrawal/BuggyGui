"use strict";

function bytesToBase64String(arr) {
    var col = [];
    const step = 0x8000;
    for (var sliceStart = 0; sliceStart < arr.length; sliceStart += step) {
        col.push(String.fromCharCode.apply(null, arr.subarray(sliceStart, sliceStart + step)));
    }
    return "data:image/png;base64," + btoa(col.join(""));
}

function r(x, y, width, stride) {
    return (y * width + x) * stride;
}
function g(x, y, width, stride) {
    return (y * width + x) * stride + 1;
}
function b(x, y, width, stride) {
    return (y * width + x) * stride + 2;
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
        this.ctx.putImageData(this.prevFrameData, 0, 0, 0, 0, this.canvas.width, this.canvas.height);
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

function CameraStream(divId) {
    this.canvas = makeCardCanvas(divId, 6, 400);
    //this.canvas.width = this.canvas.offsetWidth;
    //this.canvas.height = this.canvas.offsetHeight;
    this.paused = false;
    this.canvas.onclick = (function(event) {this.paused = !this.paused;}).bind(this);
    this.imageWidth = this.canvas.offsetWidth;
    this.imageHeight = this.canvas.offsetHeight;
    this.ctx = this.canvas.getContext("2d");
    this.image = new Image();
    this.hasKeyframe = false;
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

        // Store the image boundaries in canvas coordinates
        //this.cx = Math.floor(x * xScale);
        //this.cy = Math.floor(y * yScale);
        //this.cw = Math.ceil(scaledWidth * xScale);
        //this.ch = Math.ceil(scaledHeight * yScale);
        this.cx = 0;
        this.cy = 0;
        this.cw = this.imageWidth;
        this.ch = this.imageHeight;
        //this.ctx.drawImage(this.image, this.cx, this.cy, this.cw, this.ch);
        this.ctx.drawImage(this.image, 0, 0, this.imageWidth, this.imageHeight);
    }).bind(this);
}

CameraStream.prototype.onCameraMessage = function(message) {
    // Pauses when clicked.
    if (!this.paused) {
        this.imageWidth = message.width;
        this.imageHeight = message.height;
        if (message.frame_type == 0) { // KEYFRAME
            console.log("Drawing keyframe!");
            var src = bytesToBase64String(message.image.view.slice(message.image.offset, message.image.limit));
            this.image.src = src;
            this.hasKeyframe = true;
        } else if (this.hasKeyframe) { // DELTA
            console.log("Drawing delta!");
            //return;
            // This gets the complete image and data buffer.
            var imgData = this.ctx.getImageData(this.cx, this.cy, this.cw, this.ch);

            // Delta buffer has size 
            var delta = message.delta.view.slice(message.delta.offset, message.delta.limit);
            for (var y = 0; y < imgData.height; ++y) {
                for (var x = 0; x < imgData.width; ++x) {
                    var scaledX = Math.floor(x * message.width / imgData.width);
                    var scaledY = Math.floor(y * message.height / imgData.height);
                    imgData.data[r(x, y, imgData.width, 4)] = ((
                            imgData.data[r(x, y, imgData.width, 4)] +
                            delta[b(scaledX, scaledY, message.width, 3)]) % 256);
                    imgData.data[g(x, y, imgData.width, 4)] = ((
                            imgData.data[g(x, y, imgData.width, 4)] +
                            delta[g(scaledX, scaledY, message.width, 3)]) % 256);
                    imgData.data[b(x, y, imgData.width, 4)] = ((
                            imgData.data[b(x, y, imgData.width, 4)] +
                            delta[r(scaledX, scaledY, message.width, 3)]) % 256);
                }
            }

            this.ctx.putImageData(imgData, this.cx, this.cy);
        }
    }
}

var cameraStream = new CameraStreamNew("camera");
//var cameraStream2 = new CameraStreamNew("camera2");
MessageMaster.registerCallback("CAMERA", function(message) {cameraStream.onCameraMessage(message);});
//MessageMaster.registerCallback("CAMERA", function(message) {message.frame_type = 0; cameraStream2.onCameraMessage(message);});
