initializeScatter("graph4");

// At some point this will need to call the Google maps api and deploy points
// that way.
function onGpsMessage(message) {
    var plot = document.getElementById("graph4").childNodes[0];
    var time = message.time.seconds.low + (message.time.nanos / 10e9);
    Plotly.extendTraces(plot, {x: [[time]], y: [[message.lat]]}, [0], 10);
}

registerCallback("GPS", onGpsMessage);
