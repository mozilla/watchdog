const {Cc,Ci,Cu} = require("chrome");

const dataDir = require("self").data;
const widgets = require("widget");
const tabs = require("tabs");

var loginManager = Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager);

var widget = widgets.Widget({
  id: "mozilla-link",
  label: "Mozilla website",
  contentURL: dataDir.url("lock_blue.png"),
  onClick: function() {
    tabs.open(dataDir.url("view_passwords.html"));
  }
});

require("page-mod").PageMod({
  include: dataDir.url("view_passwords.html"),
  contentScriptFile: dataDir.url("js/view_passwords_content_script.js"),
  onAttach: function(worker) {
      worker.port.on('get_logins_table', function() {
          worker.port.emit('logins_table', getLoginsJSON());
      });
  }
});

function getLoginsTable() {
    var logins = loginManager.getAllLogins();
    var loginsTable = {};
    for (var login in logins) {
        var loginInfo = logins[login];
        if (!loginsTable[loginInfo.password])
            loginsTable[loginInfo.password] = [];
        loginsTable[loginInfo.password].push(loginInfo.hostname);
    }
    

    return fubarLoginsTable(loginsTable);
}

function fubarLoginsTable(loginsTable) {
    var fubarTable = {};
    
    // Fubar passwords
    for (var password in loginsTable) {
        var fubarPassword = password[0];
        for (var x = 0; x < password.length-2; x++)
            fubarPassword += '*';
        fubarPassword += password[password.length-1];
        // Resolve any collisions by taking on *'s
        while (fubarTable[fubarPassword])
            fubarPassword += '*'
        fubarTable[fubarPassword] = loginsTable[password];
    }
    
    return fubarTable;   
}

function getLoginsJSON() {
    var nodes = [];
    var links = [];
    var loginsTable = getLoginsTable();
    for (var password in loginsTable) {
        nodes.push({
                name: password,
                group: 0
        });
        var passwordIdx = nodes.length-1;
        for (var site in loginsTable[password]) {
            nodes.push({
                name: loginsTable[password][site],
                group: 1
            });
            links.push({
                source: passwordIdx,
                target: nodes.length-1,
                value:1
            });
        }
    }
    return {
        nodes: nodes,
        links: links
    };
}


console.log("The add-on is running.");