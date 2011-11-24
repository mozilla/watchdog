AutomationHelpers = function() {

    return {
            openNewTab: function(url) {
            },
            registerWorker: function(id, func) {
                self.postMessage({
                    type: 'register_worker',
                    id: id,
                    func: 'var __automate = ' + func.toString() + '; __automate();'
                });
            },
            returnValue: function(key,val) {
                self.postMessage({
                    type: 'return_value',
                    key: key,
                    value: val
                });
            },
            runWorker: function(id, url, visual) {
                self.postMessage({
                    type: 'run_worker',
                    id: id,
                    url: url,
                    visual: visual
                });
            },
            waitForReady: function(callback) {
                $(unsafeWindow.document).bind('ready.watchdog', function() {
                        $(unsafeWindow.document).unbind('ready.watchdog');
                        callback();
                    });
            },
            simulateClick: function(elements) {
                if (!elements.length) elements = [elements];
                for (var elemIdx = 0; elemIdx < elements.length; elemIdx++) {
                    var evt = window.document.createEvent('MouseEvents');
                    evt.initMouseEvent('click', true, true, window.document.defaultView, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
                    elements[elemIdx].dispatchEvent(evt);
                }
            }
        };  
}();