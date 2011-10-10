$(document).ready(function() {
    self.port.on('loginData', function(msg){
        // First, clear everything.
        $('#passwords').html('');
        for (var login in msg.loginTable) {
            var httpsOnly = true;
            for (var hostname in msg.loginTable[login]) {
                if (msg.loginTable[login][hostname].hostname.substr(0,8) != 'https://') {
                    httpsOnly = false;
                    break;
                }
            }
            var newPasswordDiv = $('#passwordBase').clone();
            newPasswordDiv.removeAttr('id');
            
            if ((msg.url.substr(0,8) == 'https://') != httpsOnly)
                newPasswordDiv.addClass('notRecommended');

            newPasswordDiv.children('.passwordCleartext').html(login);

            newPasswordDiv.children('.passwordHash').css('background-color','');
            newPasswordDiv.children('.passwordHash').css('background-image','url(' + getDataURLForHash(SHA1(login),200,25) + ')');
            
            var justHosts = msg.loginTable[login].map(function(x) { return x.host; });
            newPasswordDiv.find('.passwordSites').html(justHosts.join(', '));

            $('#passwords').append(newPasswordDiv);
            newPasswordDiv.show();
        }
        
        $('.passwordDiv').click(function() {
            self.postMessage({
                type: 'typePassword',
                password: $(this).children('.passwordCleartext').html()
            });
        });
        
        $('.passwordDiv').mouseout(function() {
           $(this).children('.passwordHash').stop();
           $(this).children('.passwordHash').html('');
        });
        
        $('.passwordHash').mouseenter(function() {
            var passwordHash = this;
            $(passwordHash).animate({
                opacity: 0.0
            },3000, function() {
                $(passwordHash).html("(your password here)");
                // $(passwordHash).html($(passwordHash).parent().children('.passwordCleartext').html());
                $(passwordHash).css('background-image','');
                $(passwordHash).css('background-color','#000000');
                $(passwordHash).css('color','#ffffff');
                $(passwordHash).css('opacity',1);
            });
        });
    });    
});
