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

function onStatusMessage(message) {
    // This is probably a bad idea?
    if (!this.messages) {
        this.messages = [];
    }

    while(this.messages.length > 10) {
        this.messages.shift();
    }

    this.messages.push(message.text);
    var statusBox= document.getElementById("textbox");
    statusBox.innerHTML = this.messages.join("\n\n");
    statusBox.scrollTop = statusBox.scrollHeight;
}

//initializeStatus("statuses");
MessageMaster.registerCallback("STATUS", onStatusMessage);
