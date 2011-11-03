// FIXME: When a user dismisses a doorhanger event, remove in content warning.

function form_detector(){
var lastBlur = null;
var inputElements = document.getElementsByTagName('input');
var inContentWarningVisible = false;
for (var input in inputElements) {
    if (inputElements[input].type == 'password') {
        attachHashAsYouType(inputElements[input]);
    }
}

function attachHashAsYouType(passwordElem) {
    var oldBackgroundImage = passwordElem.style['backgroundImage'];
    var oldBackgroundColor = passwordElem.style['backgroundColor'];
    var oldKeyDown = passwordElem.onkeydown;
    
    function restoreBackgroundColor(elem) {
        elem.style['backgroundImage'] = oldBackgroundImage;
        elem.style['backgroundColor'] = oldBackgroundColor;
    }
    
    function updateVisualHash(elem) {
        if (elem.value == '' || elem != document.activeElement) {
            restoreBackgroundColor(elem);
            return;
        }
        var passwordHash = SHA1(elem.value);
        // var gradientString = gradientStringForHash(passwordHash);
        
        // elem.style['backgroundImage'] = gradientString;
        var elemWidth = Math.max(elem.clientWidth,elem.offsetWidth);
        var elemHeight = Math.max(elem.clientHeight,elem.offsetHeight);
        elem.style['backgroundImage'] = 'url(' + getDataURLForHash(passwordHash,elemWidth,elemHeight) + ')';
        // elem.style['backgroundSize'] = '100%';
    }
    
    passwordElem.onkeypress = function() { 

        
        // var passwordHash = SHA1(this.value);
        // var gradientString = gradientStringForHash(passwordHash);
        // 
        // this.style['backgroundImage'] = gradientString;
        
        // TODO: find if there's another way of keeping track of typed updates.
        setTimeout(function() {
            updateVisualHash(passwordElem)
        },10);
        
        if (oldKeyDown)
            oldKeyDown.apply(this,arguments);
    };
    var oldFocus = passwordElem.onfocus;
    passwordElem.onfocus = function() {

        self.port.emit('focus',{
            type: 'focus',
            pos: findPos(this),
            password: this.value
        });
                
        if (oldFocus)
            oldFocus.apply(this,arguments);
    };
    
    var oldBlur = passwordElem.onblur;
    passwordElem.onblur = function() {
        restoreBackgroundColor(this);
        
        lastBlur = passwordElem;
        self.port.emit('blur',{
            type: 'blur',
            clientRect: passwordElem.getBoundingClientRect(),
            hasFocus: document.activeElement == this,
            host: window.location.host,
            href: window.location.href,
            password: this.value
        });
        
        if (oldBlur)
            oldBlur.apply(this,arguments);
    };
}


// Thanks, http://www.quirksmode.org/js/findpos.html
function findPos(obj) {
	var curleft = curtop = 0;
		if (obj.offsetParent) {
		    do {
        			curleft += obj.offsetLeft;
        			curtop += obj.offsetTop;
        		} while (obj = obj.offsetParent);
    	    return [curleft,curtop];
        }
}

self.port.on('inContentWarning',function(msg) {
    if (lastBlur == null || inContentWarningVisible) return;
    var pos = findPos(lastBlur);
    var newDiv = document.createElement('div');
    inContentWarningVisible = true;
    newDiv.appendChild(document.createTextNode("Watchdog: "));
    document.body.insertBefore(newDiv,null);
    
    var moreInfo = document.createElement('img');
    moreInfo.src = msg.warningIconURL;
    // moreInfo.style['height'] = '50px';
    newDiv.insertBefore(moreInfo,null);
    
    function hideInContentWarning() {
        document.body.removeChild(newDiv);
        inContentWarningVisible = false;
    }
    
    moreInfo.addEventListener('click',function() {
        self.port.emit('moreInfo', {
            alertUUIDs: msg.alertUUIDs
        });
        hideInContentWarning();
    });
    
    newDiv.style['fontFamily'] = "helvetica,sans-serif";
    newDiv.style['fontSize'] = "120%";
    newDiv.style['backgroundColor'] = '#ffffff';
    newDiv.style['position'] = 'absolute';
    newDiv.style['opacity'] = 0.9;
    newDiv.style['left'] = pos[0].toString() + 'px';
    
    // TODO: CSS transition
    newDiv.style['top'] = (pos[1] + lastBlur.offsetHeight).toString() + 'px';

    newDiv.style['zIndex'] = 999999;
    
});
};

form_detector();