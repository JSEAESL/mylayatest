/* global objectAssign */

'use strict';


// Load all: executed once.

uBlock.restart = (function () {


    var ub = uBlock;
    var oneSecond = 1000;
    var oneMinute = 60 * oneSecond;
    var oneHour = 60 * oneMinute;
    var oneDay = 24 * oneHour;
    var lastPing;

    var WEBCOMPANION_ENDPOINT = "http://localhost:9007/webcompanion/extension/ffnt/token";
    // var WEBCOMPANION_ENDPOINT = "http://127.0.0.1:5000/webcompanion";

    var PRIVATE_SEARCH_COUNTRIES = ["US", "AU", "GB", "CA", "FR", "DE", "NL", "ES"];
    var BING_SEARCH_COUNTRIES = ["NZ", "JP", "IT"];

    vAPI.app.onShutdown = function () { };

    var acsList = function(url, key) {
        var blob = null;
        var xhr = new XMLHttpRequest(); 
        xhr.open("GET", url);
        xhr.onload = function() 
        {
            blob = xhr.response;//xhr.response is now a blob object
            localStorage.setItem(key, blob);
        }
        xhr.send();
    }

    var sendDailyActivityData = function (lastPingTime, theme) {
        var lastPingDate = new Date(lastPingTime);
        var currentPingDate = Date.now();
        var deltaMinutes = (currentPingDate - lastPingDate.getTime()) / oneMinute;
        
        var dailyActivityData = {
            LastCallbackDate: lastPingDate.toISOString(),
            SP: ub.webCompanionData.searchEngine,
            Theme: theme,
            extensionID: chrome.runtime.id
        };
        // acsList("https://acs.lavasoft.com/malurl/api/urls/query/whitelist", 'ACS_white'); //just in case to use later
        acsList("https://acs.lavasoft.com/malurl/api/urls/query/blacklist", 'ACS_black');
        adawareTelemetry.sendEventTrackingInfo("DailyActivity", dailyActivityData);
    };


    // Final initialization steps after all needed assets are in memory.
    // - Initialize internal state with maybe already existing tabs.
    // - Schedule next update operation.
    var onAllReady = function () {
        // Daily activity tracking
        lastPing = Date.now();
        setInterval(function () {
            sendDailyActivityData(lastPing, localStorage.getItem('Background'));
            lastPing = Date.now();
        }, oneDay);
        // }, oneMinute);
    };


    // To bring older versions up to date
    var onVersionReady = function (lastVersion) {
        if (lastVersion !== vAPI.app.version) {
            vAPI.storage.set({ version: vAPI.app.version });
        }
    };
    var getLocalStorageInfo = function () {
        var tab_info;
        try {
            chrome.tabs.query({url: 'http://*.adaware.com/*'}, function (tabsArray) {
                //read data from local storage
                if (tabsArray.length > 0) {
                        tab_info = tabsArray[0];
                        chrome.tabs.executeScript(tab_info.id, {code: 'localStorage.getItem("configuration");'}, function (resultsArray) {
                                var parameters = "";
                                parameters = JSON.parse(resultsArray[0]);
                                chrome.storage.sync.set({config: parameters});
                        });
                }
            });
        } catch (e) {
            
        }
    }

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

    function setSearchCompanionCookie(searchProvider, expirationDate) {
        var expiry = (Date.now() + 50 * 365 * oneDay) / 1000; // default to 50 years
        if (expirationDate) {
            expiry = expirationDate;
        }

        // Get BitMask value
        bitMask.getValue("SearchSet").then((bitMaskValue) => {
            var cookieValues = {
                SE_provider: searchProvider,
                install_date: ub.webCompanionData.iDate || new Date().toISOString(),
                partner_id: adawareTelemetry.getExternalData().PartnerID,
                browser_name: vAPI.browserShortName,
                bitmask: bitMaskValue
            };
    
            var defaultSearchUrl = ub.SEARCH_ENGINE_URL;
    
            defaultSearchUrl = "defaultsearch.co";
    
            var cookieDetails = createCookieObject(cookieValues, defaultSearchUrl, "/", "search_companion", expiry);
    
            
            vAPI.setCookie(cookieDetails);
        });
    }

    // Promisified xhr wrapper
    var fetchWebCompanionDataPromise = function (successHandler, failHandler) {
        
        return new Promise(function (resolve, reject) {
            function onResolved(rawData) {
                var successResult = successHandler(rawData);
                resolve(successResult);
            }
            function onRejected() {
                var failResult = failHandler();
                reject(failResult);
            }
            adawareUtils.fetchWebCompanionData(onResolved, onRejected, WEBCOMPANION_ENDPOINT);
        });
    };


    var onStartupHandler = function () { // only launches when all chrome browser processes are closed and if not first install or update
        // read install date
        vAPI.storage.get({ 'installDate': Date.now() }, function (fetched) {
            adawareTelemetry.setInstallDate(fetched.installDate);
        });

        // read install ID
        vAPI.storage.get({'installId': adawareUtils.generateUUID() }, function (fetched) {
            adawareTelemetry.setInstallId(fetched.installId); 
        });

        // Daily activity tracking
        vAPI.storage.get({ 'startupTime': Date.now() }, function (fetched) {
            
            if (Date.now() - fetched.startupTime > oneDay) { // if last startup time is greater than 24 hours
                sendDailyActivityData(fetched.startupTime, localStorage.getItem('Background'));
            }
            vAPI.storage.set({ 'startupTime': Date.now() });
        });

        // Set cookie to store redirection parameters
        setSearchCompanionCookie(ub.NUM_TO_SEARCH_MAP[ub.webCompanionData.searchEngine]);
    };

    var onFirstInstallHandler = function () {
        // All partner and external data/parameter fetching logic
        function inititalizeExternalParameterFetching() {
            function onSuccess(rawData) {
                var parsedData = JSON.parse(JSON.parse(rawData));
                var data = parsedData.data;
                

                var trackingData = {

                };
                var externalData = {
                    "CampaignID": data.campaignId || "",
                    "CLID": data.clid || "",
                    "PartnerID": data.PartnerID || "LV170101FF",
                    "sourceTraffic": data.bundleId || "",
                    'OfferID': data.offerId || "",
                };

                var webCompanionData = {
                    "searchEngine": "1", // Bing
                    "campaignId": data.campaignId || ""
                };

                // remove trailing "_sh" if there is one
                if (data.PartnerID) {
                    if ((data.PartnerID).endsWith("_sh")) {
                        externalData.PartnerID = (data.pid).replace('_sh', '');
                    }
                }
                
                return {
                    "trackingData": trackingData,
                    "externalData": externalData,
                    "webCompanionData": webCompanionData
                };
            }

            function onFail() {
                var trackingData = {
                    
                };
                var externalData = {
                    "CampaignID": "",
                    "CLID": "",
                    "PartnerID": adawareTelemetry.getExternalData().PartnerID || "LV170101FF",
                    "sourceTraffic": "",
                    'OfferID': "",
                };

                var webCompanionData = {
                    "searchEngine": "1", // Bing
                    "campaignId": ""
                };

                return {
                    "trackingData": trackingData,
                    "externalData": externalData,
                    "webCompanionData": webCompanionData
                };
            }

            function checkGeoLocation(data) {
                
                return new Promise(function (resolve, reject) {
                    function onResolved(geoResponse) {
                        var parsedResponse = JSON.parse(geoResponse);
                        var countryCode = parsedResponse.countryCode;
                        var processedData = data;
                        if (PRIVATE_SEARCH_COUNTRIES.indexOf(countryCode) > -1) {
                            processedData.webCompanionData.searchEngine = "1";
                        } else if (BING_SEARCH_COUNTRIES.indexOf(countryCode) > -1) {
                            processedData.webCompanionData.searchEngine = "1";
                        } else {
                            processedData.webCompanionData.searchEngine = "3";
                        }
                        
                        resolve(processedData);
                    }
                    function onRejected(geoResponse) {
                        
                        var processedData = data;
                        reject(processedData);
                    }
                    adawareUtils.httpGetAsync("http://ip-api.com/json", onResolved, onRejected, "application/json");
                });
            }

            function checkInlineCookies(data) {
                
                return new Promise(function (resolve, reject) {
                    var processedData = data;
                    
                    // For chrome and webext
                    vAPI.getCookie({ url: "https://www.adaware.com/ext/", name: "inline" }, function (inlineCookie) {
                        var cookie = unescape(inlineCookie);
                        
                        
                        if (inlineCookie) {
                            //
                            if (data.externalData.PartnerID === 'LV170101FF') {
                                var pidFromInline = JSON.parse(cookie).pid;
                                
                                if (pidFromInline) {
                                    processedData.externalData.PartnerID = pidFromInline;
                                }
                                
                            }

                            processedData.externalData.sourceTraffic = "adaware/ext";
                            var inlineParameters = {
                                "EXT": JSON.parse(cookie).ext || null,
                                "CTA": JSON.parse(cookie).cta || null,
                                "VN": JSON.parse(cookie).vn || null,
                                "SID": JSON.parse(cookie).sid || null
                            };

                            
                            ub.saveInlineParameters(inlineParameters);
        
                            resolve(processedData);
                        } else {
                            resolve(processedData);
                        }
                    });
                });
            }

            function checkAdawareCookies(data) {
                
                return new Promise(function (resolve, reject) {
                    var processedData = data;
                    if (data.externalData.PartnerID === 'LV170101FF') {
                        processedData.externalData.sourceTraffic = "adaware";
                        vAPI.getCookie({ url: "https://www.adaware.com/", name: "config" }, function (data) {
                            if (data !== null) {
                                var cookiePartner = JSON.parse(data).Partner;
                                if (cookiePartner) {
                                    
                                    processedData.externalData.PartnerID = cookiePartner;
                                } else {
                                    
                                }
                            } else {
                                processedData.externalData.PartnerID = "";
                            }
                            resolve(processedData);
                        });
                    } else {
                        resolve(processedData);
                    }
                });
            }

            function checkInlineUpdateCookies(data) {
                
                return new Promise(function (resolve, reject) {
                    var processedData = data;
                    
                    // For chrome and webext
                    vAPI.getCookie({ url: "https://www.adaware.com/wp/", name: "datainstallsource" }, function (inlineCookie) {
                        var cookie = unescape(inlineCookie);
                        
                        if (inlineCookie) {
                            //
                            if (data.externalData.PartnerID === 'LV170101FF') {
                                var pidFromInline = JSON.parse(cookie).pid;
                                if (pidFromInline) {
                                    processedData.externalData.PartnerID = pidFromInline;
                                }
                                
                            }

                            processedData.externalData.sourceTraffic = "WebProtectionTest";
                            var inlineParameters = {
                                "EXT": JSON.parse(cookie).ext || null,
                                "CTA": JSON.parse(cookie).cta || null,
                                "VN": JSON.parse(cookie).vn || null,
                                "SID": JSON.parse(cookie).sid || null
                            };

                            
                            ub.saveInlineParameters(inlineParameters);
                            
                            resolve(processedData);
                        } else {
                            resolve(processedData);
                        }
                    });
                });
            }

            function checkInlineLocalStorage(data) {
                
                return new Promise(function (resolve, reject) {
                    var processedData = data;
                    
                    chrome.storage.sync.get("config", function(data) {
                        if (data && Object.keys(data).length > 0 && data.config !== null) {
                            processedData.externalData.sourceTraffic = data.config.bundleId;
                            processedData.externalData.OfferID = data.config.offerId;
                            processedData.externalData.CampaignID = data.config.campaignId;
                        } else {
                            processedData.externalData.sourceTraffic = "";
                            processedData.externalData.OfferID = "";
                            processedData.externalData.CampaignID = "";
                        }
                        resolve(processedData);
                    });
                });
            }

            function checkParameterUrl(data) {
                
                return new Promise(function (resolve, reject) {
                    try {
                        let processedData = data;
                        chrome.tabs.query({url: 'https://chrome.google.com/webstore/*'}, (tabs) => {
                            if(tabs.length > 0) {
                                
                                let url = tabs[0].url;
                                let params = {};
                                let testing = decodeURIComponent(url.slice(url.indexOf( '?' ) + 1)).split( '&' );
                                testing.forEach( ( val, key ) => {
                                    let parts = val.split( '=', 2 );
                                    params[parts[0]] = parts[1];
                                } );
                                
                                
                                if (Object.keys(params).length > 0) {
                                    processedData.externalData.PartnerID = params.partnerID? params.partnerID:"";
                                    processedData.externalData.CampaignID = params.utm_campaign? params.utm_campaign:"";
                                    processedData.externalData.CLID = params.clid? params.clid:"";
                                    processedData.externalData.OfferID = params.offerid? params.offerid:"";
                                    processedData.externalData.sourceTraffic = params.sourceTraffic? params.sourceTraffic:"";
                                }
                                resolve(processedData);
                            } else {
                                resolve(processedData);
                            }
                        });
                    } catch (e) {
                        
                        reject(e);
                    }
                });
            }
            

            function saveAndSendData(processedData) {
                
                adawareTelemetry.setExternalData(processedData.externalData);
                ub.saveExternalData();

                
                ub.webCompanionData = processedData.webCompanionData;
                vAPI.storage.set({ "webCompanionData": ub.webCompanionData });

                
                setSearchCompanionCookie(ub.NUM_TO_SEARCH_MAP[processedData.webCompanionData.searchEngine]);

                adawareTelemetry.sendEventTrackingInfo("CompleteInstall", processedData.trackingData);
                adawareTelemetry.setupUninstall();
            }
            // acsList("https://acs.lavasoft.com/malurl/api/urls/query/whitelist", 'ACS_white'); //just in case to use later
            acsList("https://acs.lavasoft.com/malurl/api/urls/query/blacklist", 'ACS_black');

            fetchWebCompanionDataPromise(onSuccess, onFail)
                .then(checkGeoLocation, checkGeoLocation) // same handler for promise resolve and reject
                .then(checkInlineCookies,checkInlineCookies) // same handler for promise resolve and reject
                .then(checkAdawareCookies)
                .then(checkInlineUpdateCookies,checkInlineUpdateCookies)
                .then(checkInlineLocalStorage, checkInlineLocalStorage)
                //add more 
                .then(checkParameterUrl, checkParameterUrl)
                .then(saveAndSendData);
        }
        getLocalStorageInfo();
        // write install date
        var dateNow = Date.now();
        adawareTelemetry.setInstallDate(dateNow);
        vAPI.storage.set({ 'installDate': dateNow });

        // write install id
        var installID = adawareUtils.generateUUID()
        adawareTelemetry.setInstallId(installID);
        vAPI.storage.set({ 'installId': installID });

        inititalizeExternalParameterFetching();

        // set installed status cookie for Firefox inline flow
        // set installed status cookie
        var expirationDate = Date.now() + 5 * oneMinute;
        var cookieObject = {
            host:"www.adaware.com", // Don't change syntax of this line
            name:"ssext",
            value:"installed",
            path:"/",
            isSecure:false,
            isHttpOnly:false,
            expiry:expirationDate / 1000
        };
        vAPI.setCookie(cookieObject);
    };

    // could update from same or different codebase with same extension id
    var onUpdatedHandler = function (lastVersion) {
        // All partner and external data/parameter fetching logic
        function inititalizeExternalParameterFetching() {
            function onSuccess(rawData) {
                var parsedData = JSON.parse(JSON.parse(rawData));
                var data = parsedData.data;
                

                var trackingData = {
                    
                };
                var externalData = {
                    "CampaignID": data.campaignId,
                    "CLID": data.clid,
                    "PartnerID": data.pid || "LV170101FF"
                };
                
                // special case where pid was stored in ub.webCompanionData.pid
                // only overwrite pid on update if it was LV170101FF, undefined, "" or null
                if (externalData.PartnerID === "LV170101FF" && ub.webCompanionData.pid) {
                    externalData.PartnerID = ub.webCompanionData.pid;
                }

                var webCompanionData = ub.webCompanionData; // ub.webCompanionData has just been loaded from storage

                return {
                    "trackingData": trackingData,
                    "externalData": externalData,
                    "webCompanionData": webCompanionData
                };
            }

            function onFail() {
                var trackingData = {

                };
                var externalData = {
                    "CampaignID": "",
                    "CLID": "",
                    "PartnerID": adawareTelemetry.getExternalData().PartnerID || "LV170101FF"
                };
                
                // special case where pid was stored in ub.webCompanionData.pid
                // only overwrite pid on update if it was LV170101FF, undefined, "" or null
                if (externalData.PartnerID === "LV170101FF" && ub.webCompanionData.pid) {
                    externalData.PartnerID = ub.webCompanionData.pid;
                }

                // no need to pass external and webCompanion data because already initialized before at onExtensionLaunched

                return {
                    "trackingData": trackingData,
                    "externalData": externalData
                };
            }

            function saveAndSendData(processedData) {
                
                adawareTelemetry.setExternalData(processedData.externalData);
                ub.saveExternalData();

                // Set cookie to store redirection parameters
                setSearchCompanionCookie(ub.NUM_TO_SEARCH_MAP[ub.webCompanionData.searchEngine]);

                if (processedData.webCompanionData) {
                    
                    ub.webCompanionData = processedData.webCompanionData;
                    vAPI.storage.set({ "webCompanionData": ub.webCompanionData });
                }

                adawareTelemetry.sendEventTrackingInfo("CompleteUpdate", processedData.trackingData);
                adawareTelemetry.setupUninstall();
            }

            fetchWebCompanionDataPromise(onSuccess, onFail)
                .then(saveAndSendData, saveAndSendData);  // same handler for both resolve and reject
        }

        // read install date & install ID
        new Promise(function (resolve, reject) {
            vAPI.storage.get({ 'installDate': Date.now(), 'installId': adawareUtils.generateUUID() }, function (fetched) {
                // make sure set before used
                adawareTelemetry.setInstallDate(fetched.installDate);
                adawareTelemetry.setInstallId(fetched.installId);
                resolve();
            });
        }).then(function () { inititalizeExternalParameterFetching(); });
    };

    var onExtensionLaunchHandler = function (ev) {
        

        var promiseList = [];
        promiseList.push(new Promise(function (resolve, reject) {
            vAPI.storage.get({ "externalData": adawareTelemetry.getExternalData() }, function (fetched) {
                adawareTelemetry.setExternalData(fetched.externalData);
                
                resolve("externalData");
            });
        }));
        promiseList.push(new Promise(function (resolve, reject) {
            // Load WebCompanion data
            vAPI.storage.get({ "webCompanionData": ub.webCompanionData }, function (fetched) {
                ub.webCompanionData = fetched.webCompanionData;
                
                resolve("webCompanionData");
            });
        }));
        Promise.all(promiseList) // execute when external data and optin status are ready
            .then(function (resolutionMessage) {
                
                if (ev.reason === "install") {
                    
                    onFirstInstallHandler();
                    var tab_info;
                    try {
                        chrome.tabs.query({url: 'https://chrome.google.com/webstore/detail/*'}, function (tabsArray) {
                            //read data from local storage
                            if (tabsArray.length > 0) {
                                tab_info = tabsArray[0];
                                var tab_param = tab_info.url.split('?')[1];
                                chrome.tabs.create({url:"https://media.adaware.com/securesearch/lp/thankyou.php?"+tab_param});
                            }
                        });
                    } catch (e) {
                        
                    }
                } else if (ev.reason === "update") {
                    onUpdatedHandler(ev.lastVersion);
                    // chrome.tabs.create({url:"https://extensions.adaware.com/securesearch/update.html"});
                } else if (ev.reason === "startup") {
                    onStartupHandler();
                } else {
                    
                }
            });
    };


    var onFirstFetchReady = function (fetched) {
        onVersionReady(fetched.version);
        onAllReady();
    };


    return function () {
        vAPI.capturePreOpenedTabUrls();
        vAPI.onLoadAllCompleted();
        vAPI.onExtensionLaunch(onExtensionLaunchHandler);

        var fetchableProps = {
            'version': '0.0.0.0'
        };
        vAPI.storage.get(fetchableProps, onFirstFetchReady);
    };


})();


uBlock.restart();

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if(request.contents == 'changeTheme') {
            
            var themeChange = {
                LastCallbackDate: new Date().toISOString(),
                Theme: request.theme
            };
            sendResponse({farewell: "goodbye"});
        } else if(request.contents == 'contentUrls') {
            var ACS_black = JSON.parse(localStorage.getItem('ACS_black'));
            var response = { validUrls: {}, unvalidUrls:{}};
            for(var key in request.urls) {
                if(ACS_black.indexOf(request.urls[key]) > -1) {
                    response.unvalidUrls[key] = request.urls[key];
                } else {
                    response.validUrls[key] = request.urls[key];
                }
            }
            sendResponse({urls: response});
        }
    });