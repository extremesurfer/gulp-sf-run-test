var _ = require('underscore');

function convertCsvFormat(arrayObj){
    var csvStr = '';
    var firstObj = arrayObj[0];

    _.each(firstObj, function(value, key){
        csvStr += key + ','
    });
    csvStr += '\r\n';

    _.each(arrayObj,function(obj){
        _.each(obj, function(value, key){
            csvStr += value + ','
        });
        csvStr += '\r\n';
    });

    return csvStr;
}


var sampleArray = [
    {key1:'aiu1', key2:'ueo1', key3:'kakiku1'},
    {key1:'aiu2', key2:'ueo2', key3:'kakiku2'},
    {key1:'aiu3', key2:'ueo3', key3:'kakiku3'},
    {key1:'aiu4', key2:'ueo4', key3:'kakiku4'},
    {key1:'aiu5', key2:'ueo5', key3:'kakiku5'},
    {key1:'aiu6', key2:'ueo6', key3:'kakiku6'},
    {key1:'aiu7', key2:'ueo7', key3:'kakiku7'},
    {key1:'aiu8', key2:'ueo8', key3:'kakiku8'}
];

console.log(convertCsvFormat(sampleArray));