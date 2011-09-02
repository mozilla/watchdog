const {Cc,Ci,Cu} = require("chrome");

var loginManager = Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager);

function getLoginsTable() {
    var logins = loginManager.getAllLogins();
    var loginsTable = {};
    for (var login in logins) {
        var loginInfo = logins[login];
        if (!loginsTable[loginInfo.password])
            loginsTable[loginInfo.password] = [];
        loginsTable[loginInfo.password].push(loginInfo.hostname);
    }
    return loginsTable;
}

exports['getLoginsTable'] = getLoginsTable;