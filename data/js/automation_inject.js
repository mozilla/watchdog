// TODO: Put this file out of its misery.

function automate() {

    function doNextScriptStep() {
        self.postMessage({
            type: 'execStep'
        });
    }
    
    $(document).ready(function() {
        doNextScriptStep();
    });
    
    function doWait(wait) {
        switch (wait.event) {
            case 'ready':
                // already waiting until ready event.
                return;
                
            case 'none':
                doNextScriptStep();
                return;
                
            case 'dom_modified':
                function getDomSubtreeModifiedFunc(selector,ntimes) {
                    return function() {
                        $(selector).unbind('DOMSubtreeModified.watchdogautomator');   
                        if (ntimes == 1) {
                            console.log('dom tree modified enough times');
                            doNextScriptStep();
                             $(selector).unbind('DOMSubtreeModified.watchdogautomator');   
                        } 
                        else {
                            $(selector).bind('DOMSubtreeModified.watchdogautomator',getDomSubtreeModifiedFunc(selector,ntimes-1));
                        }
                    }
                }
                
                $(wait.selector).bind('DOMSubtreeModified.watchdogautomator',getDomSubtreeModifiedFunc(wait.selector,wait.ntimes));
                
                break;
        }
    }
    
    function runScript(script) {        
        if (script.timeout) {
            console.log('timeout ' + script.timeout);
            setTimeout(function() {
                delete script['timeout'];
                runScript(script);
            },script.timeout);   
            return;
        }
        
        switch (script.op) {
            case 'debug_alert':
                alert(script.text);
                break;
            
            case 'eval':
                eval(script.code);

                break;
                
            case 'assert_url':
                var urlToAssert = "";
                
                if (script.urlToAssert)
                    urlToAssert = script.url;
                else if (script.code)
                    urlToAssert = eval(script.code);
                
                if (unsafeWindow.location != urlToAssert) {
                    unsafeWindow.location = urlToAssert;   
                    console.log ("setting location to  " + urlToAssert);
                }
                else {
                    // FIXME: If the assertion succeeds, we need to manually advance the script step. Should clean this up.
                    
                    doNextScriptStep();
                    return;
                }
                
                break;

            case 'simulate_click':                
                console.log("simulating click on selector: " + script.target + " at " + (new Date()));
                var targetElems = eval(script.target).get();
                
                for (var elem in targetElems) {
                    var evt = window.document.createEvent('MouseEvents');
                    evt.initMouseEvent('click', true, true, window.document.defaultView, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
                    targetElems[elem].dispatchEvent(evt);
                }
                
                break;

            case 'return_value':
                
                self.postMessage({
                    type: 'returnValue',
                    value: eval(script.code)
                })

                break;
                
            case 'script_finished':
                
                self.postMessage({
                    type: 'scriptFinished'
                });
                
                break;
            }
            
        if (script.wait)
            doWait(script.wait);
        else
            doNextScriptStep();
        
    }
    
    self.port.on('runScript', runScript);
};

automate();
