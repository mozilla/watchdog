const dataDir = require("self").data;

var automatorPane = require("panel").Panel({
    contentURL: dataDir.url('automator_pane.html'),
    contentScriptFile: [
      dataDir.url("js/jquery-1.6.2.min.js"),
      dataDir.url("js/automator_pane.js")],
     width:500,
     height:500,
     contentScriptWhen: 'ready'
});

automatorPane.addProperty = function(property,value) {
    this.port.emit('newPrivacyProperty', {
        property: property,
        value: value
    });
};

automatorPane.showError = function(error) {
    // TODO: do something when this happens.
};

exports['automatorPane'] = automatorPane;