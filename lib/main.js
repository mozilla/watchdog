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
    openPasswordVisualizer();
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

function openPasswordVisualizer() {
    tabs.open(dataDir.url("view_passwords.html"));
}

openPasswordVisualizer();

function getLoginsTable() {
    var logins = loginManager.getAllLogins();
    var loginsTable = {};
    for (var login in logins) {
        var loginInfo = logins[login];
        if (!loginsTable[loginInfo.password])
            loginsTable[loginInfo.password] = [];
        loginsTable[loginInfo.password].push(loginInfo.hostname);
    }
    return loginsTable; //obfuscateLoginsTable(loginsTable);
}

function obfuscateLoginsTable(loginsTable) {
    var obfuscateTable = {};
    
    // obfuscate passwords
    for (var password in loginsTable) {
        var obfuscatedPassword = obfuscatePassword(loginsTable[password]);
        // Resolve any collisions by taking on *'s
        while (obfuscateTable[obfuscatedPassword])
            obfuscatedPassword += '*'
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
    var loginsTable = getLoginsTable();
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
                name: loginsTable[password][site],
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
            
            if (levenshtein(password1,password2) < Math.max(password1.length,password2.length)/2)
                similarPasswordPairs.push([password1,password2]);
        }
        passwordsChecked[password1] = true;
    }
    return similarPasswordPairs;
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

console.log("The add-on is running.");