const dataDir = require("self").data;
const observers = require("observer-service");
const tabs = require('tabs');
const url = require("url");

let automationScript = {
    "facebook.com" : {
        site: "http://www.facebook.com",
        properties: [
            {
                name: 'blah',
                getter: [
                    {
                        op: 'assert_url',
                        code: "$('a.headerTinymanName').attr('href') + '/info';",
                        wait: {
                            event: 'ready'
                        }
                    },
                    
                    {
                        op: 'simulate_click',
                        target: "$('#eduwork').find('.profileEditButton')",
                        wait: {
                            event: 'dom_modified',
                            selector: '#pagelet_eduwork',
                            ntimes: 2
                        }
                    },
                    
                    {
                        op: 'return_value',
                        code: "$('#pagelet_eduwork').find('.uiMenuItem.checked').attr('data-label')"
                    },
                    
                    
                    {
                        op: 'simulate_click',
                        target: "$('#pagelet_eduwork').find('.uiHeaderActions > .uiButton')",
                        wait: {
                            event: 'dom_modified',
                            selector: '#pagelet_eduwork',
                            ntimes: 1
                        }
                    },
                    
                    {
                        op: 'script_finished'
                    }
                    
                ]
            }
        ]
    }
}

var Automator = function() {
    this.scriptStep = 0;
};

Automator.prototype.startScript = function(script) {
    this.script = script;
    var thisAutomator = this;
    tabs.open({
        url: script['site'],
        onReady: function(tab) {
            var worker = tab.attach({
                contentScriptFile: [dataDir.url('js/jquery-1.6.2.min.js'),dataDir.url('js/automation_inject.js')],
                onMessage: function(msg) {
                    thisAutomator.scriptMessageHandler(tab,msg);
                }
            });
            tab.worker = worker;
        }
    });
};

Automator.prototype.scriptMessageHandler = function(tab,msg) {
    
    switch (msg.type) {
        case 'execStep':
            // Is there anything left to execute?
            if (this.scriptStep >= this.script.properties[0].getter.length)
                return;
            tab.worker.port.emit('runScript',this.script.properties[0].getter[this.scriptStep]);
            this.scriptStep++;

            break;
        
        case 'returnValue':
            console.log("Return value is " + msg.value);
            break;
    }
};

var testAutomator = new Automator();
testAutomator.startScript(automationScript['facebook.com']);


function onContent(domObj) {
    let window = domObj.defaultView;
    if (window == null) return;
    let hostname = window.location.hostname;
}

observers.add('document-element-inserted', onContent);