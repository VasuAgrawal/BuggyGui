function Robot() {
    this.lastMessageTime = new Date(); 
    this.checked = true;
}

Robot.prototype.update = function() {
    this.lastMessageTime = new Date();
}

function RobotManagerImp() {
    this.robots = {};
    this.watchdog = setInterval(this.kick.bind(this), 1000); // ms
    this.timeout = 5000; // ms
}

// Not only does this add new robots, but it returns the clicked status of the
// robot if it exists, true if new.
RobotManagerImp.prototype.addRobot = function(robotName) {
    if (robotName in this.robots) {
        this.robots[robotName].update(); 
    } else {
        this.robots[robotName] = new Robot();
    }

    return this.robots[robotName].checked;
}

// Replace the checkboxes with updated ones.
RobotManagerImp.prototype.kick = function() {
    var robotDiv = document.getElementById("robot_names");
    robotDiv.innerHTML = ""; // Clear it before we add any more robots

    for (var robotName in this.robots) {
        // Disable robots if we haven't received an update in some time
        // Might want to bring this up as a status issue rather than just
        // ignoring the robot?
        if (new Date() - this.robots[robotName].lastMessageTime > this.timeout) {
            this.robots[robotName].checked = false;
            continue;
        }

        var li = document.createElement("li");
        var label = document.createElement("label");
        var input = document.createElement("input");
        var span = document.createElement("span");
        input.type = "checkbox";
        input.id = "checkbox-" + robotName;
        input.className = "mdl-checkbox__input";
        input.checked = this.robots[robotName].checked;
        input.onchange = (function() {
            this.checked = !this.checked;
        }).bind(this.robots[robotName]);

        componentHandler.upgradeElement(input);
        label.appendChild(input);
        
        span.innerHTML = robotName;
        span.className = "mdl-checkbox__label";
        componentHandler.upgradeElement(span);
        label.appendChild(span);

        label.className = "mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect";
        label.for = "checkbox-" + robotName;
        componentHandler.upgradeElement(label);
        li.appendChild(label);

        li.className = "mdl-list__item mdl-navigation__link";
        componentHandler.upgradeElement(li);
        robotDiv.appendChild(li);
    }
}

RobotManagerImp.prototype.toggle = function() {
}

var RobotManager = new RobotManagerImp();
