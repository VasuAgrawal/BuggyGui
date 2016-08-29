function initializeStatus(divId) {
    var card = makeCardDiv(divId, colCount = 4);
    card.className = "mdl-card";

    title = document.createElement("div");
    title.className = "mdl-card__title";
    titleText = document.createElement("h2");
    titleText.className = "mdl-card__title-text";
    titleText.innerHTML = "Robobuggy Statuses";
    title.appendChild(titleText);
    card.appendChild(title);

}

function StatusBar(divId) {
    this.messages = [];
    this.logMessage = MessageMaster.builder.build("LogMessage");
    this.logLevel = MessageMaster.builder.lookup("LogMessage.LogLevel");
    this.currentLogLevel = 0; // DEBUG
    this.logLevelExclusive = false;

    this.makeStatusBar(divId);

    this.renderTimeout = 50;
    this.render();
}

StatusBar.prototype.makeStatusBar = function(divId) {
    var cardDiv = makeCardCard(divId, 12, "400px");

    var title = document.createElement("div");
    title.className = "mdl-card__title";
    var titleHeader = document.createElement("h2");
    titleHeader.className = "mdl-card__title-text";
    titleHeader.innerHTML = "Statuses";
    title.appendChild(titleHeader);
    cardDiv.appendChild(title);

    var textAreaDiv = document.createElement("div");
    textAreaDiv.className = "mdl-card__supporting-text";
    textAreaDiv.style.height = "80%";
    textAreaDiv.style.width = "auto";
    var textArea = document.createElement("textArea");
    textArea.id = divId + "_textbox";
    textArea.style.resize = "none";
    textArea.style.height = "100%";
    textArea.style.width = "100%";
    textArea.style.marginTop = "0px";
    textArea.style.marginBottom = "0px";
    textArea.readonly = "";
    textAreaDiv.appendChild(textArea);
    cardDiv.appendChild(textAreaDiv);

    var actionsDiv = document.createElement("div");
    actionsDiv.className = "mdl-card__actions";
    actionsDiv.style.height = "20%";

    var logLevel = MessageMaster.builder.lookup("LogMessage.LogLevel");
    for (var value of logLevel.children) {
        var button = document.createElement("button");
        button.className = [
            "mdl-button",
            "mdl-js-button",
            "mdl-button--accent",
            "mdl-button--raised",
            "mdl-js-ripple-effect",
        ].join(" ");
        button.innerHTML = value.name;
        button.style.marginLeft = "8px";
        // This is currently set so that the first click will show all log
        // messages of this log level or higher, while the second click will
        // show only messages of this log level. Subsequent clicks will toggle
        // between the two modes.
        button.onclick = function(level) {
            return function(event) {
                this.logLevelExclusive = ((this.currentLogLevel == level) && !this.logLevelExclusive)
                this.currentLogLevel = level;
            }
        }(value.id).bind(this);
        actionsDiv.appendChild(button);
    }
    cardDiv.appendChild(actionsDiv);
    this.wat = 123;
}

StatusBar.prototype.onStatusMessage = function(message) {
    this.messages.push(message);
}

StatusBar.prototype.render = function() {

    this.messages = this.messages.slice(-30);
    var statusBox = document.getElementById("statusbar_textbox");
    // TODO(vasua): Make this part faster. Currently taking 6-7% of execution.
    statusBox.innerHTML = this.messages.filter(
        (function(value) {
            return (this.logLevelExclusive ?
                    value.log_level == this.currentLogLevel :
                    value.log_level >= this.currentLogLevel);
        }).bind(this)).map(
        (function(message) {
            var date = new Date (1000 * (message.time.seconds.toNumber() +
                                         message.time.nanos / 10e8));
            var localeString = date.toLocaleTimeString();
            var dateString = ("[ " +
                    " ".repeat(Math.max(11-localeString.length, 0)) + 
                    date.toLocaleTimeString() + " ]");
            var level = this.logLevel.children[message.log_level].name;
            var levelString = "[ " + " ".repeat(Math.max(7-level.length, 0)) + level + " ]";
            return dateString + levelString + " " + message.text;
        }).bind(this)).join("\n");
    statusBox.scrollTop = statusBox.scrollHeight;
    setTimeout(this.render.bind(this), this.renderTimeout);
}

//initializeStatus("statuses");
var statusbar = new StatusBar("statusbar");
MessageMaster.registerCallback("STATUS", function(message) {statusbar.onStatusMessage(message)});
