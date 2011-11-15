const dataDir = require("self").data;
const panel = require("panel");

exports.test_Visual_Hash = function(test) {
    var TestPanel = panel.Panel({
        contentScriptFile: dataDir.url('js/util.js'),
        contentScript: "self.postMessage({hash: SHA1('test'), randomizedHash: randomizeHash(SHA1('test'))});",
        width:500,
        onMessage: function(msg) {
            // Colors are randomized slightly. Are they within range?
            for (var hashIdx = 0; hashIdx < msg.hash.length/2; hashIdx++) {
                var hashByteVal = parseInt(msg.hash.substr(hashIdx*2,2),16);
                var randomHashByteVal = parseInt(msg.randomizedHash.substr(hashIdx*2,2),16);
                if (Math.abs(hashByteVal - randomHashByteVal) > 7) {
                    test.fail('Random hash not in range!');
                    test.done();
                    return;                    
                }
            }
            test.pass();
            test.done();
        }
    });
   
   test.waitUntilDone(20000); 
};

exports.test_SHA1 = function(test) {
    
    var TestPanel = panel.Panel({
        contentScriptFile: dataDir.url('js/util.js'),
        contentScript: "self.postMessage(SHA1('test'));",
        width:500,
        onMessage: function(sha1) {
            test.assertEqual(sha1,'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3');
            test.done();
        }
    });

    test.waitUntilDone(20000);
};