const dataDir = require("self").data;
const panel = require("panel");
const widgets = require("widget");

const util = require("util");

const HIDE_ALERTS_WIDGET = true;

var AlertManager = function() {
    var alerts = [];
    return {
        addAlert: function(alert) {
            alert['uuid'] = util.genUUID();
            alerts.push(alert);
        },
        dismissAlert: function(uuid) {
            for (var alertIdx in alerts) {
                if (alerts[alertIdx].uuid == uuid) {
                    alerts.splice(alertIdx,1);
                }
            }
            this.updateUI();
        },
        getAlerts: function() {
            return alerts;
        },
        passwordChanged: function(hostname) {
            // Expire alerts on password change event.
            for (var alertIdx in alerts) {
                if (alerts[alertIdx].hostname == hostname && alerts[alertIdx].type == 'security_breach') {
                    alerts.splice(alertIdx,1);
                }
            }
            this.updateUI();
        },
        updateUI: function() {
            AlertsWidget.updateContent();
            AlertsPanel.populate();
        }
    };    
}();


var AlertsPanel = panel.Panel({
   contentURL: dataDir.url('alerts_pane.html'),
   contentScriptFile: [
     dataDir.url("js/jquery-1.6.2.min.js"),
     dataDir.url("js/util.js"),
     dataDir.url("js/alerts_pane.js")],
   width:500,
   onMessage: function(msg) {
       if (msg.type == 'dismissAlert') {
           AlertManager.dismissAlert(msg.uuid);
       }
   }
});

AlertsPanel.populate = function() {
    this.port.emit('populateAlerts',AlertManager.getAlerts());
};

var AlertsWidget = widgets.Widget({
  id: "privacy-watchdog-alerts-widget",
  label: "Privacy Watchdog Alerts",
  content: "ok", //placeholder for content to be updated later.
  panel: AlertsPanel,
  width: 70,
  onClick: function() {
      AlertsPanel.populate();
  }
});

AlertsWidget.updateContent = function() {
    var numAlerts = AlertManager.getAlerts().length;
    
    this.content = '<span style="font-size:75%">';
    
    if (numAlerts == 0)
        this.content += "No alerts.";
    else
        this.content += '<span style="color:#ff0000">' + numAlerts + " alerts!" + '</span>';
        
    this.content += "</span>";
};

AlertsWidget.updateContent();

if (HIDE_ALERTS_WIDGET) {
    AlertsWidget.destroy();
}

exports['AlertManager'] = AlertManager;
exports['AlertsPanel'] = AlertsPanel;
exports['AlertsWidget'] = AlertsWidget;