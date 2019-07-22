/* exported adawareTelemetry */

var adawareTelemetry = (function () {

    'use strict';

    var POST_URL = "https://flow.lavasoft.com/v1/event-stat?";

    var postParameters = {
        ProductID: "SrExt",
        Type: ""
    };

    var UNINSTALL_URL = "https://adaware.com/sr/uninstall.html?";

    var browserEnvironment = null;
    var appData = {
        ExtensionLocale: vAPI.getUILanguage(),
        ExtensionVersion: vAPI.app.version
    }; 

    var externalData = {
        PartnerID: "",
        CampaignID: "",
        sourceTraffic: "",
        OfferID: "",
        CLID: "",
        extensionID: chrome.runtime.id
    };

    var booleanMap = {
        true: 1,
        false: 0
    };

    var installDate = 0; // 'real extension install date'
    var installId = 0;

    var optInEvents = { // "*" means all fields for event are either ALL opted in/out
        ListChange: "*",
        UserAction: "*",
        ToggleAdblocking: "*",
        ToggleACS: "*",
        TogglePopups: "*",
        WhitelistYoutube: "*",
        WarningPageShown: ["DomainName", "Url"],
        WarningPageButtons: ["DomainName", "Url"]
    };

    // Tracking data object structure
    //---------------------------------------------------------------------------------------------------------------------
    var TrackingData = function (browserEnv, appData, externalData, customEvent) {
        this.init(browserEnv, appData, externalData, customEvent);
    };

    TrackingData.prototype.init = function (browserEnv, appData, externalData, customEvent) {
        // 
        var i;
        for (i = 0; i < arguments.length; i++) {
            var arg = arguments[i];
            if (arg) {
                var properties = Object.getOwnPropertyNames(arg);
                for (var k in properties) { // skip prototype keys and null keys
                    var key = properties[k];
                    if (arg[key] !== null) {
                        this[key] = arg[key];
                    }
                }
            }
        }
    };

    TrackingData.prototype.getFormatted = function () { // get properly structured tracking data with non-null fields
        var tracking = {};
        var properties = Object.getOwnPropertyNames(this);
        for (var k in properties) { // skip prototype keys
            var key = properties[k];
            tracking[key] = this[key];
        }
        clean(tracking);
        return {
            Data: tracking
        };
    };

    var BrowserEnvironmentData = function () {
        var browserInfo = getBrowserInfo();
        this.BrowserFamily = browserInfo.name;
        this.BrowserVersion = browserInfo.version;
        this.BrowserLocale = browserInfo.lang;
        this.Platform = getOSName();
    };

    var EventData = function (data) { // when initializing keep same key names
        var properties = Object.getOwnPropertyNames(data);
        for (var k in properties) { // skip prototype keys
            var key = properties[k];
            this[key] = data[key];
        }
    };


    // http://stackoverflow.com/questions/286141/remove-blank-attributes-from-an-object-in-javascript
    function clean(obj) {
        var propNames = Object.getOwnPropertyNames(obj);
        for (var i = 0; i < propNames.length; i++) {
            var propName = propNames[i];
            if (obj[propName] === null || obj[propName] === undefined) {
                delete obj[propName];
            }
        }
    }

    function getBrowserInfo() {
        var browserNameAndVersion = getBrowserNameAndVersion().split(" ");
        return {
            name: browserNameAndVersion[0],
            version: browserNameAndVersion[1],
            lang: navigator.language || navigator.userLanguage
        };
    }

    //https://stackoverflow.com/questions/2400935/browser-detection-in-javascript
    function getBrowserNameAndVersion() {
        var ua = navigator.userAgent, tem,
            M = ua.match(/(vivaldi|opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*([0-9|\.]+)/i) || [];
        if (/trident/i.test(M[1])) {
            tem = /\brv[ :]+([0-9|\.]+)/g.exec(ua) || [];
            return 'IE ' + (tem[1] || '');
        }
        if (M[1] === 'Firefox') {
          tem = ua.match(/\b(PaleMoon)\/([0-9|\.]+)/);
            if (tem != null) return tem.slice(1).join(' ');
        }
        if (M[1] === 'Chrome') {
            tem = ua.match(/\b(OPR|Edge)\/([0-9|\.]+)/);
            if (tem != null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
        }
        M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
        if ((tem = ua.match(/version\/([0-9|\.]+)/i)) != null) M.splice(1, 1, tem[1]);
        return M.join(' ');
    }

    function getOSName() {
        var OSName = "other";
        if (navigator.appVersion.indexOf("Win") != -1) OSName = "windows";
        else if (navigator.appVersion.indexOf("Mac") != -1) OSName = "mac";
        else if (navigator.appVersion.indexOf("Linux") != -1) OSName = "linux";
        return OSName;
    }
    //---------------------------------------------------------------------------------------------------------------------

    // Telemetry object structure
    //---------------------------------------------------------------------------------------------------------------------

    var Telemetry = function () {
        
        this.init();
    };

    Telemetry.prototype.init = function () {
        browserEnvironment = new BrowserEnvironmentData();
    };

    Telemetry.prototype.setupUninstall = function () {
        var uninstallData = {
            InstallDate: new Date(installDate).toISOString(),
            PartnerID: externalData.PartnerID,
            sourceTraffic: externalData.sourceTraffic,
            InstallId: installId,
            CampaignID: externalData.CampaignID,
            CLID: externalData.CLID, 
            OfferID: externalData.OfferID, 
            extensionId: externalData.extensionID
        };
        var trackingDetails = new TrackingData(uninstallData);
        setupUninstall(trackingDetails);
    };

    Telemetry.prototype.sendEventTrackingInfo = function (eventType, eventData, metaDataIncluded) {
        // 
        if (metaDataIncluded === undefined) {
            metaDataIncluded = true;
        }
        var details = null;
        if (metaDataIncluded) {
            details = new TrackingData(browserEnvironment, appData, externalData, eventData);
        } else {
            details = new TrackingData(eventData);
        }
        details.InstallDate = new Date(installDate).toISOString();
        details.InstallId = installId;

        // var detailsClone = Object.assign({}, details);
        // 

        postParameters.Type = eventType;
        var postUrlDestination = POST_URL + dictToStringParams(postParameters);

        
        sendReport(details.getFormatted(), postUrlDestination);
    };

    Telemetry.prototype.setInstallDate = function (newDate) {
        installDate = newDate;
        var prettyStringDate = new Date(installDate).toString();
        
    };

    Telemetry.prototype.getInstallDate = function () {
        return installDate;
    };

    Telemetry.prototype.setInstallId = function (newId) {
        installId = newId;
        
    };

    Telemetry.prototype.getInstallId = function () {
        return installId;
    };

    Telemetry.prototype.setExternalData = function (data) {
        for(var key in data) {
            if (externalData.hasOwnProperty(key) && data[key]) {
                externalData[key] = data[key];
            }
        }
        
    };

    Telemetry.prototype.getExternalData = function () {
        return externalData;
    };
    //---------------------------------------------------------------------------------------------------------------------

    function sendReport(trackingData, postUrl) {
        
        adawareUtils.httpPostAsync(postUrl, JSON.stringify(trackingData),
            function onSuccess(response) {
                var parsedResponse = JSON.parse(response);
                
            },
            function onFail(response) {
                try {
                    var parsedResponse = JSON.parse(response);
                    
                } catch (e) {
                    
                }
            },
            function onAbort() { },
            'application/json'
        );
    }

    function setupUninstall(trackingData) {
        var uninstallationUrl = UNINSTALL_URL;
        uninstallationUrl += dictToStringParams(trackingData);
        
        try {
            vAPI.setUninstallURL(uninstallationUrl);
        } catch (e) {
            
        }
    };

    function dictToStringParams(obj) {
        var result = "";
        var properties = Object.getOwnPropertyNames(obj);
        for (var k in properties) {
            var key = properties[k];
            result = result + key + "=" + obj[key] + "&";
        }
        return result.substring(0, result.length - 1);
    }

    return new Telemetry();

})();