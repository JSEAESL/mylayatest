/* global objectAssign */

'use strict';


uBlock.keyvalSetOne = function(key, val, callback) {
    var bin = {};
    bin[key] = val;
    vAPI.storage.set(bin, callback || this.noopFunc);
};

uBlock.saveExternalData = function() {
    this.keyvalSetOne('externalData', adawareTelemetry.getExternalData());
};

uBlock.saveInlineParameters = function(inlineParameters) {
    this.keyvalSetOne('inlineParameters', inlineParameters);
};