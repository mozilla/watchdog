$(document).ready(function() {
    self.port.on('newPrivacyProperty', function(msg) {
        var newDiv = $('#propertyBase').clone();
        newDiv.removeAttr('id');
        
        newDiv.children('.propertyName').html(msg.property);
        newDiv.children('.propertyValue').html(msg.value);
        
        newDiv.css('display','block');
        
        $('#privacyProperties').append(newDiv);
        
        console.log("Pane name : " + msg.property + " pane value: " + msg.value);
    });
});