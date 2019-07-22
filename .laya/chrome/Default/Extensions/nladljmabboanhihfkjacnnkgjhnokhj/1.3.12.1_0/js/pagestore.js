

'use strict';

/*

A PageRequestStore object is used to store net requests in two ways:

To record distinct net requests
To create a log of net requests

*/




uBlock.PageStore = (function() {



var ub = uBlock;




// To mitigate memory churning
var netFilteringResultCacheEntryJunkyard = [];
var netFilteringResultCacheEntryJunkyardMax = 200;



var NetFilteringResultCacheEntry = function(result, type, logData) {
    this.init(result, type, logData);
};



NetFilteringResultCacheEntry.prototype.init = function(result, type, logData) {
    this.result = result;
    this.type = type;
    this.time = Date.now();
    this.logData = logData;
    return this;
};



NetFilteringResultCacheEntry.prototype.dispose = function() {
    this.result = this.type = '';
    this.logData = undefined;
    if ( netFilteringResultCacheEntryJunkyard.length < netFilteringResultCacheEntryJunkyardMax ) {
        netFilteringResultCacheEntryJunkyard.push(this);
    }
};



NetFilteringResultCacheEntry.factory = function(result, type, logData) {
    if ( netFilteringResultCacheEntryJunkyard.length ) {
        return netFilteringResultCacheEntryJunkyard.pop().init(result, type, logData);
    }
    return new NetFilteringResultCacheEntry(result, type, logData);
};




// To mitigate memory churning
var netFilteringCacheJunkyard = [];
var netFilteringCacheJunkyardMax = 10;



var NetFilteringResultCache = function() {
    this.init();
};



NetFilteringResultCache.factory = function() {
    var entry = netFilteringCacheJunkyard.pop();
    if ( entry === undefined ) {
        entry = new NetFilteringResultCache();
    } else {
        entry.init();
    }
    return entry;
};



NetFilteringResultCache.prototype.init = function() {
    this.urls = Object.create(null);
    this.count = 0;
    this.shelfLife = 15 * 1000;
    this.timer = null;
    this.boundPruneAsyncCallback = this.pruneAsyncCallback.bind(this);
};



NetFilteringResultCache.prototype.dispose = function() {
    this.empty();
    this.boundPruneAsyncCallback = null;
    if ( netFilteringCacheJunkyard.length < netFilteringCacheJunkyardMax ) {
        netFilteringCacheJunkyard.push(this);
    }
    return null;
};



NetFilteringResultCache.prototype.add = function(context, result, logData) {
    var url = context.requestURL,
        type = context.requestType,
        key = type + ' ' + url,
        entry = this.urls[key];
    if ( entry !== undefined ) {
        entry.result = result;
        entry.type = type;
        entry.time = Date.now();
        entry.logData = logData;
        return;
    }
    this.urls[key] = NetFilteringResultCacheEntry.factory(result, type, logData);
    if ( this.count === 0 ) {
        this.pruneAsync();
    }
    this.count += 1;
};



NetFilteringResultCache.prototype.empty = function() {
    for ( var key in this.urls ) {
        this.urls[key].dispose();
    }
    this.urls = Object.create(null);
    this.count = 0;
    if ( this.timer !== null ) {
        clearTimeout(this.timer);
        this.timer = null;
    }
};



NetFilteringResultCache.prototype.compareEntries = function(a, b) {
    return this.urls[b].time - this.urls[a].time;
};



NetFilteringResultCache.prototype.prune = function() {
    var keys = Object.keys(this.urls).sort(this.compareEntries.bind(this));
    var obsolete = Date.now() - this.shelfLife;
    var key, entry;
    var i = keys.length;
    while ( i-- ) {
        key = keys[i];
        entry = this.urls[key];
        if ( entry.time > obsolete ) {
            break;
        }
        entry.dispose();
        delete this.urls[key];
    }
    this.count -= keys.length - i - 1;
    if ( this.count > 0 ) {
        this.pruneAsync();
    }
};



NetFilteringResultCache.prototype.pruneAsync = function() {
    if ( this.timer === null ) {
        this.timer = vAPI.setTimeout(this.boundPruneAsyncCallback, this.shelfLife * 2);
    }
};

NetFilteringResultCache.prototype.pruneAsyncCallback = function() {
    this.timer = null;
    this.prune();
};



NetFilteringResultCache.prototype.lookup = function(context) {
    return this.urls[context.requestType + ' ' + context.requestURL] || undefined;
};




// Frame stores are used solely to associate a URL with a frame id. The
// name `pageHostname` is used because of historical reasons. A more
// appropriate name is `frameHostname` -- something to do in a future
// refactoring.

// To mitigate memory churning
var frameStoreJunkyard = [];
var frameStoreJunkyardMax = 50;



var FrameStore = function(frameURL) {
    this.init(frameURL);
};



FrameStore.factory = function(frameURL) {
    var entry = frameStoreJunkyard.pop();
    if ( entry === undefined ) {
        return new FrameStore(frameURL);
    }
    return entry.init(frameURL);
};



FrameStore.prototype.init = function(frameURL) {
    var uburi = ub.URI;
    this.pageHostname = uburi.hostnameFromURI(frameURL);
    this.pageDomain = uburi.domainFromHostname(this.pageHostname) || this.pageHostname;
    return this;
};



FrameStore.prototype.dispose = function() {
    this.pageHostname = this.pageDomain = '';
    if ( frameStoreJunkyard.length < frameStoreJunkyardMax ) {
        frameStoreJunkyard.push(this);
    }
    return null;
};




// To mitigate memory churning
var pageStoreJunkyard = [];
var pageStoreJunkyardMax = 10;



var PageStore = function(tabId) {
    this.init(tabId);
    this.journal = [];
    this.journalTimer = null;
    this.journalLastCommitted = this.journalLastUncommitted = undefined;
    this.journalLastUncommittedURL = undefined;
};



PageStore.factory = function(tabId) {
    var entry = pageStoreJunkyard.pop();
    if ( entry === undefined ) {
        entry = new PageStore(tabId);
    } else {
        entry.init(tabId);
    }
    return entry;
};



PageStore.prototype.init = function(tabId) {
    var tabContext = ub.tabContextManager.mustLookup(tabId);
    this.tabId = tabId;

    this.tabHostname = tabContext.rootHostname;
    this.title = tabContext.rawURL;
    this.rawURL = tabContext.rawURL;
    this.hostnameToCountMap = new Map();
    this.contentLastModified = 0;
    this.frames = Object.create(null);

    return this;
};



PageStore.prototype.reuse = function(context) {
    // When force refreshing a page, the page store data needs to be reset.

    // If the hostname changes, we can't merely just update the context.
    var tabContext = ub.tabContextManager.mustLookup(this.tabId);
    if ( tabContext.rootHostname !== this.tabHostname ) {
        context = '';
    }

    // If URL changes without a page reload (more and more common), then we
    // need to keep all that we collected for reuse. In particular, not
    // doing so was causing a problem in `videos.foxnews.com`: clicking a
    // video thumbnail would not work, because the frame hierarchy structure
    // was flushed from memory, while not really being flushed on the page.
    if ( context === 'tabUpdated' ) {
        // As part of https://github.com/chrisaljoudi/uBlock/issues/405
        // URL changed, force a re-evaluation of filtering switch
        this.rawURL = tabContext.rawURL;
        return this;
    }

    this.disposeFrameStores();
    this.netFilteringCache = this.netFilteringCache.dispose();
    this.init(this.tabId);
    return this;
};



PageStore.prototype.dispose = function() {
    this.tabHostname = '';
    this.title = '';
    this.rawURL = '';
    this.hostnameToCountMap = null;

    this.disposeFrameStores();
    this.netFilteringCache = this.netFilteringCache.dispose();
    if ( this.journalTimer !== null ) {
        clearTimeout(this.journalTimer);
        this.journalTimer = null;
    }
    this.journal = [];
    this.journalLastUncommittedURL = undefined;
    if ( pageStoreJunkyard.length < pageStoreJunkyardMax ) {
        pageStoreJunkyard.push(this);
    }
    return null;
};



PageStore.prototype.disposeFrameStores = function() {
    var frames = this.frames;
    for ( var k in frames ) {
        frames[k].dispose();
    }
    this.frames = Object.create(null);
};



PageStore.prototype.getFrame = function(frameId) {
    return this.frames[frameId] || null;
};



PageStore.prototype.setFrame = function(frameId, frameURL) {
    var frameStore = this.frames[frameId];
    if ( frameStore ) {
        frameStore.init(frameURL);
    } else {
        this.frames[frameId] = FrameStore.factory(frameURL);
    }
};



PageStore.prototype.createContextFromPage = function() {
    var context = ub.tabContextManager.createContext(this.tabId);
    context.pageHostname = context.rootHostname;
    context.pageDomain = context.rootDomain;
    return context;
};

PageStore.prototype.createContextFromFrameId = function(frameId) {
    var context = ub.tabContextManager.createContext(this.tabId);
    var frameStore = this.frames[frameId];
    if ( frameStore ) {
        context.pageHostname = frameStore.pageHostname;
        context.pageDomain = frameStore.pageDomain;
    } else {
        context.pageHostname = context.rootHostname;
        context.pageDomain = context.rootDomain;
    }
    return context;
};

PageStore.prototype.createContextFromFrameHostname = function(frameHostname) {
    var context = ub.tabContextManager.createContext(this.tabId);
    context.pageHostname = frameHostname;
    context.pageDomain = ub.URI.domainFromHostname(frameHostname) || frameHostname;
    return context;
};



PageStore.prototype.getNetFilteringSwitch = function() {
    return ub.tabContextManager.mustLookup(this.tabId).getNetFilteringSwitch();
};



PageStore.prototype.getSpecificCosmeticFilteringSwitch = function() {
    return this.noCosmeticFiltering !== true;
};



PageStore.prototype.getGenericCosmeticFilteringSwitch = function() {
    return this.noGenericCosmeticFiltering !== true &&
           this.noCosmeticFiltering !== true;
};



PageStore.prototype.toggleNetFilteringSwitch = function(url, scope, state) {
    ub.toggleNetFilteringSwitch(url, scope, state);
    this.netFilteringCache.empty();
};



// https://github.com/gorhill/uBlock/issues/2053
//   There is no way around using journaling to ensure we deal properly with
//   potentially out of order navigation events vs. network request events.

PageStore.prototype.journalAddRequest = function(hostname, result) {
    if ( hostname === '' ) { return; }
    this.journal.push(
        hostname,
        result === 1 ? 0x00000001 : 0x00010000
    );
    if ( this.journalTimer === null ) {
        this.journalTimer = vAPI.setTimeout(this.journalProcess.bind(this, true), 1000);
    }
};

PageStore.prototype.journalAddRootFrame = function(type, url) {
    if ( type === 'committed' ) {
        this.journalLastCommitted = this.journal.length;
        if (
            this.journalLastUncommitted !== undefined &&
            this.journalLastUncommitted < this.journalLastCommitted &&
            this.journalLastUncommittedURL === url
        ) {
            this.journalLastCommitted = this.journalLastUncommitted;
            this.journalLastUncommitted = undefined;
        }
    } else if ( type === 'uncommitted' ) {
        this.journalLastUncommitted = this.journal.length;
        this.journalLastUncommittedURL = url;
    }
    if ( this.journalTimer !== null ) {
        clearTimeout(this.journalTimer);
    }
    this.journalTimer = vAPI.setTimeout(this.journalProcess.bind(this, true), 1000);
};

PageStore.prototype.journalProcess = function(fromTimer) {
    if ( !fromTimer ) {
        clearTimeout(this.journalTimer);
    }
    this.journalTimer = null;

    var journal = this.journal,
        i, n = journal.length,
        hostname, count, hostnameCounts,
        aggregateCounts = 0,
        now = Date.now(),
        pivot = this.journalLastCommitted || 0;

    // Everything after pivot originates from current page.
    for ( i = pivot; i < n; i += 2 ) {
        hostname = journal[i];
        hostnameCounts = this.hostnameToCountMap.get(hostname);
        if ( hostnameCounts === undefined ) {
            hostnameCounts = 0;
            this.contentLastModified = now;
        }
        count = journal[i+1];
        this.hostnameToCountMap.set(hostname, hostnameCounts + count);
        aggregateCounts += count;
    }
    this.perLoadBlockedRequestCount += aggregateCounts & 0xFFFF;
    this.journalLastCommitted = undefined;

    // https://github.com/chrisaljoudi/uBlock/issues/905#issuecomment-76543649
    //   No point updating the badge if it's not being displayed.
    if ( (aggregateCounts & 0xFFFF) && ub.userSettings.showIconBadge ) {
        ub.updateBadgeAsync(this.tabId);
    }

    // Everything before pivot does not originate from current page -- we still
    // need to bump global blocked/allowed counts.
    for ( i = 0; i < pivot; i += 2 ) {
        aggregateCounts += journal[i+1];
    }
    if ( aggregateCounts !== 0 ) {
        ub.localSettings.blockedRequestCount += aggregateCounts & 0xFFFF;
        ub.localSettingsLastModified = now;
    }
    journal.length = 0;
};



PageStore.prototype.filterRequest = function(context) {
    this.logData = undefined;

    var requestType = context.requestType;

    // We want to short-term cache filtering results of collapsible types,
    // because they are likely to be reused, from network request handler and
    // from content script handler.
    if ( 'image media object sub_frame'.indexOf(requestType) === -1 ) {
        return this.filterRequestNoCache(context);
    }

    var tabUrl = ub.tabContextManager.mustLookup(this.tabId).rawURL;
    var isInYoutube = tabUrl.indexOf("youtube.com") > -1;
    if ( isInYoutube ) {
        var blockAdsOnThisDomain = this.getNetFilteringSwitch();
        var youtubeFilterResult = adawareYoutube.filterRequest(tabUrl, blockAdsOnThisDomain);
        if ( youtubeFilterResult === "no-block-ads-on-this-channel" ) {
            this.netFilteringCache.add(context, '');
            return '';
        } 
    }

    if ( this.getNetFilteringSwitch() === false ) {
        this.netFilteringCache.add(context, 0);
        return 0;
    }

    var entry = this.netFilteringCache.lookup(context);
    if ( entry !== undefined ) {
        this.logData = entry.logData;
        return entry.result;
    }

    var result = 0;
    // Static filtering
    if ( result === 0 || result === 3 ) {
        result = ub.staticNetFilteringEngine.matchString(context);
        if ( result !== 0 ) {
            this.logData = ub.staticNetFilteringEngine.toLogData();
        }
    }

    this.netFilteringCache.add(context, result, this.logData);

    return result;
};


PageStore.prototype.filterRequestNoCache = function(context) {
    this.logData = undefined;

    var tabUrl = ub.tabContextManager.mustLookup(this.tabId).rawURL;
    var isInYoutube = tabUrl.indexOf("youtube.com") > -1;
    if ( isInYoutube ) {
        var blockAdsOnThisDomain = this.getNetFilteringSwitch();
        var youtubeFilterResult = adawareYoutube.filterRequest(tabUrl, blockAdsOnThisDomain);

        if ( youtubeFilterResult === "no-block-ads-on-this-channel" ) {
            return '';
        } 
    }

    if ( this.getNetFilteringSwitch() === false ) {
        return 0;
    }

    var requestType = context.requestType;

    if ( requestType === 'csp_report' ) {
        if ( this.internalRedirectionCount !== 0 ) {
            this.logData = { result: 1, source: 'global', raw: 'no-spurious-csp-report' };
            return 1;
        }
    }

    var result = 0;

    // Static filtering has lowest precedence.
    if ( result === 0 || result === 3 ) {
        result = ub.staticNetFilteringEngine.matchString(context);
        if ( result !== 0 ) {
            this.logData = ub.staticNetFilteringEngine.toLogData();
        }
    }

    return result;
};


PageStore.prototype.logBlockedRequestsStats = function(result, group) {
    if (result !== 1) {
        return;
    }

    switch ( group ) {
        case 'ads':
            this.perLoadCategorizedBlockedRequestCount["ads"]++
            break;
        case 'privacy':
            this.perLoadCategorizedBlockedRequestCount["privacy"]++
            break;
        default:
            this.perLoadCategorizedBlockedRequestCount["other"]++
            break;
    }
};



return {
    factory: PageStore.factory
};

})();


