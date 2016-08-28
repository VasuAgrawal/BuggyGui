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

//TODO(vasua): Make these not global.
var currentLogLevel = 0; // DEBUG
var logLevelExclusive = false;

function makeStatusBar(divId) {
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
                logLevelExclusive = ((currentLogLevel == level) && !logLevelExclusive)
                currentLogLevel = level;
            }
        }(value.id);
        actionsDiv.appendChild(button);
    }
    cardDiv.appendChild(actionsDiv);
}

function onStatusMessage(message) {
    // This is probably a bad idea?
    if (!this.messages) {
        this.messages = [];
        this.logMessage = MessageMaster.builder.build("LogMessage");
        this.logLevel = MessageMaster.builder.lookup("LogMessage.LogLevel");
    }

    while(this.messages.length > 30) {
        this.messages.shift();
    }

    this.messages.push(message);
    var statusBox= document.getElementById("statusbar_textbox");
    statusBox.innerHTML = this.messages.filter(
        function(value) {
            return (logLevelExclusive ?
                    value.log_level == currentLogLevel :
                    value.log_level >= currentLogLevel);
        }).map(
        function(message) {
            return message.text;
        }).join("\n");
    statusBox.scrollTop = statusBox.scrollHeight;
}

//initializeStatus("statuses");
makeStatusBar("statusbar");
MessageMaster.registerCallback("STATUS", onStatusMessage);
