// TODO(vasua): Switch out the Plotly backend with something else.
// The Plotly backend uses SVG to render the graphics. This causes the page to
// noticeably slow down every time the render happens, even if it's being rate
// limited. Switching to either canvas.js or chart.js (preferred) is necessary.
//initializeScatter("graph1");
//initializeScatter("graph2");
//initializeScatter("graph3");

// This has trouble performing more than 5Hz, so we rate limit it.
function onImuMessage(message) {
    var minTime = 500; // Milliseconds

    if (!this.startTime) {
        this.startTime = Date.now();
        this.times = [];
        this.rolls = [];
        this.pitches = [];
        this.yaws = [];
    }

    if ((Date.now() - this.startTime) > minTime) {
        // Since we're initializing the elements here, we can probably return them
        // and store them instead of constantly getting the child nodes.
        var plot = document.getElementById("graph1").childNodes[0];
        var maxCount = 300;
        Plotly.extendTraces(plot, {x: [this.times], y: [this.rolls]}, [0], maxCount);
        var plot = document.getElementById("graph2").childNodes[0];
        Plotly.extendTraces(plot, {x: [this.times], y: [this.pitches]}, [0], maxCount);
        var plot = document.getElementById("graph3").childNodes[0];
        Plotly.extendTraces(plot, {x: [this.times], y: [this.yaws]}, [0], maxCount);
        this.startTime = Date.now();
        this.times = [];
        this.rolls = [];
        this.pitches = [];
        this.yaws = [];
    } else {
        var time = message.time.seconds.low + (message.time.nanos / 10e8);
        this.times.push(time);
        var buggy = message.roll;
        this.rolls.push(buggy); // Ha ha
        this.pitches.push(message.pitch);
        this.yaws.push(message.yaw);
    }
}

// This is just proof of concept for rate limiting code.
// TODO(vasua): Figure out some way of making this rate limiting code apply to
// all kinds of different types of Plotly plots?
//MessageMaster.registerCallback("IMU", onImuMessage);

makeCard("imu1", colCount = 4);
var imu1 = new AngleViewer("imu1", 1, 1, 1, "Top Right View");
makeCard("imu2", colCount = 4);
var imu2 = new AngleViewer("imu2", 1, 1, 0, "Top Front View");
makeCard("imu3", colCount = 4);
imu3 = new AngleViewer("imu3", 0, 0, 1, "Side View");


function imuOscar(message) {
    imu1.setAngles(message.roll, message.pitch, message.yaw);
    imu2.setAngles(message.roll, message.pitch, message.yaw);
    imu3.setAngles(message.roll, message.pitch, message.yaw);
}

MessageMaster.registerCallback("IMU", imuOscar);
