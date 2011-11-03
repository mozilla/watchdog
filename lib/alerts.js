const {Cc,Ci} = require("chrome");

const dataDir = require("self").data;
const observers = require("observer-service");
const panel = require("panel");
const url = require("url");

const util = require("util");

var PopupAlertsManager = {
    displayPopupAlert: function(alert) {
        // FIXME: when dismissed with a click, the alert turns into an icon to the left
        // of the address bar, but can't be brought back.
        
        if (AlertManager.isAlertIgnored(alert)) return;
        
        var dismissalOptions =  [];
        
        if (alert.password) {
            dismissalOptions.push({
                label: "Don't remind me about this password again.",
                accessKey: 'd',
                callback: function() {
                    AlertManager.ignorePassword(alert.password);
                }
            });
        }
        
        dismissalOptions.push({
            label: "Never send me alerts of this type.",
            accessKey: 'n',
            callback: function() {
                // TODO: Are you sure?
                
                AlertManager.ignoreType(alert.type);
            }
        });
        
        var wm = Cc["@mozilla.org/appshell/window-mediator;1"]
                    .getService(Ci.nsIWindowMediator);
        var win = wm.getMostRecentWindow("navigator:browser");
        var popup = win.PopupNotifications.show(win.gBrowser.selectedBrowser,"watchdog-notification",AlertManager.getAlertString(alert), null, 
            // Possible feature: repo of URLs to redirect users to change their passwords at?
            {
                label: "Okay",
                accessKey: 'a',
                callback: function(){}
            },
            dismissalOptions,{
                // persistWhileVisible: false // Don't persist across browser location changes (TODO: have it persist across location changes on the same domain)
                eventCallback: function(event) {
                    if (event == 'dismissed') {
                        popup.remove();
                    }
                }
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
        
        // console.log(alerts.length + " relevant alerts for URL " + window.location);
        
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
    // FIXME: hash alerts by UUID?
    var alerts = [];
    var ignoredPasswords = [];
    var ignoredAlertTypes = [];
    return {
        addAlert: function(alert) {
            var newUUID = util.genUUID();
            alert['uuid'] = newUUID;
            alerts.push(alert);
            return newUUID;
        },
        dismissAlert: function(uuid) {
            for (var alertIdx in alerts) {
                if (alerts[alertIdx].uuid == uuid) {
                    alerts.splice(alertIdx,1);
                }
            }
            this.updateUI();
        },
        getAlertByUUID: function(uuid) {
            // UUIDs should be unique.
            return alerts.filter(function(alert) { return alert.uuid == uuid; })[0];
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
                case "stale_password":
                    return "You've been using this password on this website for over " + alert.threshold + " days. We recommend you change to a new password.";
            }
        },
        ignorePassword: function(password) {
            ignoredPasswords.push(password);
        },
        ignoreType: function(type) {
            ignoredAlertTypes.push(type);
        },
        isAlertIgnored: function(alert) {
            return ignoredPasswords.indexOf(alert.password) > -1 || ignoredAlertTypes.indexOf(alert.type) > -1;
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

exports['AlertManager'] = AlertManager;
exports['AlertsPanel'] = AlertsPanel;
exports['PopupAlertsManager'] = PopupAlertsManager;