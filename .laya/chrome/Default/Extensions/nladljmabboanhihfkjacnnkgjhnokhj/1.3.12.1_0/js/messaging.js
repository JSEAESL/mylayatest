'use strict';

// Default handler

(function () {

    var ub = uBlock;

    var onMessage = function (request, sender, callback) {
        // Async
        switch (request.what) {
            default:
                break;
        }

        var tabId = sender && sender.tab ? sender.tab.id : 0;

        // Sync
        var response;

        switch (request.what) {
            case 'getAppData':
                response = { name: vAPI.app.name, version: vAPI.app.version };
                break;

            default:
                return vAPI.messaging.UNHANDLED;
        }

        callback(response);
    };

    vAPI.messaging.setup(onMessage);

})();


// channel: adaware-telemetry

(function () {

    var ub = uBlock;

    var onMessage = function (request, sender, callback) {
        // Async
        switch (request.what) {
            default:
                break;
        }

        // Sync
        var response;

        //
        adawareTelemetry.sendEventTrackingInfo(request.what, request.data);

        callback(response);
    };

    vAPI.messaging.listen('adaware-telemetry', onMessage);

})();


// channel: new-tab

(function () {

    var ub = uBlock;
    var oneSecond = 1000;
    var oneMinute = 60 * oneSecond;
    var oneHour = 60 * oneMinute;
    var oneDay = 24 * oneHour;

    var onMessage = function (request, sender, callback) {
        // Async
        switch (request.what) {
            default:
                break;
        }

        // Sync
        var response;

        switch (request.what) {
            case 'searchBarEntry':
                // 
                var sp = ub.webCompanionData.searchEngine;
                var iDate = new Date(adawareTelemetry.getInstallDate()).toISOString();
                var productId = "SrExt";
                var pId = "";
                
                
                
                bitMask.getValue("New Tab").then((bitMaskValue) => {
                    chrome.storage.local.get("externalData", function(data) {
                        pId = data.externalData.PartnerID;
                        
                        
                        response = ub.SEARCH_ENGINE_URL + "/?q=" + request.data + "&sp=" + sp + "&pId=" + pId + "&iDate=" + iDate + "&productId=" + productId + "&bitmask=" + bitMaskValue;
                        callback(response);
                    });
                });
                
                // 
                break;
            
            case 'setSearch':
                function createCookieObject(value, host, path, name, expiry) {
                    var cookieValue;
                    if (typeof value === "object") {
                        cookieValue = JSON.stringify(value);
                    } else {
                        cookieValue = value;
                    }
                    return {
                        host: host,
                        path: path,
                        name: name,
                        value: cookieValue,
                        isSecure: false,
                        isHttpOnly: false,
                        isSession: false,
                        expiry: expiry
                    };
                }

                var bitmask = "";
                var installDate = "";
                var partnerID = "";

                
                ub.webCompanionData.searchEngine = ub.SEARCH_TO_NUM_MAP[request.search];
                vAPI.storage.set({ "webCompanionData": ub.webCompanionData });

                
                var expirationDate = (Date.now() + 50 * 365 * oneDay) / 1000;

                var defaultSearchUrl = ub.SEARCH_ENGINE_URL;

                defaultSearchUrl = "defaultsearch.co";

                
                
                bitMask.getValue("SearchSet").then((bitMaskValue) => {
                    
                    bitmask = bitMaskValue;
                    chrome.storage.local.get("installDate", function(data) {
                        
                        installDate = new Date(data.installDate).toISOString();
                        chrome.storage.local.get("externalData", function(data) {
                            partnerID = data.externalData.PartnerID;
                            

                            var cookieValues = {
                                SE_provider: request.search,
                                install_date: ub.webCompanionData.iDate || installDate,
                                partner_id: adawareTelemetry.getExternalData().PartnerID || partnerID,
                                browser_name: vAPI.browserShortName,
                                bitmask: bitmask
                            };

                            var cookieDetails = createCookieObject(cookieValues, defaultSearchUrl, "/", "search_companion", expirationDate);

                            
                            vAPI.setCookie(cookieDetails);
                        });
                    });
                });
                
                break;

            case 'getSearch':
                response = ub.NUM_TO_SEARCH_MAP[ub.webCompanionData.searchEngine];
                callback(response);
                break;

            default:
                return vAPI.messaging.UNHANDLED;
        }

        
    };

    vAPI.messaging.listen('new-tab', onMessage);

})();



