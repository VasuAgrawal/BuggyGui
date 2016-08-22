// Creates a new "card" with a 100% fill canvas inside of it.
//
// Args:
//  divId: string of the div id to convert into a card
//  colCount: How many columns (out of 12) to fill. Defaults to 8.
//  canvasHeight: css height for the canvas. Defaults to 300px.
//
// Returns:
//  Newly created canvas element.
//
// Example:
//  var canvas = makeCardCanvas("IMU", 400);
// TODO(vasua): Make this work with different col counts on different devices.


// Turns a blank div into a stylized card with proper styles.
function makeCard(divId, colCount = 8) {
    var elem = document.getElementById(divId);
    if (elem) {
        elem.className = "mdl-cell mdl-cell--" + colCount + "-col mdl-shadow--2dp";
        componentHandler.upgradeElement(elem);
        return elem;
    } else {
        throw "Unable to find element with ID " + divId;
    }
}

// Creates an elem with some specified height and 100% width.
// Height defaults to 300px. Any css style for height will work.
function makeElem(elemType, height = "300px") {
    var elem = document.createElement(elemType);
    elem.style.height = height;
    elem.style.width = "100%";
    return elem;
}

function makeCardCanvas(divId, colCount = 8, height = "300px") {
    var card = makeCard(divId, colCount);
    var canvas = makeElem("canvas", height);
    card.appendChild(canvas);
    return canvas;
}

function makeCardDiv(divId, colCount = 8, height = "300px") {
    var card = makeCard(divId, colCount);
    var div = makeElem("div", height);
    card.appendChild(div);
    return div;
}

// Registers a plot so that it resizes when the window resizes.
function registerPlot(plot) {
    if (!this.plots) {
        this.plots = []
    }
    this.plots.push(plot);
    if (!window.onresize) {
        this.oldResize = window.onresize;
    }
    window.onresize = function() {
        for (var p of this.plots) {
            Plotly.Plots.resize(p);
        }
    }
    window.onresize();
}
