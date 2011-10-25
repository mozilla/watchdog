const observers = require("observer-service");
const url = require("url");

let automationScript = {
    "facebook.com" : {
        properties: [
            {
                name: 'blah',
                getter: [
                    {
                        op: 'eval',
                        code: "window.location = $('a.headerTinymanName').attr('href') + '/info';"
                    },
                    
                    {
                        op: 'simulate_click',
                        target: "$('#eduwork').find('.profileEditButton')"
                    },
                    
                    {
                        op: 'return_value',
                        code: "$('#pagelet_eduwork').find('.uiMenuItem.checked').attr('data-label')"
                    }
                    
                ]
            }
        ]
    }
}

function onContent(domObj) {
    let window = domObj.defaultView;
    if (window == null) return;
    let hostname = window.location.hostname;
}

function runScript(script) {
    for (var stepIdx in script) {
        switch (script[stepIdx]) {
        case 'eval':
            break;
            
        case 'simulate_click':
            /*
            
            How to simulate click events in javascript:
            
            var evt = document.createEvent('MouseEvents');
            evt.initMouseEvent('click', true, true, document.defaultView, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
            elem.dispatchEvent(evt);
            
            */
            
            
            break;
            
        case 'return_value':
            
            break;
        }
    }
}

observers.add('document-element-inserted', onContent);