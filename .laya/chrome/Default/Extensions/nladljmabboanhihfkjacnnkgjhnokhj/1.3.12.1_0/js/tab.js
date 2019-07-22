




(function() {

'use strict';



var ub = uBlock;

// https://github.com/gorhill/httpswitchboard/issues/303
// Some kind of trick going on here:
//   Any scheme other than 'http' and 'https' is remapped into a fake
//   URL which trick the rest of uBlock into being able to process an
//   otherwise unmanageable scheme. uBlock needs web page to have a proper
//   hostname to work properly, so just like the 'chromium-behind-the-scene'
//   fake domain name, we map unknown schemes into a fake '{scheme}-scheme'
//   hostname. This way, for a specific scheme you can create scope with
//   rules which will apply only to that scheme.




ub.normalizePageURL = function(tabId, pageURL) {
    if ( vAPI.isBehindTheSceneTabId(tabId) ) {
        return 'http://behind-the-scene/';
    }
    var uri = this.URI.set(pageURL);
    var scheme = uri.scheme;
    if ( scheme === 'https' || scheme === 'http' ) {
        return uri.normalizedURI();
    }

    var fakeHostname = scheme + '-scheme';

    if ( uri.hostname !== '' ) {
        fakeHostname = uri.hostname + '.' + fakeHostname;
    } else if ( scheme === 'about' && uri.path !== '' ) {
        fakeHostname = uri.path + '.' + fakeHostname;
    }

    return 'http://' + fakeHostname + '/';
};


/*

To keep track from which context *exactly* network requests are made. This is
often tricky for various reasons, and the challenge is not specific to one
browser.

The time at which a URL is assigned to a tab and the time when a network
request for a root document is made must be assumed to be unrelated: it's all
asynchronous. There is no guaranteed order in which the two events are fired.

Also, other "anomalies" can occur:

- a network request for a root document is fired without the corresponding
tab being really assigned a new URL
<https://github.com/chrisaljoudi/uBlock/issues/516>

- a network request for a secondary resource is labeled with a tab id for
which no root document was pulled for that tab.
<https://github.com/chrisaljoudi/uBlock/issues/1001>

- a network request for a secondary resource is made without the root
document to which it belongs being formally bound yet to the proper tab id,
causing a bad scope to be used for filtering purpose.
<https://github.com/chrisaljoudi/uBlock/issues/1205>
<https://github.com/chrisaljoudi/uBlock/issues/1140>

So the solution here is to keep a lightweight data structure which only
purpose is to keep track as accurately as possible of which root document
belongs to which tab. That's the only purpose, and because of this, there are
no restrictions for when the URL of a root document can be associated to a tab.

Before, the PageStore object was trying to deal with this, but it had to
enforce some restrictions so as to not descend into one of the above issues, or
other issues. The PageStore object can only be associated with a tab for which
a definitive navigation event occurred, because it collects information about
what occurred in the tab (for example, the number of requests blocked for a
page).

The TabContext objects do not suffer this restriction, and as a result they
offer the most reliable picture of which root document URL is really associated
to which tab. Moreover, the TabObject can undo an association from a root
document, and automatically re-associate with the next most recent. This takes
care of <https://github.com/chrisaljoudi/uBlock/issues/516>.

The PageStore object no longer cache the various information about which
root document it is currently bound. When it needs to find out, it will always
defer to the TabContext object, which will provide the real answer. This takes
case of <https://github.com/chrisaljoudi/uBlock/issues/1205>.

Also, the TabContext object will try its best to find a good candidate root
document URL for when none exists. This takes care of 
<https://github.com/chrisaljoudi/uBlock/issues/1001>.

The TabContext manager is self-contained, and it takes care to properly
housekeep itself.

*/

ub.tabContextManager = (function() {
    var tabContexts = Object.create(null);

    // https://github.com/chrisaljoudi/uBlock/issues/1001
    // This is to be used as last-resort fallback in case a tab is found to not
    // be bound while network requests are fired for the tab.
    var mostRecentRootDocURL = '';
    var mostRecentRootDocURLTimestamp = 0;

    var popupCandidates = Object.create(null);

    var PopupCandidate = function(targetTabId, openerTabId) {
        this.targetTabId = targetTabId;
        this.openerTabId = openerTabId;
        this.selfDestructionTimer = null;
        this.launchSelfDestruction();
    };

    PopupCandidate.prototype.destroy = function() {
        if ( this.selfDestructionTimer !== null ) {
            clearTimeout(this.selfDestructionTimer);
        }
        delete popupCandidates[this.targetTabId];
    };

    PopupCandidate.prototype.launchSelfDestruction = function() {
        if ( this.selfDestructionTimer !== null ) {
            clearTimeout(this.selfDestructionTimer);
        }
        this.selfDestructionTimer = vAPI.setTimeout(this.destroy.bind(this), 10000);
    };

    var popupCandidateTest = function(targetTabId) {
        var candidates = popupCandidates, entry;
        for ( var tabId in candidates ) {
            entry = candidates[tabId];
            if ( targetTabId !== tabId && targetTabId !== entry.openerTabId ) {
                continue;
            }
            if ( vAPI.tabs.onPopupUpdated(tabId, entry.openerTabId) === true ) {
                entry.destroy();
            } else {
                entry.launchSelfDestruction();
            }
        }
    };

    vAPI.tabs.onPopupCreated = function(targetTabId, openerTabId) {
        // 
        var popup = popupCandidates[targetTabId];
        if ( popup === undefined ) {
            popupCandidates[targetTabId] = new PopupCandidate(targetTabId, openerTabId);
        }
        popupCandidateTest(targetTabId);
    };

    var gcPeriod = 10 * 60 * 1000;

    // A pushed entry is removed from the stack unless it is committed with
    // a set time.
    var StackEntry = function(url, commit) {
        this.url = url;
        this.committed = commit;
        this.tstamp = Date.now();
    };

    var TabContext = function(tabId) {
        this.tabId = tabId.toString();
        this.stack = [];
        this.rawURL =
        this.normalURL =
        this.rootHostname =
        this.rootDomain = '';
        this.commitTimer = null;
        this.gcTimer = null;
        this.onGCBarrier = false;
        this.netFiltering = true;
        this.netFilteringReadTime = 0;

        tabContexts[tabId] = this;
    };

    TabContext.prototype.destroy = function() {
        if ( vAPI.isBehindTheSceneTabId(this.tabId) ) {
            return;
        }
        if ( this.gcTimer !== null ) {
            clearTimeout(this.gcTimer);
            this.gcTimer = null;
        }
        delete tabContexts[this.tabId];
    };

    TabContext.prototype.onTab = function(tab) {
        if ( tab ) {
            this.gcTimer = vAPI.setTimeout(this.onGC.bind(this), gcPeriod);
        } else {
            this.destroy();
        }
    };

    TabContext.prototype.onGC = function() {
        if ( vAPI.isBehindTheSceneTabId(this.tabId) ) {
            return;
        }
        // https://github.com/gorhill/uBlock/issues/1713
        // For unknown reasons, Firefox's setTimeout() will sometimes
        // causes the callback function to be called immediately, bypassing
        // the main event loop. For now this should prevent uBO from crashing
        // as a result of the bad setTimeout() behavior.
        if ( this.onGCBarrier ) {
            return;
        }
        this.onGCBarrier = true;
        this.gcTimer = null;
        vAPI.tabs.get(this.tabId, this.onTab.bind(this));
        this.onGCBarrier = false;
    };

    // https://github.com/gorhill/uBlock/issues/248
    // Stack entries have to be committed to stick. Non-committed stack
    // entries are removed after a set delay.
    TabContext.prototype.onCommit = function() {
        if ( vAPI.isBehindTheSceneTabId(this.tabId) ) {
            return;
        }
        this.commitTimer = null;
        // Remove uncommitted entries at the top of the stack.
        var i = this.stack.length;
        while ( i-- ) {
            if ( this.stack[i].committed ) {
                break;
            }
        }
        // https://github.com/gorhill/uBlock/issues/300
        // If no committed entry was found, fall back on the bottom-most one
        // as being the committed one by default.
        if ( i === -1 && this.stack.length !== 0 ) {
            this.stack[0].committed = true;
            i = 0;
        }
        i += 1;
        if ( i < this.stack.length ) {
            this.stack.length = i;
            this.update();
        }
    };

    // This takes care of orphanized tab contexts. Can't be started for all
    // contexts, as the behind-the-scene context is permanent -- so we do not
    // want to flush it.
    TabContext.prototype.autodestroy = function() {
        if ( vAPI.isBehindTheSceneTabId(this.tabId) ) {
            return;
        }
        this.gcTimer = vAPI.setTimeout(this.onGC.bind(this), gcPeriod);
    };

    // Update just force all properties to be updated to match the most recent
    // root URL.
    TabContext.prototype.update = function() {
        this.netFilteringReadTime = 0;
        if ( this.stack.length === 0 ) {
            this.rawURL = this.normalURL = this.rootHostname = this.rootDomain = '';
            return;
        }
        var stackEntry = this.stack[this.stack.length - 1];
        this.rawURL = stackEntry.url;
        this.normalURL = ub.normalizePageURL(this.tabId, this.rawURL);
        this.rootHostname = ub.URI.hostnameFromURI(this.normalURL);
        this.rootDomain = ub.URI.domainFromHostname(this.rootHostname) || this.rootHostname;
    };

    // Called whenever a candidate root URL is spotted for the tab.
    TabContext.prototype.push = function(url) {
        if ( vAPI.isBehindTheSceneTabId(this.tabId) ) {
            return;
        }
        var count = this.stack.length;
        if ( count !== 0 && this.stack[count - 1].url === url ) {
            return;
        }
        this.stack.push(new StackEntry(url));
        this.update();
        popupCandidateTest(this.tabId);
        if ( this.commitTimer !== null ) {
            clearTimeout(this.commitTimer);
        }
        this.commitTimer = vAPI.setTimeout(this.onCommit.bind(this), 500);
    };

    // This tells that the url is definitely the one to be associated with the
    // tab, there is no longer any ambiguity about which root URL is really
    // sitting in which tab.
    TabContext.prototype.commit = function(url) {
        if ( vAPI.isBehindTheSceneTabId(this.tabId) ) {
            return;
        }
        this.stack = [new StackEntry(url, true)];
        this.update();
    };

    TabContext.prototype.getNetFilteringSwitch = function() {
        if ( this.netFilteringReadTime > ub.netWhitelistModifyTime ) {
            return this.netFiltering;
        }
        // https://github.com/chrisaljoudi/uBlock/issues/1078
        // Use both the raw and normalized URLs.
        this.netFiltering = ub.getNetFilteringSwitch(this.normalURL);
        if ( this.netFiltering && this.rawURL !== this.normalURL && this.rawURL !== '' ) {
            this.netFiltering = ub.getNetFilteringSwitch(this.rawURL);
        }
        this.netFilteringReadTime = Date.now();
        return this.netFiltering;
    };

    // These are to be used for the API of the tab context manager.

    var push = function(tabId, url) {
        var entry = tabContexts[tabId];
        if ( entry === undefined ) {
            entry = new TabContext(tabId);
            entry.autodestroy();
        }
        entry.push(url);
        mostRecentRootDocURL = url;
        mostRecentRootDocURLTimestamp = Date.now();
        return entry;
    };

    // Find a tab context for a specific tab.
    var lookup = function(tabId) {
        return tabContexts[tabId] || null;
    };

    // Find a tab context for a specific tab. If none is found, attempt to
    // fix this. When all fail, the behind-the-scene context is returned.
    var mustLookup = function(tabId) {
        var entry = tabContexts[tabId];
        if ( entry !== undefined ) {
            return entry;
        }
        // https://github.com/chrisaljoudi/uBlock/issues/1025
        // Google Hangout popup opens without a root frame. So for now we will
        // just discard that best-guess root frame if it is too far in the
        // future, at which point it ceases to be a "best guess".
        if ( mostRecentRootDocURL !== '' && mostRecentRootDocURLTimestamp + 500 < Date.now() ) {
            mostRecentRootDocURL = '';
        }
        // https://github.com/chrisaljoudi/uBlock/issues/1001
        // Not a behind-the-scene request, yet no page store found for the
        // tab id: we will thus bind the last-seen root document to the
        // unbound tab. It's a guess, but better than ending up filtering
        // nothing at all.
        if ( mostRecentRootDocURL !== '' ) {
            return push(tabId, mostRecentRootDocURL);
        }
        // If all else fail at finding a page store, re-categorize the
        // request as behind-the-scene. At least this ensures that ultimately
        // the user can still inspect/filter those net requests which were
        // about to fall through the cracks.
        // Example: Chromium + case #12 at
        //          http://raymondhill.net/ublock/popup.html
        return tabContexts[vAPI.noTabId];
    };

    // https://github.com/gorhill/uBlock/issues/1735
    //   Filter for popups if actually committing.
    var commit = function(tabId, url) {
        var entry = tabContexts[tabId];
        if ( entry === undefined ) {
            entry = push(tabId, url);
        } else {
            entry.commit(url);
            popupCandidateTest(tabId);
        }
        return entry;
    };

    var exists = function(tabId) {
        return tabContexts[tabId] !== undefined;
    };

    // Behind-the-scene tab context
    (function() {
        var entry = new TabContext(vAPI.noTabId);
        entry.stack.push(new StackEntry('', true));
        entry.rawURL = '';
        entry.normalURL = ub.normalizePageURL(entry.tabId);
        entry.rootHostname = ub.URI.hostnameFromURI(entry.normalURL);
        entry.rootDomain = ub.URI.domainFromHostname(entry.rootHostname);
    })();

    // Context object, typically to be used to feed filtering engines.
    var contextJunkyard = [];
    var Context = function(tabId) {
        this.init(tabId);
    };
    Context.prototype.init = function(tabId) {
        var tabContext = lookup(tabId);
        this.rootHostname = tabContext.rootHostname;
        this.rootDomain = tabContext.rootDomain;
        this.pageHostname = 
        this.pageDomain =
        this.requestURL =
        this.requestHostname =
        this.requestDomain = '';
        return this;
    };
    Context.prototype.dispose = function() {
        contextJunkyard.push(this);
    };

    var createContext = function(tabId) {
        if ( contextJunkyard.length ) {
            return contextJunkyard.pop().init(tabId);
        }
        return new Context(tabId);
    };

    return {
        push: push,
        commit: commit,
        lookup: lookup,
        mustLookup: mustLookup,
        exists: exists,
        createContext: createContext
    };
})();



// https://github.com/gorhill/uBlock/issues/99
// https://github.com/gorhill/uBlock/issues/991
// 
// popup:
//   Test/close target URL
// popunder:
//   Test/close opener URL
//
// popup filter match:
//   0 = false
//   1 = true
//
// opener:      0     0     1     1
// target:      0     1     0     1
//           ----  ----  ----  ----
// result:      a     b     c     d
//
// a: do nothing
// b: close target
// c: close opener
// d: close target

vAPI.tabs.onPopupUpdated = (function() {
    // The same context object will be reused everytime. This also allows to
    // remember whether a popup or popunder was matched.
    var context = {},
        logData;

    // https://github.com/gorhill/uBlock/commit/1d448b85b2931412508aa01bf899e0b6f0033626#commitcomment-14944764
    // See if two URLs are different, disregarding scheme -- because the scheme
    // can be unilaterally changed by the browser.
    var areDifferentURLs = function(a, b) {
        // https://github.com/gorhill/uBlock/issues/1378
        // Maybe no link element was clicked.
        if ( b === '' ) {
            return true;
        }
        var pos = a.indexOf('://');
        if ( pos === -1 ) {
            return false;
        }
        a = a.slice(pos);
        pos = b.indexOf('://');
        if ( pos === -1 ) {
            return false;
        }
        return b.slice(pos) !== a;
    };

    var popupMatch = function(openerURL, targetURL, clickedURL, popupType) {
        var openerHostname = ub.URI.hostnameFromURI(openerURL),
            openerDomain = ub.URI.domainFromHostname(openerHostname),
            result;

        context.pageHostname = openerHostname;
        context.pageDomain = openerDomain;
        context.rootURL = openerURL;
        context.rootHostname = openerHostname;
        context.rootDomain = openerDomain;
        context.requestURL = targetURL;
        context.requestHostname = ub.URI.hostnameFromURI(targetURL);
        context.requestType = 'popup';

        // https://github.com/gorhill/uBlock/issues/1735
        //   Do not bail out on `data:` URI, they are commonly used for popups.
        // https://github.com/uBlockOrigin/uAssets/issues/255
        //   Do not bail out on `about:blank`: an `about:blank` popup can be
        //   opened, with the sole purpose to serve as an intermediary in
        //   a sequence of chained popups.
        // https://github.com/uBlockOrigin/uAssets/issues/263#issuecomment-272615772
        //   Do not bail out, period: the static filtering engine must be
        //   able to examine all sorts of URLs for popup filtering purpose.

        // https://github.com/gorhill/uBlock/commit/1d448b85b2931412508aa01bf899e0b6f0033626#commitcomment-14944764
        //   Ignore bad target URL. On Firefox, an `about:blank` tab may be
        //   opened for a new tab before it is filled in with the real target
        //   URL.
        if ( openerHostname !== '' && targetURL !== 'about:blank' ) {
            // Check per-site switch first
            if ( ub.blockPopupStatus === true ) {
                if (
                    typeof clickedURL === 'string' &&
                    areDifferentURLs(targetURL, clickedURL)
                ) {
                    logData = {
                        source: 'switch',
                        raw: 'no-popups: ' + ub.hnSwitches.z + ' true'
                    };
                    return 1;
                }
            }
        }

        // https://github.com/chrisaljoudi/uBlock/issues/323
        // https://github.com/chrisaljoudi/uBlock/issues/1142
        //   Don't block if uBlock is turned off in popup's context
        if ( ub.getNetFilteringSwitch(targetURL) ) {
            result = ub.staticNetFilteringEngine.matchStringExactType(
                context,
                targetURL,
                popupType
            );
            if ( result !== 0 ) {
                logData = ub.staticNetFilteringEngine.toLogData();
                return result;
            }
        }

        return 0;
    };

    var mapPopunderResult = function(popunderURL, popunderHostname, result) {
        if (
            logData === undefined ||
            logData.source !== 'static' ||
            logData.token === ub.staticNetFilteringEngine.noTokenHash
        ) {
            return 0;
        }
        if ( logData.token === ub.staticNetFilteringEngine.dotTokenHash ) {
            return result;
        }
        var re = new RegExp(logData.regex),
            matches = re.exec(popunderURL);
        if ( matches === null ) { return 0; }
        var beg = matches.index,
            end = beg + matches[0].length,
            pos = popunderURL.indexOf(popunderHostname);
        if ( pos === -1 ) { return 0; }
        // https://github.com/gorhill/uBlock/issues/1471
        //   We test whether the opener hostname as at least one character
        //   within matched portion of URL.
        // https://github.com/gorhill/uBlock/issues/1903
        //   Ignore filters which cause a match before the start of the
        //   hostname in the URL.
        return beg >= pos && beg < pos + popunderHostname.length && end > pos
            ? result
            : 0;
    };

    var popunderMatch = function(openerURL, targetURL) {
        var result = popupMatch(targetURL, openerURL, null, 'popunder');
        if ( result === 1 ) {
            return result;
        }
        // https://github.com/gorhill/uBlock/issues/1010#issuecomment-186824878
        //   Check the opener tab as if it were the newly opened tab: if there
        //   is a hit against a popup filter, and if the matching filter is not
        //   a broad one, we will consider the opener tab to be a popunder tab.
        //   For now, a "broad" filter is one which does not touch any part of
        //   the hostname part of the opener URL.
        var popunderURL = openerURL,
            popunderHostname = ub.URI.hostnameFromURI(popunderURL);
        if ( popunderHostname === '' ) {
            return 0;
        }
        result = mapPopunderResult(
            popunderURL,
            popunderHostname,
            popupMatch(targetURL, popunderURL, null, 'popup')
        );
        if ( result !== 0 ) {
            return result;
        }
        // https://github.com/gorhill/uBlock/issues/1598
        // Try to find a match against origin part of the opener URL.
        popunderURL = ub.URI.originFromURI(popunderURL);
        if ( popunderURL === '' ) {
            return 0;
        }
        return mapPopunderResult(
            popunderURL,
            popunderHostname,
            popupMatch(targetURL, popunderURL, null, 'popup')
        );
    };

    return function(targetTabId, openerTabId) {
        // return; // disable builtin ublock origin's popup blocker
        // Opener details.
        var tabContext = ub.tabContextManager.lookup(openerTabId);
        if ( tabContext === null ) { return; }
        var openerURL = tabContext.rawURL;
        if ( openerURL === '' ) { return; }

        // Popup details.
        tabContext = ub.tabContextManager.lookup(targetTabId);
        if ( tabContext === null ) { return; }
        var targetURL = tabContext.rawURL;
        if ( targetURL === '' ) { return; }

        // https://github.com/gorhill/uBlock/issues/1538
        if ( ub.getNetFilteringSwitch(ub.normalizePageURL(openerTabId, openerURL)) === false ) {
            return;
        }

        return true;
    };
})();

vAPI.tabs.registerListeners();




// Create an entry for the tab if it doesn't exist.

ub.bindTabToPageStats = function(tabId, context) {
    // this.updateBadgeAsync(tabId);

    // Do not create a page store for URLs which are of no interests
    if ( ub.tabContextManager.exists(tabId) === false ) {
        this.unbindTabFromPageStats(tabId);
        return null;
    }

    // Reuse page store if one exists: this allows to guess if a tab is a popup
    var pageStore = this.pageStores[tabId];

    // Tab is not bound
    if ( !pageStore ) {
        this.updateTitle(tabId);
        this.pageStoresToken = Date.now();
        return (this.pageStores[tabId] = this.PageStore.factory(tabId));
    }

    // https://github.com/chrisaljoudi/uBlock/issues/516
    //   Never rebind behind-the-scene scope.
    if ( vAPI.isBehindTheSceneTabId(tabId) ) {
        return pageStore;
    }

    // https://github.com/chrisaljoudi/uBlock/issues/516
    //   If context is 'beforeRequest', do not rebind, wait for confirmation.
    if ( context === 'beforeRequest' ) {
        return pageStore;
    }

    // Rebind according to context. We rebind even if the URL did not change,
    // as maybe the tab was force-reloaded, in which case the page stats must
    // be all reset.
    pageStore.reuse(context);

    this.updateTitle(tabId);
    this.pageStoresToken = Date.now();

    return pageStore;
};



ub.unbindTabFromPageStats = function(tabId) {
    //
    var pageStore = this.pageStores[tabId];
    if ( pageStore !== undefined ) {
        pageStore.dispose();
        delete this.pageStores[tabId];
        this.pageStoresToken = Date.now();
    }
};



ub.pageStoreFromTabId = function(tabId) {
    return this.pageStores[tabId] || null;
};

ub.mustPageStoreFromTabId = function(tabId) {
    return this.pageStores[tabId] || this.pageStores[vAPI.noTabId];
};



// Permanent page store for behind-the-scene requests. Must never be removed.

ub.pageStores[vAPI.noTabId] = ub.PageStore.factory(vAPI.noTabId);
ub.pageStores[vAPI.noTabId].title = vAPI.i18n('logBehindTheScene');



// Update visual of extension icon.

ub.updateBadgeAsync = (function() {
    var tabIdToTimer = Object.create(null);

    var updateBadge = function(tabId) {
        delete tabIdToTimer[tabId];

        var state = false;
        var badge = '';

        var pageStore = this.pageStoreFromTabId(tabId);
        if ( pageStore !== null ) {
            state = pageStore.getNetFilteringSwitch();
            if ( state && this.userSettings.showIconBadge && pageStore.perLoadBlockedRequestCount ) {
                badge = this.formatCount(pageStore.perLoadBlockedRequestCount);
            }
        }
        vAPI.setIcon(tabId, state ? 'on' : 'off', badge);
    };

    return function(tabId) {
        if ( tabIdToTimer[tabId] ) {
            return;
        }
        if ( vAPI.isBehindTheSceneTabId(tabId) ) {
            return;
        }
        tabIdToTimer[tabId] = vAPI.setTimeout(updateBadge.bind(this, tabId), 666);
    };
})();



ub.updateTitle = (function() {
    var tabIdToTimer = Object.create(null);
    var tabIdToTryCount = Object.create(null);
    var delay = 499;

    var tryNoMore = function(tabId) {
        delete tabIdToTryCount[tabId];
    };

    var tryAgain = function(tabId) {
        var count = tabIdToTryCount[tabId];
        if ( count === undefined ) {
            return false;
        }
        if ( count === 1 ) {
            delete tabIdToTryCount[tabId];
            return false;
        }
        tabIdToTryCount[tabId] = count - 1;
        tabIdToTimer[tabId] = vAPI.setTimeout(updateTitle.bind(ub, tabId), delay);
        return true;
    };

    var onTabReady = function(tabId, tab) {
        if ( !tab ) {
            return tryNoMore(tabId);
        }
        var pageStore = this.pageStoreFromTabId(tabId);
        if ( pageStore === null ) {
            return tryNoMore(tabId);
        }
        // Firefox needs this: if you detach a tab, the new tab won't have
        // its rawURL set. Concretely, this causes the logger to report an
        // entry to itself in the logger's tab selector.
        // TODO: Investigate for a fix vAPI-side.
        pageStore.rawURL = tab.url;
        this.pageStoresToken = Date.now();
        if ( !tab.title && tryAgain(tabId) ) {
            return;
        }
        // https://github.com/gorhill/uMatrix/issues/225
        // Sometimes title changes while page is loading.
        var settled = tab.title && tab.title === pageStore.title;
        pageStore.title = tab.title || tab.url || '';
        this.pageStoresToken = Date.now();
        if ( settled || !tryAgain(tabId) ) {
            tryNoMore(tabId);
        }
    };

    var updateTitle = function(tabId) {
        delete tabIdToTimer[tabId];
        vAPI.tabs.get(tabId, onTabReady.bind(this, tabId));
    };

    return function(tabId) {
        if ( vAPI.isBehindTheSceneTabId(tabId) ) {
            return;
        }
        if ( tabIdToTimer[tabId] ) {
            clearTimeout(tabIdToTimer[tabId]);
        }
        tabIdToTimer[tabId] = vAPI.setTimeout(updateTitle.bind(this, tabId), delay);
        tabIdToTryCount[tabId] = 5;
    };
})();



// Stale page store entries janitor
// https://github.com/chrisaljoudi/uBlock/issues/455

var pageStoreJanitorPeriod = 15 * 60 * 1000;
var pageStoreJanitorSampleAt = 0;
var pageStoreJanitorSampleSize = 10;

var pageStoreJanitor = function() {
    var vapiTabs = vAPI.tabs;
    var tabIds = Object.keys(ub.pageStores).sort();
    var checkTab = function(tabId) {
        vapiTabs.get(tabId, function(tab) {
            if ( !tab ) {
                //
                ub.unbindTabFromPageStats(tabId);
            }
        });
    };
    if ( pageStoreJanitorSampleAt >= tabIds.length ) {
        pageStoreJanitorSampleAt = 0;
    }
    var tabId;
    var n = Math.min(pageStoreJanitorSampleAt + pageStoreJanitorSampleSize, tabIds.length);
    for ( var i = pageStoreJanitorSampleAt; i < n; i++ ) {
        tabId = tabIds[i];
        // Do not remove behind-the-scene page store
        if ( vAPI.isBehindTheSceneTabId(tabId) ) {
            continue;
        }
        checkTab(tabId);
    }
    pageStoreJanitorSampleAt = n;

    vAPI.setTimeout(pageStoreJanitor, pageStoreJanitorPeriod);
};

vAPI.setTimeout(pageStoreJanitor, pageStoreJanitorPeriod);



})();


