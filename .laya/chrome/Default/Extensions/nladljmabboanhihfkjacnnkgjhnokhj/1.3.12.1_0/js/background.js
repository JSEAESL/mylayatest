/* global objectAssign */

'use strict';

var uBlock = (function () { // jshint ignore:line

    return {
        startupTime: 0,

        // TODO: to remove if not using traffic filterer
        pageStores: {},
        pageStoresToken: 0,

        webCompanionData: { // stored persistently
            "searchEngine": "1", // Bing
            "campaignId": "",
            "iDate": "" // webcompanion (localhost) install date
        },

        SEARCH_ENGINE_URL: "https://defaultsearch.co",

        SEARCH_TO_NUM_MAP: {
            "bing": "1",
            "yahoo": "2",
            "lavasoft": "3", // securesearch
            "google": "4",
            "privateSearch": "5",
            "yandex": "6"
        },

        NUM_TO_SEARCH_MAP: {
            "1": "bing",
            "2": "yahoo",
            "3": "lavasoft",
            "4": "google",
            "5": "privateSearch",
            "6": "yandex"
        },

        noopFunc: function () { },

        // so that I don't have to care for last comma
        dummy: 0
    };

})();