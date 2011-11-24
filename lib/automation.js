const dataDir = require("self").data;
const observers = require("observer-service");
const panel = require("panel");
const pageWorker = require("page-worker");
const tabs = require('tabs');
const url = require("url");

var automationScript = require('automation_script')['automationScript'];
var automatorPane = require('automator_pane_manager').automatorPane;

function testAutomate() {    
    var automationWorkers = {};

    function workerMessageHandler(msg) {
        if (msg.type) {
            switch(msg.type) {
                case "register_worker":
                    automationWorkers[msg.id] = msg.func.toString();
                    break;
                case "run_worker":
                    spawnWorkerForPage(msg.url, msg.id, msg.visual);
                    break;
                case "return_value":
                    automatorPane.addProperty(msg.key,msg.value);
                    break;
            }
        }
        
        if (msg.error) {
            automatorPane.showError(msg.error);
            return;
        }
        if (msg.url)
            console.log('URL: ' + msg.url);
    }

    function spawnWorkerForPage(url, workerScript, visual) {
        var pageWorkerParams = {
        // panel.Panel({ ///*
            width: 500,
            height: 500, //*/ 
            contentURL: url,
            contentScriptFile: [dataDir.url('js/jquery-1.6.2.min.js'),dataDir.url('js/automation_helpers.js')],
            contentScriptWhen: 'ready',
            onMessage: workerMessageHandler
        };
        
        if (workerScript)
            pageWorkerParams.contentScript = automationWorkers[workerScript];
        else
            pageWorkerParams.contentScriptFile.push(dataDir.url('js/automation_script_file.js'));
        
        
        if (visual) {
            tabs.open({
                url: url,
                onReady: function(tab) {
                    tab.attach(pageWorkerParams);
                }
            });
        }
        else {
            pageWorker.Page(pageWorkerParams);      
        }
    }
    
    // Start at "dummy" page, Google in this case.
    spawnWorkerForPage("http://google.com");
    automatorPane.show();
}

testAutomate();

Automator = function() {
    
}

Automator.prototype.runScript = function(script) {
    
};







// function onContent(domObj) {
//     let window = domObj.defaultView;
//     if (window == null) return;
//     let hostname = window.location.hostname;
// }
// 
// observers.add('document-element-inserted', onContent);