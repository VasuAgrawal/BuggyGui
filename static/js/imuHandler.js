initializeScatter("graph1");
initializeScatter("graph2");
initializeScatter("graph3");

function onImuMessage(message) {
    // Since we're initializing the elements here, we can probably return them
    // and store them instead of constantly getting the child nodes.
    var plot = document.getElementById("graph1").childNodes[0];
    var time = message.time.seconds.low + (message.time.nanos / 10e9);
    Plotly.extendTraces(plot, {x: [[time]], y: [[message.roll]]}, [0], 100);
    
    var plot = document.getElementById("graph2").childNodes[0];
    Plotly.extendTraces(plot, {x: [[time]], y: [[message.pitch]]}, [0], 100);
    
    var plot = document.getElementById("graph3").childNodes[0];
    Plotly.extendTraces(plot, {x: [[time]], y: [[message.yaw]]}, [0], 100);
}

registerCallback("IMU", onImuMessage);
