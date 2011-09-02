$(document).ready(function() {
    self.port.on('loginData', function(msg){
        // First, clear everything.
        $('#passwords').html('');
        for (var login in msg.loginTable) {
            var httpsOnly = true;
            for (var hostname in msg.loginTable[login]) {
                if (msg.loginTable[login][hostname].substr(0,8) != 'https://') {
                    httpsOnly = false;
                    break;
                }
            }
            var newPasswordDiv = $('#passwordBase').clone();
            newPasswordDiv.removeAttr('id');
            
            if ((msg.url.substr(0,8) == 'https://') != httpsOnly)
                newPasswordDiv.addClass('notRecommended');

            newPasswordDiv.children('.passwordCleartext').html(login);

            newPasswordDiv.children('.passwordHash').css('background-image',gradientStringForHash(SHA1(login)));
            newPasswordDiv.find('.passwordSites').html(msg.loginTable[login].join(','));

            $('#passwords').append(newPasswordDiv);
            newPasswordDiv.show();
        }
        
        $('.passwordDiv').click(function() {
            self.postMessage({
                type: 'typePassword',
                password: $(this).children('.passwordCleartext').html()
            });
        });
    });    
});
