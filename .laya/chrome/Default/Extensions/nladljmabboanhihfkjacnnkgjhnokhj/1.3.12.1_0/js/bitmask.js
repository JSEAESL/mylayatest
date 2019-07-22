'use strict';

var bitMask = (function () {

    var getOSName = function () {
        var OSName = "Other";
        if (window.navigator.userAgent.indexOf("Windows NT 10.0")!= -1) OSName="Windows 10";
        if (window.navigator.userAgent.indexOf("Windows NT 6.2") != -1) OSName="Windows 8";
        if (window.navigator.userAgent.indexOf("Windows NT 6.1") != -1) OSName="Windows 7";
        if (window.navigator.userAgent.indexOf("Windows NT 6.0") != -1) OSName="Windows Vista";
        // if (window.navigator.userAgent.indexOf("Windows NT 5.1") != -1) OSName="Windows XP";
        // if (window.navigator.userAgent.indexOf("Windows NT 5.0") != -1) OSName="Windows 2000";
        // if (window.navigator.userAgent.indexOf("Mac")            != -1) OSName="Mac/iOS";
        // if (window.navigator.userAgent.indexOf("X11")            != -1) OSName="UNIX";
        // if (window.navigator.userAgent.indexOf("Linux")          != -1) OSName="Linux";
        return OSName;
    }

    var BrowserDetect = function() {
        var nav = window.navigator,
        ua = window.navigator.userAgent.toLowerCase();
        // Detect browsers (only the ones that have some kind of quirk we need to work around)
        if ((nav.appName.toLowerCase().indexOf("microsoft") != -1 || nav.appName.toLowerCase().match(/trident/gi) !== null))
            return "IE";
        if (ua.match(/chrome/gi) !== null)
            return "Chrome";
        if (ua.match(/firefox/gi) !== null)
            return "Firefox";
        if (ua.match(/safari/gi) !== null)
            return "Safari";
        if (ua.match(/webkit/gi) !== null)
            return "Webkit";
        if (ua.match(/gecko/gi) !== null)
            return "Gecko";
        if (ua.match(/opera/gi) !== null)
            return "Opera";
        if (ua.match(/edge/gi) !== null)
            return "Edge";
        // If any case miss we will return null
        return "Other";
    };

    var setCookie = function () {
        // BitMask API to set cookie to defaultsearch.co
        adawareUtils.httpPostAsync("https://sg-bitmask.adaware.com/bitmask/maskvalue", JSON.stringify(
            {"os": getOSName(),"browser": BrowserDetect(),"source": "SearchSet","product": "EXT","channel": "0"}
            ),
            function onSuccess(response) {
                var parsedResponse = JSON.parse(response);
                

                var cookieDetails = {
                    url: "https://defaultsearch.co", // hardcoded constructed url for now, to fix
                    name: "bitmask",
                    value: parsedResponse.info,
                    path: "/",
                    secure: false,
                    httpOnly: false,
                    expirationDate: (Date.now() + 50 * 365 * 10000000) / 1000
                };
                chrome.cookies.set(cookieDetails, function () {});
            },
            function onFail(response) {
                try {
                    var parsedResponse = JSON.parse(response);
                    
                } catch (e) {
                    
                }
            },
            function onAbort() { },
            'application/json',
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3MzM0MTJhOC1hNzEzLTQ1ZmQtYjNlYy1iNGI3N2E4MmI4ODkiLCJpc3MiOiJBZGF3YXJlIFNvZnR3YXJlIEluYyIsImF1ZCI6IkFkYXdhcmUsU2VjdXJlU2VhcmNoIiwic2NvcGVzIjpbIlB1YmxpYyJdfQ.KPxlELEgEbpkCpgBVoP0VS-peqRopFwWZ0-ZdL2LWIY'
        );
    }

    // "OS":["Pre-Vista", "Vista", "Windows 7", "Windows 8", "Windows 10", "Other"],
    // "Host Browser":["Firefox", "Chrome", "Edge", "IE", "Other"],
    // "Source":["Homepage", "SearchSet", "New Tab"],
    // "Product":["WC", "EXT"],
    // "Channel":[0, 1, 2, 3, 4]
    var getValue = function (source) {
        var promise = new Promise(function(resolve, reject) {
            adawareUtils.httpPostAsync("https://sg-bitmask.adaware.com/bitmask/maskvalue", JSON.stringify(
                {"os": getOSName(),"browser": BrowserDetect(),"source": source,"product": "EXT","channel": "0"}
                ),
                function onSuccess(response) {
                    var parsedResponse = JSON.parse(response);
                    

                    resolve(parsedResponse.info);
                },
                function onFail(response) {
                    try {
                        var parsedResponse = JSON.parse(response);
                        
                    } catch (e) {
                        
                    }

                    resolve("");
                },
                function onAbort() { },
                'application/json',
                'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3MzM0MTJhOC1hNzEzLTQ1ZmQtYjNlYy1iNGI3N2E4MmI4ODkiLCJpc3MiOiJBZGF3YXJlIFNvZnR3YXJlIEluYyIsImF1ZCI6IkFkYXdhcmUsU2VjdXJlU2VhcmNoIiwic2NvcGVzIjpbIlB1YmxpYyJdfQ.KPxlELEgEbpkCpgBVoP0VS-peqRopFwWZ0-ZdL2LWIY'
            );
        });

        return promise;        
    }

    return {
        setCookie: setCookie, 
        getValue: getValue
    }

})();