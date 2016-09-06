//initializeScatter("graph4");

// At some point this will need to call the Google maps api and deploy points
// that way.
function onGpsMessage(message) {
    var plot = document.getElementById("graph4").childNodes[0];
    var time = message.time.seconds.low + (message.time.nanos / 10e9);
    Plotly.extendTraces(plot, {x: [[time]], y: [[message.lat]]}, [0], 10);
}

//MessageMaster.registerCallback("GPS", onGpsMessage);

function WaypointViewer(divId) {
    this.div = makeCardDiv(divId, 12, "400px");
    this.map = new google.maps.Map(this.div, {
        zoom: 17,
        center: new google.maps.LatLng(40.4401718, -79.9446965),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
    });
}

WaypointViewer.prototype.onGpsMessage = function(message) {
    var marker = new google.maps.Marker({
        position: new google.maps.LatLng(message.lat, message.long),
    });
    marker.setMap(this.map);
}

var wp = new WaypointViewer("asdf");
MessageMaster.registerCallback("GPS", (function(message) {wp.onGpsMessage(message)}).bind(this));
