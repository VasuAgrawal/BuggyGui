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

    this.markers = [];
    this.velocity = 0;
    this.prevLat = null;
    this.prevLong = null;
    this.prevTime = null;

    // Coloring information.
    // TODO(vasua): Customize this coloring later.
    this.minVelocity = 8;
    this.maxVelocity = 14;
    this.minColor = [255, 100, 0];
    this.maxColor = [0, 100, 255];
}

// Shamelessly copied from stack overflow:
// http://stackoverflow.com/questions/639695/how-to-convert-latitude-or-longitude-to-meters
WaypointViewer.prototype.geoDistance = function(lat1, lon1, lat2, lon2) {
    var R = 6378.137; // Radius of earth in KM
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    return d * 1000; // meters
}

// Again, shamelessly ripped off from SO.
// http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
WaypointViewer.prototype.rgbToHex = function(color) {
    var r = color[0];
    var g = color[1];
    var b = color[2];
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

WaypointViewer.prototype.updateVelocity = function(message) {
    this.prevLat = this.prevLat || message.lat;
    this.prevLong = this.prevLong || message.long;
    var currentTime = message.time.seconds.toNumber() + message.time.nanos/10e8;
    this.prevTime = this.prevTime || currentTime;
    this.velocity = (this.geoDistance(message.lat, message.long, this.prevLat,
            this.prevLong) / (currentTime - this.prevTime)) || 0; // m/s

    this.prevLat = message.lat;
    this.prevLong = message.long;
    this.prevTime = currentTime;
}

WaypointViewer.prototype.getColorStringFromVelocity = function() {
    var velocity = Math.min(Math.max(this.velocity, this.minVelocity), this.maxVelocity);
    var velocityRatio = (velocity - this.minVelocity) / (this.maxVelocity - this.minVelocity);
    var color = [];
    for (var i = 0; i < 3; ++i) {
        color.push(Math.round( (this.maxColor[i] - this.minColor[i]) * velocityRatio
                    + this.minColor[i]));
    }
    return this.rgbToHex(color);
}

WaypointViewer.prototype.onGpsMessage = function(message) {
    // First, update our velocity estimate. Once there's better data coming from
    // the buggy this can be swapped out for an on board estimate.
    this.updateVelocity(message);
        var markerIcon = {
        path: "M 0,0 5,-20 0,-15 -5,-20 z",
        fillColor: this.getColorStringFromVelocity(),
        fillOpacity: 1.0,
        strokeColor: 'gold',
        strokeWeight: 1
    };

    var marker = new google.maps.Marker({
        position: new google.maps.LatLng(message.lat, message.long),
        icon: markerIcon,
        animation: google.maps.Animation.DROP,
        // TODO(vasua): Figure out if we want any more information here.
        title: this.velocity.toFixed(2) + " m/s\n" +
            (this.velocity * 2.23694).toFixed(2) + " mph",
    });
    this.markers.push(marker);
    marker.setMap(this.map);

    if (this.markers.length > 100) {
        this.markers.shift().setMap(null);
    }
}

var wp = new WaypointViewer("asdf");
MessageMaster.registerCallback("GPS", (function(message) {wp.onGpsMessage(message)}).bind(this));
