const {Cc,Ci} = require("chrome");

const dataDir = require("self").data;
const observers = require("observer-service");
const panel = require("panel");
const url = require("url");
const widgets = require("widget");

const util = require("util");

const HIDE_ALERTS_WIDGET = true;

var PopupAlertsManager = {
    displayPopupAlert: function(alert) {
        // FIXME: when dismissed with a click, the alert turns into an icon to the left
        // of the address bar, but can't be brought back.
        
        var wm = Cc["@mozilla.org/appshell/window-mediator;1"]
                    .getService(Ci.nsIWindowMediator);
        var win = wm.getMostRecentWindow("navigator:browser");
        win.PopupNotifications.show(win.gBrowser.selectedBrowser,"watchdog-notification",AlertManager.getAlertString(alert), null, 
            // Possible feature: repo of URLs to redirect users to change their passwords at?
            {
                label: "Okay",
                accessKey: 'a',
                callback: function(){}
            }, [{
                label: "Don't remind me about this again.",
                accessKey: 'd',
                callback: function() {
                    // TODO
                }
            },
            {
                label: "Never send me alerts of this type.",
                accessKey: 'n',
                callback: function() {
                    // TODO: Are you sure?
                    
                    // TODO
                }
            }], {
                persistWhileVisible: false // Don't persist across browser location changes (TODO: have it persist across location changes on the same domain)
            });
    },
    onContent: function(domObj) {
        // onContent raises for iframes too. Watch out for events from off-site domains, like facebook.com
        // TODO: decide if we want to show the user popup notifications for offsite domains when this happens?
        
        var window = domObj.defaultView;
        if (!window) return;
        var contentUrl = "";
        
        try {
            contentURL = url.URL(window.location);
        }
        catch(e) {
            // Lots of weird non-remote URLs raise an observer event.
            // e.g. resource://, and everything in widget
            // So just exit if this isn't a website.
            
            return;
        }
        
        // TODO: if we usually login to this site via HTTPS, but this is HTTP, issue
        // another alert.
        
        var alerts = AlertManager.getAlertsForHostname(contentURL.host);
        
        console.log(alerts.length + " relevant alerts for URL " + window.location);
        
        for (var alertIdx in alerts) {
            PopupAlertsManager.displayPopupAlert(alerts[alertIdx]);
        }
    },
    startObserve: function() {
        observers.add('document-element-inserted', this.onContent);
    }  
};

PopupAlertsManager.startObserve();

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
        getAlertsForHostname: function(hostname) {
            return alerts.filter(function(x) { return x.hostname && x.hostname == hostname; });  
        },
        getAlertString: function(alert) {
            switch(alert.type) {
                case "security_breach":
                    return "This site (" + alert.hostname + ") has experienced a security breach. Consider changing your password.";
                case "password_exists_on_other_sites":
                    return "This password is already used on " + alert.num_other_sites + " other sites, not including this one.";
                case "login_used_only_for_https":
                    return "This is a plain HTTP site, however, this password has previously only been used on HTTPS connections. It is recommended that you choose a different password.";
            }
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
exports['PopupAlertsManager'] = PopupAlertsManager;