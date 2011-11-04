// TODO: detect changes in rank because of filtering as well?

// FIXME: have this working for more than the first few pages of google search results.
// FIXME: also doesn't work with multiple searches inside of google instant. And maps results.

const { MatchPattern } = require("match-pattern");
const dataDir = require("self").data;
const pagemod = require("page-mod");
const request = require('request');

pagemod.PageMod({
    include: /https?:\/\/www\.google\.com\/search.*/,
    contentScriptFile: [dataDir.url('js/jquery-1.6.2.min.js'),dataDir.url('js/filter_bubble_inject.js')],
    onAttach: function(worker) {
        worker.port.on('searchTerm', function(msg) {
            getUnpersonalizedResults(msg.searchTerm, function(callbackResults) {
                worker.port.emit('unpersonalizedResults', callbackResults);
            });
        });
        
        worker.port.emit('warningIconURL', {
            url: dataDir.url("warning_icon.png")
        });
        worker.port.emit('getSearchTerm');
    }
});

function getUnpersonalizedResults(searchTerm, callback) {
    // as_qdr=all disables google instant, which enables us to view 100 results at once.
    // and pws=0 disables personalization.
    request.Request({
        url: "https://www.google.com/search?q=" + encodeURIComponent(searchTerm) + "&pws=0&num=20&as_qdr=all",
        onComplete: function(response) {
            callback({
                unpersonalizedResults: response.text
            });
        }
    }).get();
}