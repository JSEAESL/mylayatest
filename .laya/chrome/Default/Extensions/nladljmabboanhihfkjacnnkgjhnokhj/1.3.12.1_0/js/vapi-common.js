// For background page or non-background pages

'use strict';


(function() {

var vAPI = self.vAPI = self.vAPI || {};
var chrome = self.chrome;



vAPI.setTimeout = vAPI.setTimeout || self.setTimeout.bind(self);



/**
    * @function setScriptDirection
    * @description Change the direction of body tag for different languages.
    * @see http://www.w3.org/International/questions/qa-scripts#directions
    * @param {string} language - The title of the book
    * @author LavaSoft
    * @version 1.0
*/
var setScriptDirection = function(language) {
    document.body.setAttribute(
        'dir',
        ['ar', 'he', 'fa', 'ps', 'ur'].indexOf(language) !== -1 ? 'rtl' : 'ltr'
    );
};


/**
 * Constructor for Telegram Bot API Client.
 *
 * @class Bot
 * @constructor
 * @param {Object} options        Configurations for the client
 * @param {String} options.token  Bot token
 *
 * @see https://core.telegram.org/bots/api
 */
vAPI.insertHTML = function(node, html) {
    node.innerHTML = html;
};



vAPI.getURL = chrome.runtime.getURL;



vAPI.i18n = chrome.i18n.getMessage;

setScriptDirection(vAPI.i18n('@@ui_locale'));


vAPI.getUILanguage = chrome.i18n.getUILanguage;


// A localStorage-like object which should be accessible from the
// background page or auxiliary pages.
// This storage is optional, but it is nice to have, for a more polished user
// experience.

// This can throw in some contexts (like in devtool).
try {
    vAPI.localStorage = window.localStorage;
} catch (ex) {
}


})();
