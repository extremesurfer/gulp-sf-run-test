/**
 * * underscore-mixin.js
 * * @author Satoshi Haga
 * * @date 2015/12/30
 **/

var _ = require('underscore');

_.mixin({

    /**
     * * formatAsCsv
     * * format array to csv-formatted string
     * * @param {Array} arrayObj
     * * @return {String}
     */
    formatAsCsv: (arrayObj)=> {
        let csvStr = '';
        let firstObj = arrayObj[0];

        _.each(firstObj, (value, key)=>{
            csvStr += `${key},`;
        });
        csvStr += '\r\n';

        _.each(arrayObj,(obj)=>{
            _.each(obj, (value, key)=>{
                csvStr += `${value},`;
            });
            csvStr += '\r\n';
        });

        return csvStr;
    }
});