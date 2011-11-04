function filterBubble() {

    var warningIconURL = "";

    function getSearchTerm() {
        return $('[title="Search"]').val();
    }
    
    function compareResults(personalizedResults, unpersonalizedResults) {
        var hasPersonalizedResults = false;
        
        for (var result = 0; result < personalizedResults.length; result++) {
            var isPersonalOnly = unpersonalizedResults.filter(function(item) {
                return item.url == personalizedResults[result].url;
            }).length == 0;
            
            if (isPersonalOnly) {
                hasPersonalizedResults = true;

                var personalizedWarning = $("<div>This result is personalized!</div>");
                personalizedWarning.css('font-weight','bold');
                
                if (warningIconURL)
                    personalizedWarning.append('<img src="' + warningIconURL + '">');
                
                $('a[href="' + personalizedResults[result].url + '"]').parent().append(personalizedWarning);
            }
        }
        
        if (hasPersonalizedResults) {
            var unpersonalizedText = $("<div>Some of these search results have been filtered specifically for you. </div>");
            var unpersonalizedLink = $("<a>View unfiltered results.</a>");
            
            // TODO: https?
            unpersonalizedLink.attr('href',"http://www.google.com/search?q=" + encodeURIComponent(getSearchTerm()) + "&pws=0");
            
            unpersonalizedText.append(unpersonalizedLink);
            
            $('#appbar').append(unpersonalizedText);
        }
        
    }
    
    function resultsFromResultElements(resultElements) {
        var returnResults = [];
        
        for (var element = 0; element < resultElements.length; element++) {
            var url = $(resultElements[element]).find('.r > a').attr('href');
            
            // Don't bother with links that lead to other google pages.
            // Some of them are google maps links based on location, or "next" and "prev"
            // links that don't appear in the personalized results because they're from
            // a search with google instant disabled.
            if (!url || url[0] == '/') continue;
            
            returnResults.push({
                url: url,
                rank: element
            });
        }
        
        return returnResults;
    }

    $(document).ready(function() {
        self.port.on('getSearchTerm', function() {
            self.port.emit('searchTerm', {
                searchTerm: getSearchTerm()
            });
        });
        
        self.port.on('warningIconURL', function(msg) {
            warningIconURL = msg.url;
        });
        
        self.port.on('unpersonalizedResults', function(msg) {

            var unpersonalizedResults = resultsFromResultElements($(msg.unpersonalizedResults).find('.g'));
            var personalizedResults = resultsFromResultElements($('.g'));
            
            compareResults(personalizedResults,unpersonalizedResults);
        });
    });


}

filterBubble();