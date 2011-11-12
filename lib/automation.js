const dataDir = require("self").data;
const observers = require("observer-service");
const tabs = require('tabs');
const url = require("url");

let automationScript = require('automation_script')['automationScript'];

function testAutomate() {
    var testAutomator = new Automator();
    // testAutomator.executeScriptGetter(automationScript['facebook.com'],'education_work',function() { console.log ('executeScript callback!'); });   
    
    var automatorPane = require('automator_pane_manager')['automatorPane'];
    automatorPane.show();
    
    var script = automationScript['facebook.com'];
    
    
    // For now, just run getters
    for (var property in script.properties) {
        
        function getDisplayFuncForProperty(property,func) {
            return function(value) {
                func(property,value);
            }
        };
        
        if (script.properties[property].getter) {
            var thisProperty = property;
            testAutomator.executeScript(script,{
                type: 'getter',
                property: thisProperty
            }, getDisplayFuncForProperty(property, function(property,value) {
                console.log(property + ' = ' + value);
                automatorPane.addProperty(property,value);
            }));
        }
    }
}

var Automator = function(script) {
    this.script = script;
    this.scriptStep = 0
    this.postScriptCallback = function(){};
    
    this.queuedScriptExecutions = [];
    
    this.scriptRunning = false;
};

Automator.prototype.executeScript = function(script,method,callback) {
    if (this.scriptRunning) {
        this.queuedScriptExecutions.push([script,method,callback]);
        return;
    }

    this.script = script;
    this.runningScript = script.properties[method.property][method.type];
    if (callback)
        this.postScriptCallback = callback;
    if (!this.tab) {
        var thisAutomator = this;
        tabs.open({
            url: script['site'],
            onReady: function(tab) {
                thisAutomator.tab = tab;
                var worker = thisAutomator.tab.attach({
                    contentScriptFile: [dataDir.url('js/jquery-1.6.2.min.js'),dataDir.url('js/automation_inject.js')],
                    onMessage: function(msg) {
                        thisAutomator.scriptMessageHandler(msg);
                    }
                });
                thisAutomator.tab.worker = worker;
            }
        });   
    }
    else {
        this.scriptStep = 0;
        this.runCurrentScriptStep();
        this.scriptStep++;
    }
    
    this.scriptRunning = true;
};

Automator.prototype.executeScriptGetter = function(script,getterName,callback) {
    this.executeScript(script,{
        property: getterName,
        type: 'getter'
    },callback);
};

Automator.prototype.runCurrentScriptStep = function() {
    console.log('runCurrentScriptStep ' + this.runningScript[this.scriptStep].op );
    this.tab.worker.port.emit('runScript',this.runningScript[this.scriptStep]);
};

Automator.prototype.runNextQueuedScript = function() {
    console.log('runNextQueuedScript, scripts left: ' + this.queuedScriptExecutions.length);
    this.scriptRunning = false;
    if (this.queuedScriptExecutions.length > 0) {
        var toExecute = this.queuedScriptExecutions.splice(0,1)[0];
        
        this.executeScript.apply(this,toExecute);

    }
};

Automator.prototype.scriptMessageHandler = function(msg) {
    
    switch (msg.type) {
        case 'execStep':
            // Is there anything left to execute?
            if (this.scriptStep >= this.runningScript.length)
                return;   
            this.runCurrentScriptStep();
            this.scriptStep++;

            break;
        
        case 'returnValue':
            console.log("Return value is " + msg.value);
            this.postScriptCallback(msg.value);
            break;
            
        case 'scriptFinished':
            this.runNextQueuedScript();
            break;
    }
};

// testAutomate();









// function onContent(domObj) {
//     let window = domObj.defaultView;
//     if (window == null) return;
//     let hostname = window.location.hostname;
// }
// 
// observers.add('document-element-inserted', onContent);