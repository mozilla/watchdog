AutomationHelpers.registerWorker('grabUserPage', function () {
    $(document).ready(function() {    
        if ($('.UIPage_LoggedOut').length > 0) {
            self.postMessage({
                error: 'Not logged in!'
            });
            return;
        }
        
        // TODO: make this work for users that don't have a facebook username.
        // Need to redirect to http://www.facebook.com/profile.php?id=<id>&sk=info

        var facebookInfoURL = $('li.tinyman > a').attr('href').split('?')[0] + '/info';

        AutomationHelpers.runWorker('getUserName', facebookInfoURL, true);
    });
});

AutomationHelpers.registerWorker('getUserName', function() {
    $(document).ready(function() {    
        
        
        // Click every privacy edit button
        AutomationHelpers.simulateClick($('.profileEditButton').get());
        
        function collectData() {
            console.log('collectData');
            var dataRows = $('.dataRow').get(); 
            if (dataRows.length == 0) {
                console.log('got 0 datarows, trying again in 500ms');
                unsafeWindow.clearTimeout(waitForLoad);
                waitForLoad = unsafeWindow.setTimeout(collectData,500);
                return;
            }
            console.log('got ' + dataRows.length + ' datarows');
            
            for (var rowIdx = 0; rowIdx < dataRows.length; rowIdx++) {
                var el = dataRows[rowIdx];
                 AutomationHelpers.returnValue($(el).find('.label').text(),$(el).find('.uiTooltipText').text());
            }
            
            // $.each(dataRows,function(idx,el) {
            //      console.log('in loop');
            //      console.log("key: " + $(el).find('.label').text() + " value: " + $(el).find('.uiTooltipText').text());
            //      AutomationHelpers.returnValue($(el).find('.label').text(),$(el).find('.uiTooltipText').text());
            // 
            // });
        }
        
        // Wait for half a second after the last object loads.
        
        var waitForLoad = null;
        
        $('#timeline_tab_content').bind('DOMSubtreeModified.watchdog', function() {
            console.log('DOM update, newtimeout');
            unsafeWindow.clearTimeout(waitForLoad);
            waitForLoad = unsafeWindow.setTimeout(collectData,1500);
            
            $('#timeline_tab_content').unbind('DOMSubtreeModified.watchdog');
        });
        // 
        // 
        // 
        // var pagelets = [
        //     {
        //         id: 'eduwork',
        //         name: 'Education and Work',
        //         pagelet_selector: '#pagelet_eduwork'
        //     },
        //     {
        //         id: 'hometown',
        //         name: 'Hometown',
        //         pagelet_selector: '#pagelet_hometown'
        //     }
        // ];
        // 
        // for (var pagelet in pagelets) {
        //     $(pagelets[pagelet].pagelet_selector).bind('DOMSubtreeModified.watchdog', function() {
        // 
        //         var retval = $(this.pagelet_selector).find('.uiMenuItem').attr('data-label');
        //         if (!retval) return;
        //         AutomationHelpers.returnValue(this.name, retval);
        //         $(this.pagelet_selector).unbind('DOMSubtreeModified.watchdog');
        //     }.bind(pagelets[pagelet]));
        //  
        //  
        //     AutomationHelpers.simulateClick($(pagelets[pagelet].pagelet_selector).find('.profileEditButton').get());       
        // }
        // 
    });
});

AutomationHelpers.runWorker('grabUserPage', "http://www.facebook.com");