// For background page

'use strict';


(function() {



var vAPI = self.vAPI = self.vAPI || {};
var chrome = self.chrome;
var manifest = chrome.runtime.getManifest();

vAPI.chrome = true;
vAPI.chromiumVersion = (function () {
    var matches = /\bChrom(?:e|ium)\/(\d+)\b/.exec(navigator.userAgent);
    return matches !== null ? parseInt(matches[1], 10) : NaN;
})();

var noopFunc = function(){};

vAPI.browserShortName = (function () {
    if (typeof InstallTrigger !== 'undefined') {
        return "FF";
    } else if (!!window.chrome && !!window.chrome.webstore) {
        return "CH";
    } else {
        return "CH";
    }
})();

vAPI.app = {
    name: manifest.name,
    version: manifest.version
};



vAPI.app.restart = function() {
    chrome.runtime.reload();
};


var onExtensionIconClicked = function () { // only for Chromium
    vAPI.tabs.open({
        url: 'new-tab.html',
        active: true
    });
};
// chrome.browserAction.onClicked.addListener(onExtensionIconClicked);


vAPI.getUILanguage = chrome.i18n.getUILanguage;

vAPI.onExtensionLaunch = function (callback) {
    const defaultVersion = '0.0.0.0'; // in case the key is not found
    vAPI.storage.get({ 'version': defaultVersion }, function (fetched) {
        var lastVersion = fetched.version;
        var currentVersion = vAPI.app.version;
        if (currentVersion > lastVersion && lastVersion !== defaultVersion) {
            
            callback({ reason: "update", lastVersion: lastVersion });
        } else {
            vAPI.storage.get({ 'firstRun': true }, function (fetched) {
                if (fetched.firstRun === true) {
                    callback({ reason: "install" });
                    vAPI.storage.set({ 'firstRun': false });
                } else {
                    callback({ reason: "startup" });
                }
            });
        }
    });
};


vAPI.setUninstallURL = function(url, callback) {
    chrome.runtime.setUninstallURL(url, callback);
};


vAPI.setCookie = function (details) {
    var cookieDetails = {
        url: "https://" + details.host + details.path, // hardcoded constructed url for now, to fix
        name: details.name,
        value: details.value,
        path: details.path,
        secure: details.isSecure,
        httpOnly: details.isHttpOnly,
        expirationDate: details.expiry
    };
    chrome.cookies.set(cookieDetails, function () {});
};

vAPI.getCookie = function(details, callback) {
    var cookieDetails = {
        url: details.url, // hardcoded constructed url for now, to fix
        name: details.name
    };
    chrome.cookies.get(cookieDetails, function (cookie) {
        if (callback) {
            callback(cookie ? cookie.value : null);
        }
    });
}


// chrome.storage.local.get(null, function(bin){  });

vAPI.storage = chrome.storage.local;
vAPI.cacheStorage = chrome.storage.local;
vAPI.syncStorage = chrome.storage.sync;


vAPI.tabs = {};
vAPI.tabs.query = chrome.tabs.query;
vAPI.tabs.executeScript = chrome.tabs.executeScript;


vAPI.isBehindTheSceneTabId = function(tabId) {
    return tabId.toString() === '-1';
};

vAPI.noTabId = '-1';



var toChromiumTabId = function(tabId) {
    if ( typeof tabId === 'string' ) {
        tabId = parseInt(tabId, 10);
    }
    if ( typeof tabId !== 'number' || isNaN(tabId) || tabId === -1 ) {
        return 0;
    }
    return tabId;
};



vAPI.tabs.registerListeners = function() {
    var onNavigationClient = this.onNavigation || noopFunc;
    var onUpdatedClient = this.onUpdated || noopFunc;

    // https://developer.chrome.com/extensions/webNavigation
    // [onCreatedNavigationTarget ->]
    //  onBeforeNavigate ->
    //  onCommitted ->
    //  onDOMContentLoaded ->
    //  onCompleted

    // The chrome.webRequest.onBeforeRequest() won't be called for everything
    // else than `http`/`https`. Thus, in such case, we will bind the tab as
    // early as possible in order to increase the likelihood of a context
    // properly setup if network requests are fired from within the tab.
    // Example: Chromium + case #6 at
    //          http://raymondhill.net/ublock/popup.html
    var reGoodForWebRequestAPI = /^https?:\/\//;

    // https://forums.lanik.us/viewtopic.php?f=62&t=32826
    //   Chromium-based browsers: sanitize target URL. I've seen data: URI with
    //   newline characters in standard fields, possibly as a way of evading
    //   filters. As per spec, there should be no whitespaces in a data: URI's
    //   standard fields.
    var sanitizeURL = function(url) {
        if ( url.startsWith('data:') === false ) { return url; }
        var pos = url.indexOf(',');
        if ( pos === -1 ) { return url; }
        var s = url.slice(0, pos);
        if ( s.search(/\s/) === -1 ) { return url; }
        return s.replace(/\s+/, '') + url.slice(pos);
    };

    var onCreatedNavigationTarget = function(details) {
        //
        if ( reGoodForWebRequestAPI.test(details.url) === false ) {
            details.frameId = 0;
            details.url = sanitizeURL(details.url);
            onNavigationClient(details);
        }
    };

    var onBeforeNavigate = function(details) {
        if ( details.frameId !== 0 ) {
            return;
        }
    };

    var onCommitted = function(details) {
        if ( details.frameId !== 0 ) {
            return;
        }
        details.url = sanitizeURL(details.url);
        onNavigationClient(details);
    };

    var onUpdated = function(tabId, changeInfo, tab) {
        if ( changeInfo.url ) {
            changeInfo.url = sanitizeURL(changeInfo.url);
        }
        onUpdatedClient(tabId.toString(), changeInfo, tab);
    };

    chrome.webNavigation.onBeforeNavigate.addListener(onBeforeNavigate);
    chrome.webNavigation.onCommitted.addListener(onCommitted);
    // Not supported on Firefox WebExtensions yet.
    if ( chrome.webNavigation.onCreatedNavigationTarget instanceof Object ) {
        chrome.webNavigation.onCreatedNavigationTarget.addListener(onCreatedNavigationTarget);
    }
    chrome.tabs.onUpdated.addListener(onUpdated);

    if ( typeof this.onClosed === 'function' ) {
        chrome.tabs.onRemoved.addListener(this.onClosed);
    }
};



vAPI.tabs.get = function(tabId, callback) {
    var onTabReady = function(tab) {
        // https://code.google.com/p/chromium/issues/detail?id=410868#c8
        if ( chrome.runtime.lastError ) {
            /* noop */
        }
        // Caller must be prepared to deal with nil tab value
        callback(tab);
    };

    if ( tabId !== null ) {
        tabId = toChromiumTabId(tabId);
        if ( tabId === 0 ) {
            onTabReady(null);
        } else {
            chrome.tabs.get(tabId, onTabReady);
        }
        return;
    }

    var onTabReceived = function(tabs) {
        // https://code.google.com/p/chromium/issues/detail?id=410868#c8
        void chrome.runtime.lastError;
        callback(tabs[0]);
    };
    chrome.tabs.query({ active: true, currentWindow: true }, onTabReceived);
};



// properties of the details object:
//   url: 'URL', // the address that will be opened
//   tabId: 1, // the tab is used if set, instead of creating a new one
//   index: -1, // undefined: end of the list, -1: following tab, or after index
//   active: false, // opens the tab in background - true and undefined: foreground
//   select: true, // if a tab is already opened with that url, then select it instead of opening a new one
//   popup: true // open in a new window

vAPI.tabs.open = function(details) {
    var targetURL = details.url;
    if ( typeof targetURL !== 'string' || targetURL === '' ) {
        return null;
    }

    // extension pages
    if ( /^[\w-]{2,}:/.test(targetURL) !== true ) {
        targetURL = vAPI.getURL(targetURL);
    }

    // dealing with Chrome's asynchronous API
    var wrapper = function() {
        if ( details.active === undefined ) {
            details.active = true;
        }

        var subWrapper = function() {
            var _details = {
                url: targetURL,
                active: !!details.active
            };

            // Opening a tab from incognito window won't focus the window
            // in which the tab was opened
            var focusWindow = function(tab) {
                if ( tab.active ) {
                    chrome.windows.update(tab.windowId, { focused: true });
                }
            };

            if ( !details.tabId ) {
                if ( details.index !== undefined ) {
                    _details.index = details.index;
                }

                chrome.tabs.create(_details, focusWindow);
                return;
            }

            // update doesn't accept index, must use move
            chrome.tabs.update(toChromiumTabId(details.tabId), _details, function(tab) {
                // if the tab doesn't exist
                if ( vAPI.lastError() ) {
                    chrome.tabs.create(_details, focusWindow);
                } else if ( details.index !== undefined ) {
                    chrome.tabs.move(tab.id, {index: details.index});
                }
            });
        };

        // Open in a standalone window
        if ( details.popup === true ) {
            chrome.windows.create({ url: details.url, type: 'popup' });
            return;
        }

        if ( details.index !== -1 ) {
            subWrapper();
            return;
        }

        vAPI.tabs.get(null, function(tab) {
            if ( tab ) {
                details.index = tab.index + 1;
            } else {
                delete details.index;
            }

            subWrapper();
        });
    };

    if ( !details.select ) {
        wrapper();
        return;
    }

    // https://developer.chrome.com/extensions/tabs#method-query
    // "Note that fragment identifiers are not matched."
    // It's a lie, fragment identifiers ARE matched. So we need to remove the
    // fragment.
    var pos = targetURL.indexOf('#');
    var targetURLWithoutHash = pos === -1 ? targetURL : targetURL.slice(0, pos);

    chrome.tabs.query({ url: targetURLWithoutHash }, function(tabs) {
        var tab = tabs[0];
        if ( !tab ) {
            wrapper();
            return;
        }

        var _details = {
            active: true,
            url: undefined
        };
        if ( targetURL !== tab.url ) {
            _details.url = targetURL;
        }
        chrome.tabs.update(tab.id, _details, function(tab) {
            chrome.windows.update(tab.windowId, { focused: true });
        });
    });
};



// Replace the URL of a tab. Noop if the tab does not exist.

vAPI.tabs.replace = function(tabId, url) {
    tabId = toChromiumTabId(tabId);
    if ( tabId === 0 ) {
        return;
    }

    var targetURL = url;

    // extension pages
    if ( /^[\w-]{2,}:/.test(targetURL) !== true ) {
        targetURL = vAPI.getURL(targetURL);
    }

    chrome.tabs.update(tabId, { url: targetURL }, function() {
        // https://code.google.com/p/chromium/issues/detail?id=410868#c8
        if ( chrome.runtime.lastError ) {
            /* noop */
        }
    });
};



vAPI.tabs.remove = function(tabId) {
    tabId = toChromiumTabId(tabId);
    if ( tabId === 0 ) {
        return;
    }

    var onTabRemoved = function() {
        // https://code.google.com/p/chromium/issues/detail?id=410868#c8
        if ( chrome.runtime.lastError ) {
            /* noop */
        }
    };

    chrome.tabs.remove(tabId, onTabRemoved);
};



vAPI.tabs.reload = function(tabId /*, flags*/) {
    tabId = toChromiumTabId(tabId);
    if ( tabId === 0 ) {
        return;
    }

    var onReloaded = function() {
        // https://code.google.com/p/chromium/issues/detail?id=410868#c8
        if ( chrome.runtime.lastError ) {
            /* noop */
        }
    };

    chrome.tabs.reload(tabId, onReloaded);
};



// Select a specific tab.

vAPI.tabs.select = function(tabId) {
    tabId = toChromiumTabId(tabId);
    if ( tabId === 0 ) {
        return;
    }

    chrome.tabs.update(tabId, { active: true }, function(tab) {
        if ( chrome.runtime.lastError ) {
            /* noop */
        }
        if ( !tab ) {
            return;
        }
        chrome.windows.update(tab.windowId, { focused: true });
    });
};


vAPI.tabs.injectScript = function(tabId, details, callback) {
    var onScriptExecuted = function(response) {
        // https://code.google.com/p/chromium/issues/detail?id=410868#c8
        if ( chrome.runtime.lastError ) {
            /* noop */
        }
        if ( typeof callback === 'function' ) {
            callback(response);
        }
    };
    if ( tabId ) {
        chrome.tabs.executeScript(toChromiumTabId(tabId), details, onScriptExecuted);
    } else {
        chrome.tabs.executeScript(details, onScriptExecuted);
    }
};


vAPI.messaging = {
    ports: {},
    listeners: {},
    defaultHandler: null,
    NOOPFUNC: noopFunc,
    UNHANDLED: 'vAPI.messaging.notHandled'
};



vAPI.messaging.listen = function(listenerName, callback) {
    this.listeners[listenerName] = callback;
};



vAPI.messaging.onPortMessage = (function() {
    var messaging = vAPI.messaging;
    var toAuxPending = {};

    // Use a wrapper to avoid closure and to allow reuse.
    var CallbackWrapper = function(port, request, timeout) {
        this.callback = this.proxy.bind(this); // bind once
        this.init(port, request, timeout);
    };

    CallbackWrapper.prototype.init = function(port, request, timeout) {
        this.port = port;
        this.request = request;
        this.timerId = timeout !== undefined ?
                            vAPI.setTimeout(this.callback, timeout) :
                            null;
        return this;
    };

    CallbackWrapper.prototype.proxy = function(response) {
        if ( this.timerId !== null ) {
            clearTimeout(this.timerId);
            delete toAuxPending[this.timerId];
            this.timerId = null;
        }
        // https://github.com/chrisaljoudi/uBlock/issues/383
        if ( messaging.ports.hasOwnProperty(this.port.name) ) {
            this.port.postMessage({
                auxProcessId: this.request.auxProcessId,
                channelName: this.request.channelName,
                msg: response !== undefined ? response : null
            });
        }
        // Mark for reuse
        this.port = this.request = null;
        callbackWrapperJunkyard.push(this);
    };

    var callbackWrapperJunkyard = [];

    var callbackWrapperFactory = function(port, request, timeout) {
        var wrapper = callbackWrapperJunkyard.pop();
        if ( wrapper ) {
            return wrapper.init(port, request, timeout);
        }
        return new CallbackWrapper(port, request, timeout);
    };

    var toAux = function(details, portFrom) {
        var port, portTo;
        var chromiumTabId = toChromiumTabId(details.toTabId);

        // TODO: This could be an issue with a lot of tabs: easy to address
        //       with a port name to tab id map.
        for ( var portName in messaging.ports ) {
            if ( messaging.ports.hasOwnProperty(portName) === false ) {
                continue;
            }
            // When sending to an auxiliary process, the target is always the
            // port associated with the root frame.
            port = messaging.ports[portName];
            if ( port.sender.frameId === 0 && port.sender.tab.id === chromiumTabId ) {
                portTo = port;
                break;
            }
        }

        var wrapper;
        if ( details.auxProcessId !== undefined ) {
            wrapper = callbackWrapperFactory(portFrom, details, 1023);
        }

        // Destination not found: 
        if ( portTo === undefined ) {
            if ( wrapper !== undefined ) {
                wrapper.callback();
            }
            return;
        }

        // As per HTML5, timer id is always an integer, thus suitable to be
        // used as a key, and which value is safe to use across process
        // boundaries.
        if ( wrapper !== undefined ) {
            toAuxPending[wrapper.timerId] = wrapper;
        }

        portTo.postMessage({
            mainProcessId: wrapper && wrapper.timerId,
            channelName: details.toChannel,
            msg: details.msg
        });
    };

    var toAuxResponse = function(details) {
        var mainProcessId = details.mainProcessId;
        if ( mainProcessId === undefined ) {
            return;
        }
        if ( toAuxPending.hasOwnProperty(mainProcessId) === false ) {
            return;
        }
        var wrapper = toAuxPending[mainProcessId];
        delete toAuxPending[mainProcessId];
        wrapper.callback(details.msg);
    };

    return function(request, port) {
        // Auxiliary process to auxiliary process
        if ( request.toTabId !== undefined ) {
            toAux(request, port);
            return;
        }

        // Auxiliary process to auxiliary process: response
        if ( request.mainProcessId !== undefined ) {
            toAuxResponse(request);
            return;
        }

        // Auxiliary process to main process: prepare response
        var callback = messaging.NOOPFUNC;
        if ( request.auxProcessId !== undefined ) {
            callback = callbackWrapperFactory(port, request).callback;
        }

        // Auxiliary process to main process: specific handler
        var r = messaging.UNHANDLED;
        var listener = messaging.listeners[request.channelName];
        if ( typeof listener === 'function' ) {
            r = listener(request.msg, port.sender, callback);
        }
        if ( r !== messaging.UNHANDLED ) {
            return;
        }

        // Auxiliary process to main process: default handler
        r = messaging.defaultHandler(request.msg, port.sender, callback);
        if ( r !== messaging.UNHANDLED ) {
            return;
        }

        // Auxiliary process to main process: no handler
        

        // Need to callback anyways in case caller expected an answer, or
        // else there is a memory leak on caller's side
        callback();
    };
})();



vAPI.messaging.onPortDisconnect = function(port) {
    port.onDisconnect.removeListener(vAPI.messaging.onPortDisconnect);
    port.onMessage.removeListener(vAPI.messaging.onPortMessage);
    delete vAPI.messaging.ports[port.name];
};



vAPI.messaging.onPortConnect = function(port) {
    port.onDisconnect.addListener(vAPI.messaging.onPortDisconnect);
    port.onMessage.addListener(vAPI.messaging.onPortMessage);
    vAPI.messaging.ports[port.name] = port;
};



vAPI.messaging.setup = function(defaultHandler) {
    // Already setup?
    if ( this.defaultHandler !== null ) {
        return;
    }

    if ( typeof defaultHandler !== 'function' ) {
        defaultHandler = function(){ return vAPI.messaging.UNHANDLED; };
    }
    this.defaultHandler = defaultHandler;

    chrome.runtime.onConnect.addListener(this.onPortConnect);
};



vAPI.messaging.broadcast = function(message) {
    var messageWrapper = {
        broadcast: true,
        msg: message
    };

    for ( var portName in this.ports ) {
        if ( this.ports.hasOwnProperty(portName) === false ) {
            continue;
        }
        this.ports[portName].postMessage(messageWrapper);
    }
};




vAPI.net = {};





vAPI.lastError = function() {
    return chrome.runtime.lastError;
};


// list of tab urls before extension launch
vAPI.preopenedTabUrls = [];

// This is called only once, when everything has been loaded in memory after
// the extension was launched. It is used to capture opened tab urls before extension was launched.
vAPI.capturePreOpenedTabUrls = function() {
    var tabsHandler = function(tabs) {
        var i = tabs.length, tab;
        while ( i-- ) {
            tab = tabs[i];
            vAPI.preopenedTabUrls.push(tab.url);
        }
    };

    chrome.tabs.query({ url: '<all_urls>' }, tabsHandler);
};

// This is called only once, when everything has been loaded in memory after
// the extension was launched. It can be used to inject content scripts
// in already opened web pages, to remove whatever nuisance could make it to
// the web pages before uBlock was ready.

vAPI.onLoadAllCompleted = function() {
    // http://code.google.com/p/chromium/issues/detail?id=410868#c11
    // Need to be sure to access `vAPI.lastError()` to prevent
    // spurious warnings in the console.
    var scriptDone = function() {
        vAPI.lastError();
    };
    var scriptStart = function(tabId) {
        // vAPI.tabs.injectScript(tabId, {
        //     file: 'js/vapi-client.js',
        //     allFrames: true,
        //     runAt: 'document_idle'
        // }, function(){ });
        // vAPI.tabs.injectScript(tabId, {
        //     file: 'js/contentscript.js',
        //     allFrames: true,
        //     runAt: 'document_idle'
        // }, scriptDone);
    };
    var bindToTabs = function(tabs) {
        var ub = uBlock;
        var i = tabs.length, tab;
        while ( i-- ) {
            tab = tabs[i];
            // https://github.com/chrisaljoudi/uBlock/issues/129
            if ( /^https?:\/\//.test(tab.url) ) {
                scriptStart(tab.id);
            }
        }
    };

    chrome.tabs.query({ url: '<all_urls>' }, bindToTabs);
};


})();


