/**
 * * underscore-mixin.js
 * * @author Satoshi Haga
 * * @date 2015/12/30
 **/

'use strict';

var _ = require('underscore');

_.mixin({

    /**
     * * formatAsCsv
     * * format array to csv-formatted string
     * * @param {Array} arrayObj
     * * @return {String}
     */
    formatAsCsv: function formatAsCsv(arrayObj) {
        var csvStr = '';
        var firstObj = arrayObj[0];

        _.each(firstObj, function (value, key) {
            csvStr += key + ',';
        });
        csvStr += '\r\n';

        _.each(arrayObj, function (obj) {
            _.each(obj, function (value, key) {
                csvStr += value + ',';
            });
            csvStr += '\r\n';
        });

        return csvStr;
    }
});