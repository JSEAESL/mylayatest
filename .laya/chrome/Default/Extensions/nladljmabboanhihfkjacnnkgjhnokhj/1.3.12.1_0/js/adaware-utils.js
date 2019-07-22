/* exported adawareUtils */

var adawareUtils = (function () {

    'use strict';

    var ONE_SECOND = 1000;
    var ONE_MINUTE = 60 * ONE_SECOND;
    var ONE_HOUR = 60 * ONE_MINUTE;
    var ONE_DAY = 24 * ONE_HOUR;


    function generateRandomNumber() {
        return Math.random().toString().substr(2, 15);
    }

    function computeMovingAverage(elementCount, currentAverage, newValue) {
        var newAverage = ((elementCount - 1) * currentAverage + newValue) / elementCount;
        return newAverage;
    }

    // http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
    function getParameterByName(name, url) {
        if (!url) {
            url = window.location.href;
        }
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    function httpRequestAsync(method, url, data, onLoad, onError, onAbort, contentType, authorization) {
        if (contentType === undefined) {
            contentType = 'application/x-www-form-urlencoded';
        }
        if (authorization === undefined) {
            authorization = '';
        }
        if (typeof onAbort !== 'function') {
            onAbort = onError;
        }

        var onResponseReceived = function () {
            this.onload = this.onerror = this.ontimeout = null;
            // xhr for local files gives status 0, but actually succeeds
            var status = this.status || 200;
            if (status < 200 || status >= 300) {
                return onError.call(this, status);
            }
            // never download anything else than plain text: discard if response
            // appears to be a HTML document: could happen when server serves
            // some kind of error page
            var text = this.responseText.trim();
            if (text.startsWith('<') && text.endsWith('>')) {
                return onError.call(this, status);
            }
            return onLoad.call(this, this.responseText, status);
        };

        var onErrorReceived = function () {
            this.onload = this.onerror = this.ontimeout = null;
            onError.call(this, status);
        };

        var onAbortReceived = function () {
            this.onload = this.onerror = this.ontimeout = null;
            onAbort.call(this, status);
        };

        var xhr = new XMLHttpRequest();
        try {
            xhr.open(method, url, true); // true for asynchronous 
            if (method === "POST") { xhr.setRequestHeader('Content-type', contentType); }
            if (method === "POST") {
                if (authorization !== undefined || authorization !== "") {
                    xhr.setRequestHeader('Authorization', authorization);
                } 
            }
            xhr.timeout = 30000; // 30 seconds
            xhr.onload = onResponseReceived;
            xhr.onerror = onErrorReceived;
            xhr.ontimeout = onErrorReceived;
            xhr.onabort = onAbortReceived;
            xhr.send(data);
        } catch (e) {
            
            onErrorReceived.call(xhr);
        }
        return xhr;
    }


    function httpPostAsync(postUrl, postdata, onLoad, onError, onAbort, contentType, authorization) {
        return httpRequestAsync("POST", postUrl, postdata, onLoad, onError, onAbort, contentType, authorization);
    }


    function httpGetAsync(url, onLoad, onError, contentType) {
        return httpRequestAsync("GET", url, null, onLoad, onError, function(){}, contentType);
    }


    function getRemoteAsset(assetUrl, callback, failHandler, expectJSON) {
        if (expectJSON === undefined) {
            expectJSON = true;
        }
        var downloadStart = Date.now();
        

        var failHandlerWrapper = function (httpStatus) { // retry to download lists until we get non empty lists
            
            setTimeout(function () {
                getRemoteAsset(assetUrl, callback, failHandler);
            }, ONE_HOUR);

            failHandler(httpStatus);
        };

        var listReceivedHandler = function (rawAssetList, httpStatus) {
            var parsedList = [];
            var entryNumber = 0;
            if (expectJSON) {
                parsedList = JSON.parse(rawAssetList);
                entryNumber = parsedList.length;
            } else {
                parsedList = rawAssetList;
                entryNumber = (parsedList.split("\n")).length;
            }
            var duration = Date.now() - downloadStart;
            

            if (parsedList.length === 0) {
                
                failHandlerWrapper(httpStatus);
            } else {
                callback(parsedList, httpStatus);
            }
        };

        adawareUtils.httpGetAsync(assetUrl, listReceivedHandler, failHandlerWrapper);
    }

    function fetchWebCompanionData(successHandler, failHandler, url) {
        adawareUtils.httpGetAsync(url, successHandler, failHandler);
    }

    function generateUUID() {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        //
        return uuid;
    }

    return {
        generateRandomNumber:generateRandomNumber,
        computeMovingAverage:computeMovingAverage,
        getParameterByName:getParameterByName,
        httpPostAsync:httpPostAsync,
        httpGetAsync:httpGetAsync,
        getRemoteAsset:getRemoteAsset,
        fetchWebCompanionData: fetchWebCompanionData,
        generateUUID: generateUUID
    };

})();