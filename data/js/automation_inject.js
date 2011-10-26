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
                
            case 'dom_modified':
                function getDomSubtreeModifiedFunc(selector,ntimes) {
                    return function() {                    
                        if (ntimes == 1) {
                            console.log('subtree modified!');
                            doNextScriptStep();
                             $(wait.selector).unbind('DOMSubtreeModified.watchdogautomator');   
                        } 
                        else {
                            $(selector).bind('DOMSubtreeModified.watchdogautomator',getDomSubtreeModifiedFunc(selector,ntimes-1));
                        }
                    }
                }
                
                $(wait.selector).bind('DOMSubtreeModified.watchdogautomator',getDomSubtreeModifiedFunc(wait.selector,wait.ntimes));
                
                // $(wait.selector).bind('DOMSubtreeModified.watchdogautomator', function() {
                //     console.log('subtree modified!');
                //     doNextScriptStep();
                //      $(wait.selector).unbind('DOMSubtreeModified.watchdogautomator');
                // });
                break;
        }
    }
    
    function runScript(script) {
        switch (script.op) {
            case 'debug_alert':
                alert(script.text);
                break;
            
            case 'eval':
                // alert(script.code);
                eval(script.code);

                break;
                
            case 'assert_url':
                if (unsafeWindow.location != eval(script.code))
                    unsafeWindow.location = eval(script.code);
                
                break;

            case 'simulate_click':                
                var targetElems = eval(script.target).get();
                
                for (var elem in targetElems) {
                    console.log("elem to click: " + targetElems[elem]);
                    
                    
                    var evt = window.document.createEvent('MouseEvents');
                    evt.initMouseEvent('click', true, true, window.document.defaultView, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
                    targetElems[elem].dispatchEvent(evt);
                }
                
                console.log('simulate_click!');

                break;

            case 'return_value':
                
                self.postMessage({
                    type: 'returnValue',
                    value: eval(script.code)
                })

                break;
                
            case 'script_finished':
                
                self.postMessage({
                    type: 'scriptFinisheds'
                });
            }
            
        if (script.wait)
            doWait(script.wait);
        else
            doNextScriptStep();
        
    }
    
    self.port.on('runScript', runScript);
};

automate();


/*$jq("#eduwork").bind("DOMSubtreeModified", function() {
    alert("tree changed");
});*/