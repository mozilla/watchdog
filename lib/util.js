const {Cc,Ci,Cu} = require("chrome");

var uuidGenerator = Components.classes["@mozilla.org/uuid-generator;1"]
                    .getService(Components.interfaces.nsIUUIDGenerator);
                    
exports['genUUID'] = function() {
    return uuidGenerator.generateUUID().toString();
}