
'use strict';

(function () {

    if (vAPI.chrome) { // do not use webrequest API for chromium
        
        return;
    }

    // Intercept and filter web requests.
    var onBeforeRequest = function (details) {

        // Special handling for root document.
        // https://github.com/chrisaljoudi/uBlock/issues/1001
        // This must be executed regardless of whether the request is
        // behind-the-scene
        var requestType = details.type;
        if (requestType === 'main_frame') {
            return onBeforeRootFrameRequest(details);
        }
    };

    var onBeforeRootFrameRequest = function (details) {
        var tabId = details.tabId,
            requestURL = details.url,
            ub = uBlock;
            
        

        var isWebCompanionParametersAppended = ((requestURL.indexOf("&pId") > -1) && (requestURL.indexOf("&iDate") > -1) && (requestURL.indexOf("&sp") > -1) && (requestURL.indexOf("&bName") > -1));
        if ( ((requestURL.indexOf("defaultsearch.co/") > -1)) && isWebCompanionParametersAppended === false ) {
            // check for existing parameters
            var queryParameterValue = adawareUtils.getParameterByName("q", requestURL);
            var partnerIdParameterValue = adawareUtils.getParameterByName("pId", requestURL) || adawareTelemetry.getExternalData().PID;
            var installDateParameterValue = adawareUtils.getParameterByName("iDate", requestURL) || ub.webCompanionData.iDate;
            var searchProviderParameterValue = adawareUtils.getParameterByName("sp", requestURL) || ub.webCompanionData.searchEngine;

            var browserName = vAPI.browserShortName;

            var appendedQueryParameters = "&pId=" + partnerIdParameterValue + "&iDate=" + installDateParameterValue + "&sp=" + searchProviderParameterValue + "&bName=" + browserName;
            var querylessUrl = ub.SEARCH_ENGINE_URL;
            var updatedURL = querylessUrl + "/?q=" + queryParameterValue + appendedQueryParameters;

            
            vAPI.tabs.replace(tabId, updatedURL);
            return;
        }
    };

    var onBeforeSendHeaders = function (details) {
        var changed = false;
        if (details.url.indexOf("privatesearch.adaware.com") > -1) {
            
            for (var i = 0; i < details.requestHeaders.length; ++i) {
                if (details.requestHeaders[i].name.toLowerCase() === 'user-agent') { // lower case to work both in firefox and chrome
                    
                    // details.requestHeaders.splice(i, 1);
                    details.requestHeaders[i].value = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36";
                    changed = true;
                    break;
                }
            }
        }
        return { requestHeaders: details.requestHeaders };
    };


    vAPI.net.onBeforeRequest = {
        urls: [
            'http://*/*',
            'https://*/*'
        ],
        extra: ['blocking'],
        callback: onBeforeRequest
    };

    vAPI.net.onBeforeSendHeaders = {
        urls: [
            'http://*/*',
            'https://*/*'
        ],
        extra: ['requestHeaders'],
        callback: onBeforeSendHeaders
    };
    
    vAPI.net.registerListeners();

    //


})();


