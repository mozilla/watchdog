const {Cc,Ci,Cu} = require("chrome");

const dataDir = require("self").data;
const observers = require("observer-service");
const pagemod = require("page-mod");
const panel = require("panel");
const tabs = require("tabs");
const url = require("url");
const widgets = require("widget");

const passwordManager = require('passwordManager');

const Alerts = require('alerts');
require('password_pane_manager');

require('selenium/nsCommandProcessor');

Alerts.AlertManager.addAlert({'type' : 'similar_passwords', passwords: ['abc','def']});
Alerts.AlertManager.addAlert({'type' : 'security_breach', site: 'sony.com', hostname: 'www.sony.com'});
Alerts.AlertManager.addAlert({'type' : 'security_breach', site: 'facebook.com', hostname: 'www.facebook.com'});

Alerts.AlertsWidget.updateContent();

loginManagerObserver();

var widget = widgets.Widget({
  id: "privacy-watchdog-link",
  label: "Privacy Watchdog",
  contentURL: dataDir.url("lock_blue.png"),
  onClick: function() {
    openPasswordVisualizer();
  }
});

pagemod.PageMod({
  include: dataDir.url("view_passwords.html"),
  contentScriptFile: dataDir.url("js/view_passwords_content_script.js"),
  onAttach: function(worker) {
      worker.port.on('get_logins_table', function() {
          worker.port.emit('logins_table', getLoginsJSON());
      });
  }
});

pagemod.PageMod({
    include: "*",
    contentScriptFile: [dataDir.url("js/util.js"),dataDir.url("js/form_detector.js")],
    contentScriptWhen: 'end',
    onAttach: function(worker) {
        worker.port.on('blur', function(msg) {
            var newPassword = msg.password;
            var loginsTable = passwordManager.getLoginsTable();
            
            // If this password isn't saved in password manager, there's nothing we can do.
            // TODO: use this as an opportunity to tell the user how secure their password is?
            if (!loginsTable[newPassword])
                return;
            
            if (loginsTable[newPassword].filter(function(x) { return x.host != msg.host; }).length > 0) {
                Alerts.PopupAlertsManager.displayPopupAlert({
                    type: 'password_exists_on_other_sites',
                    num_other_sites: loginsTable[newPassword].length-1
                });
            }
            
            // If this site is non-HTTPs
            if (msg.href.substr(0,7) != "https://") {
                // And the user has previously only used this password on HTTPs enabled sites
                if (loginsTable[newPassword].length == loginsTable[newPassword].filter(function(x) { return x.hostname.substr(0,8) == 'https://'; }).length) {
                    Alerts.PopupAlertsManager.displayPopupAlert({
                       type: 'login_used_only_for_https'
                    });
                }
            }

            // for (var password in loginsTable) {
            //     if (password != newPassword && passwordSimilarityCheck(password, newPassword)) {
            //         console.log("loginsTable[password].length = " + loginsTable[password].length);
            //         // Ensure that this host doesn't already have this password
            //         var httpURLs = loginsTable[password].filter(function(x) { return x.host.substr(0,7) == 'http://' || x.host.substr(0,8) == 'https://'; });
            //         var hostnames = httpURLs.map(function(x) { return url.URL(x.host).host; });
            //         console.log("msg.host: " + msg.host);
            //         console.log("hostnames:" + hostnames.length);
            //         
            //         for (var hostname in hostnames)
            //             dump(hostnames[hostname]);
            //         if (hostnames.indexOf(msg.host))
            //             browserAlert("Passwords are similar, but the site already knows.");
            //         else
            //             browserAlert("This password is very similar to one you're already using!");   
            //     }
            // }
            
            // if (this.panel && !msg.hasFocus) {
            //     this.panel.hide();
            // }
        });
    }
});

function loginManagerObserver() {
    function onStorageChanged(aSubject, aData) {
        if (aData == 'modifyLogin')
            aSubject = aSubject.QueryInterface(Ci.nsIArray).queryElementAt(1, Ci.nsILoginMetaInfo);

        var loginInfo = aSubject.QueryInterface(Ci.nsILoginMetaInfo).QueryInterface(Ci.nsILoginInfo);

        console.log(loginInfo.password);
        console.log(loginInfo.hostname);

        switch(aData) {
            case 'modifyLogin':
                // modifyLogin fires even when an old login is used, and not modified. (?)
                
                // TODO: find a better way of doing this. For now, look to see if the
                // password was just modified.
                if ((Date.now() - aSubject.timePasswordChanged) < 100) {
                    Alerts.AlertManager.passwordChanged(url.URL(loginInfo.hostname).host);
                }
                
                break;
        }


    }
    observers.add('passwordmgr-storage-changed', onStorageChanged);
}

function browserAlert(msg,title) {
    if (!title)
        title = "Alert";
    var wm = Cc["@mozilla.org/appshell/window-mediator;1"]
                .getService(Ci.nsIWindowMediator);
    var win = wm.getMostRecentWindow("navigator:browser");
    var promptService = Cc["@mozilla.org/embedcomp/prompt-service;1"]
                                  .getService(Ci.nsIPromptService);
    promptService.alert(win,title,msg);
}

function openPasswordVisualizer() {
    tabs.open(dataDir.url("view_passwords.html"));
}

function obfuscateLoginsTable(loginsTable) {
    var obfuscateTable = {};
    
    // obfuscate passwords
    for (var password in loginsTable) {
        var obfuscatedPassword = obfuscatePassword(loginsTable[password]);
        // Resolve any collisions by tacking on *'s
        while (obfuscateTable[obfuscatedPassword])
            obfuscatedPassword += '*';
        obfuscateTable[obfuscatedPassword] = loginsTable[password];
    }
    
    return obfuscateTable;   
}

function obfuscatePassword(password) {
    var obfuscatePassword = password[0];
    for (var x = 0; x < password.length-2; x++)
        obfuscatePassword += '*';
    obfuscatePassword += password[password.length-1];
    return obfuscatePassword;
}

function getLoginsJSON() {
    var nodes = [];
    var links = [];
    var loginsTable = passwordManager.getLoginsTable();
    var passwordsDict = {};
    for (var password in loginsTable) {
        nodes.push({
                name: password,
                group: 0
        });
        var passwordIdx = nodes.length-1;
        passwordsDict[password] = passwordIdx;
        for (var site in loginsTable[password]) {
            nodes.push({
                name: loginsTable[password][site].host,
                group: 1
            });
            links.push({
                source: passwordIdx,
                target: nodes.length-1,
                value: 1
            });
        }
    }
    // Add warning edges between similar passwords
    var similarPasswordPairs = detectSimilarPasswords(loginsTable);
    for (var pairX in similarPasswordPairs) {
        var pair = similarPasswordPairs[pairX];
        nodes.push({
            name: 'These passwords are really similar!',
            group: 2
        });
        var warningNodeIdx = nodes.length-1;
        links.push({
            source: passwordsDict[pair[0]],
            target: warningNodeIdx,
            value: 2
        });
        links.push({
            source: passwordsDict[pair[1]],
            target: warningNodeIdx,
            value: 2
        });
    }
    return {
        nodes: nodes,
        links: links
    };
}

function detectSimilarPasswords(loginsTable) {
    var passwordsChecked = {};
    var similarPasswordPairs = [];
    
    for (var password1 in loginsTable) {
        for (var password2 in loginsTable) {
            if (password1 == password2)
                continue;
            if (passwordsChecked[password2])
                continue;
            
            if (passwordSimilarityCheck(password1,password2))
                similarPasswordPairs.push([password1,password2]);
        }
        passwordsChecked[password1] = true;
    }
    return similarPasswordPairs;
}

function passwordSimilarityCheck(password1,password2) {
    return levenshtein(password1,password2) < Math.max(password1.length,password2.length)/2;
}

// Thanks, http://en.wikibooks.org/wiki/Algorithm_Implementation/Strings/Levenshtein_distance#JavaScript
function levenshtein(str1, str2) {
    var l1 = str1.length, l2 = str2.length;
    if (Math.min(l1, l2) === 0) {
        return Math.max(l1, l2);
    }
    var i = 0, j = 0, d = [];
    for (i = 0 ; i <= l1 ; i++) {
        d[i] = [];
        d[i][0] = i;
    }
    for (j = 0 ; j <= l2 ; j++) {
        d[0][j] = j;
    }
    for (i = 1 ; i <= l1 ; i++) {
        for (j = 1 ; j <= l2 ; j++) {
            d[i][j] = Math.min(
                d[i - 1][j] + 1,
                d[i][j - 1] + 1, 
                d[i - 1][j - 1] + (str1.charAt(i - 1) === str2.charAt(j - 1) ? 0 : 1)
            );
        }
    }
    return d[l1][l2];
}

console.log("Watchdog started.");